// src/index.ts
import express from 'express';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import jwt from 'jsonwebtoken';

import connectDB, { getDBState, closeDB } from './config/db.js';
import redis, { pingRedis, closeRedis, createRedisPubSubClients } from './config/redis.js';
import { setupSocketServer } from './socket/index.js';
import { Message, createMessageIdempotent } from './models/message.js';
import { Thread } from './models/thread.js';
import { ThreadParticipant } from './models/threadParticipant.js';

dotenv.config();

const PORT = Number(process.env.PORT || 4000);
const CORS_ORIGIN = process.env.CORS_ORIGIN?.split(',').map(s => s.trim()).filter(Boolean) || ['*'];

// —— 基础环境校验（最少要有 JWT_SECRET 和 MONGO_URL）——
function validateEnv() {
  const missing: string[] = [];
  if (!process.env.JWT_SECRET) missing.push('JWT_SECRET');
  if (!process.env.MONGO_URL) missing.push('MONGO_URL');
  // REDIS_* 可选（redis.ts 已有默认 localhost），但推荐配置 REDIS_URL
  if (missing.length) {
    throw new Error(`Missing required env(s): ${missing.join(', ')}`);
  }
}

// —— 解析 CORS 源 ——
// 如果是 '*' 则放开所有；否则传入数组白名单
function buildCorsOrigin() {
  if (CORS_ORIGIN.length === 1 && CORS_ORIGIN[0] === '*') return '*';
  return CORS_ORIGIN;
}

async function main() {
  validateEnv();

  // 连接 Mongo
  await connectDB();

  // Express + HTTP
  const app = express();
  app.use(express.json());

  const httpServer = createServer(app);

  // Socket.IO
  const io = new Server(httpServer, {
    cors: {
      origin: buildCorsOrigin(),
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // 集群化：使用 Redis 适配器广播跨实例事件
  try {
    const { pub, sub } = createRedisPubSubClients();
    io.adapter(createAdapter(pub as any, sub as any));
    console.log('🔗 Socket.IO Redis adapter enabled');
  } catch (e) {
    console.warn('⚠️ Failed to enable Socket.IO Redis adapter:', e);
  }

  // 装载 Socket 实时逻辑（其中包含 Redis presence + Mongo 兜底）
  setupSocketServer(io);

  // 健康检查
  app.get('/', async (_req, res) => {
    const redisOk = await pingRedis();
    const dbState = getDBState(); // 0=disconnected,1=connected,2=connecting,3=disconnecting
    res.json({
      ok: redisOk && dbState === 1,
      dbState,
      redisOk,
      time: new Date().toISOString(),
      service: 'Chat Service is running',
    });
  });

  // 简单历史消息查询：基于对端用户ID，按时间倒序分页
  app.get('/chat/history/:peerId', async (req, res) => {
    try {
      const auth = req.headers['authorization'] as string | undefined;
      const token = auth?.startsWith('Bearer ') ? auth.slice(7) : undefined;
      if (!token) return res.status(401).json({ error: 'Unauthorized' });
      const decoded = (await (async () => {
        try { return jwt.verify(token, process.env.JWT_SECRET!) as any; } catch { return null; }
      })());
      const userId = String(decoded?.userId ?? decoded?.sub ?? '');
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });

      const peerId = String(req.params.peerId);
      const limit = Math.min(Number(req.query.limit ?? 50), 100);
      const before = req.query.before ? new Date(String(req.query.before)) : null;

      const q: any = {
        $or: [
          { fromUserId: userId, toUserId: peerId },
          { fromUserId: peerId, toUserId: userId },
        ],
      };
      if (before && !isNaN(before.getTime())) {
        q.createdAt = { $lt: before };
      }

      const docs = await Message
        .find(q)
        .sort({ createdAt: -1, _id: -1 })
        .limit(limit)
        .lean();

      const messages = docs
        .reverse()
        .map(d => ({
          _id: String((d as any)._id),
          senderId: String(d.fromUserId),
          content: d.content,
          createdAt: (d.createdAt as Date).toISOString(),
        }));

      res.json({ messages });
    } catch (e) {
      console.error('GET /chat/history error', e);
      res.status(500).json({ error: 'Failed to load history' });
    }
  });

  // —— Thread-based APIs ——
  // Create or get DM thread
  app.post('/chat/threads', async (req, res) => {
    try {
      const auth = req.headers['authorization'] as string | undefined;
      const token = auth?.startsWith('Bearer ') ? auth.slice(7) : undefined;
      if (!token) return res.status(401).json({ error: 'Unauthorized' });
      const decoded = (jwt.verify(token, process.env.JWT_SECRET!) as any);
      const userId = String(decoded?.userId ?? decoded?.sub ?? '');
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });

      const participantId = String(req.body?.participantId ?? '');
      if (!participantId || participantId === userId) return res.status(400).json({ error: 'Bad participant' });

      // Find existing dm thread between two participants
      const existing = await ThreadParticipant.aggregate([
        { $match: { userId: { $in: [userId, participantId] } } },
        { $group: { _id: '$threadId', users: { $addToSet: '$userId' }, count: { $sum: 1 } } },
        { $match: { count: 2, users: { $all: [userId, participantId] } } },
        { $limit: 1 },
      ]);

      let threadId: string;
      if (existing.length) {
        threadId = String(existing[0]._id);
      } else {
        const t = await Thread.create({ type: 'dm', lastMsgAt: null });
        threadId = String((t as any)._id);
        await ThreadParticipant.create([
          { threadId, userId, joinedAt: new Date() },
          { threadId, userId: participantId, joinedAt: new Date() },
        ]);
      }

      const thread = await Thread.findById(threadId).lean();
      return res.json({ thread: { id: threadId, type: thread?.type ?? 'dm', lastMsgAt: thread?.lastMsgAt ?? null, otherUser: { id: participantId } } });
    } catch (e) {
      console.error('POST /chat/threads error', e);
      res.status(500).json({ error: 'Failed to start thread' });
    }
  });

  // List my threads (simple)
  app.get('/chat/threads', async (req, res) => {
    try {
      const auth = req.headers['authorization'] as string | undefined;
      const token = auth?.startsWith('Bearer ') ? auth.slice(7) : undefined;
      if (!token) return res.status(401).json({ error: 'Unauthorized' });
      const decoded = (jwt.verify(token, process.env.JWT_SECRET!) as any);
      const userId = String(decoded?.userId ?? decoded?.sub ?? '');
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });

      const parts = await ThreadParticipant.find({ userId }, { threadId: 1 }).lean();
      const ids = parts.map(p => p.threadId);
      const threads = await Thread.find({ _id: { $in: ids } }).sort({ lastMsgAt: -1, _id: -1 }).lean();
      res.json({ threads: threads.map(t => ({ id: String((t as any)._id), type: t.type, lastMsgAt: t.lastMsgAt ?? null })) });
    } catch (e) {
      console.error('GET /chat/threads error', e);
      res.status(500).json({ error: 'Failed to load threads' });
    }
  });

  // Messages by threadId
  app.get('/chat/threads/:threadId/messages', async (req, res) => {
    try {
      const auth = req.headers['authorization'] as string | undefined;
      const token = auth?.startsWith('Bearer ') ? auth.slice(7) : undefined;
      if (!token) return res.status(401).json({ error: 'Unauthorized' });
      const decoded = (jwt.verify(token, process.env.JWT_SECRET!) as any);
      const userId = String(decoded?.userId ?? decoded?.sub ?? '');
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });

      const threadId = String(req.params.threadId);
      const part = await ThreadParticipant.findOne({ threadId, userId }).lean();
      if (!part) return res.status(403).json({ error: 'Forbidden' });

      const limit = Math.min(Number(req.query.limit ?? 50), 100);
      const before = req.query.before ? new Date(String(req.query.before)) : null;
      const q: any = { threadId };
      if (before && !isNaN(before.getTime())) {
        q.createdAt = { $lt: before };
      }
      const docs = await Message.find(q).sort({ createdAt: -1, _id: -1 }).limit(limit).lean();
      const messages = docs.reverse().map(d => ({
        _id: String((d as any)._id),
        threadId: String(d.threadId),
        senderId: String(d.fromUserId),
        content: d.content,
        createdAt: (d.createdAt as Date).toISOString(),
        clientMsgId: d.clientMsgId,
      }));
      res.json({ messages });
    } catch (e) {
      console.error('GET /chat/threads/:threadId/messages error', e);
      res.status(500).json({ error: 'Failed to load messages' });
    }
  });

  // Optional POST message endpoint (idempotent)
  app.post('/chat/threads/:threadId/messages', async (req, res) => {
    try {
      const auth = req.headers['authorization'] as string | undefined;
      const token = auth?.startsWith('Bearer ') ? auth.slice(7) : undefined;
      if (!token) return res.status(401).json({ error: 'Unauthorized' });
      const decoded = (jwt.verify(token, process.env.JWT_SECRET!) as any);
      const userId = String(decoded?.userId ?? decoded?.sub ?? '');
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });

      const threadId = String(req.params.threadId);
      const part = await ThreadParticipant.findOne({ threadId, userId }).lean();
      if (!part) return res.status(403).json({ error: 'Forbidden' });

      const content = String(req.body?.content ?? '').trim();
      const clientMsgId = req.body?.clientMsgId ? String(req.body.clientMsgId) : undefined;
      if (!content) return res.status(400).json({ error: 'Empty content' });

      // find peer in dm
      const peers = await ThreadParticipant.find({ threadId }).lean();
      const toUserId = String((peers.find(p => p.userId !== userId) as any)?.userId ?? '');

      const { doc } = await createMessageIdempotent({
        threadId,
        fromUserId: userId,
        toUserId,
        content,
        status: 'sent',
        ...(clientMsgId && { clientMsgId })
      });
      await Thread.updateOne({ _id: threadId }, { $set: { lastMsgAt: doc.createdAt } });

      const payload = {
        threadId,
        id: String((doc as any)._id),
        senderId: userId,
        content: doc.content,
        createdAt: doc.createdAt,
        clientMsgId: doc.clientMsgId,
      };
      res.json({ message: payload });
    } catch (e) {
      console.error('POST /chat/threads/:threadId/messages error', e);
      res.status(500).json({ error: 'Failed to send message' });
    }
  });

  // 在线状态查询（简单版：读 Redis；Redis 不可用时返回 unknown）
  app.get('/users/:id/status', async (req, res) => {
    const userId = req.params.id;
    try {
      const [online, lastOnlineAt] = await redis.hmget(`user:${userId}`, 'online', 'lastOnlineAt');
      res.json({
        userId,
        online: online === '1',
        lastOnlineAt: lastOnlineAt ? Number(lastOnlineAt) : null,
      });
    } catch (e) {
      // Redis 不可用：返回未知
      res.status(200).json({
        userId,
        online: null,
        lastOnlineAt: null,
        note: 'Redis unavailable; presence unknown',
      });
    }
  });

  // 启动
  httpServer.listen(PORT, () => {
    console.log(`🚀 Server is listening on port ${PORT}`);
  });

  // 优雅关停
  async function shutdown(signal: string) {
    console.log(`\n🧹 Received ${signal}, shutting down gracefully...`);
    try {
      io.close(); // 停止接收新连接
      await new Promise<void>(resolve => httpServer.close(() => resolve()));
      await closeDB();
      await closeRedis();
      console.log('✅ Graceful shutdown complete.');
      process.exit(0);
    } catch (err) {
      console.error('❌ Error during shutdown:', err);
      process.exit(1);
    }
  }
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

// 统一入口
main().catch(err => {
  console.error('❌ Failed to start server:', err);
  process.exit(1);
});
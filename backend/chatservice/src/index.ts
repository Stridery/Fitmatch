// src/index.ts
import express from 'express';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';

import connectDB, { getDBState, closeDB } from './config/db.js';
import redis, { pingRedis, closeRedis } from './config/redis.js';
import { setupSocketServer } from './socket/index.js';

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
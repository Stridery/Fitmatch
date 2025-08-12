import crypto from 'crypto';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import redis from '../config/redis.js';                 // 你前面提供的是默认导出
import type { MessageStatus } from '../models/message.js';
import { createMessageIdempotent, Message } from '../models/message.js';

interface JWTPayload { userId?: string; sub?: string; iat?: number; exp?: number; }
interface SocketWithAuth extends Socket { data: { userId: string }; }
interface SendPayload { toUserId: string; message: string; clientMsgId?: string; }

const userSockets = new Map<string, Set<string>>(); // 多设备支持



function mask(str: string, show = 6) {
  if (!str) return '';
  if (str.length <= show * 2) return '*'.repeat(str.length);
  return str.slice(0, show) + '...' + str.slice(-show);
}

function peekJwt(token: string) {
  try {
    // 只解码，不校验，用于调试 alg / kid / exp 等
    const decoded = (jwt as any).decode(token, { complete: true }) as any;
    return {
      alg: decoded?.header?.alg,
      kid: decoded?.header?.kid,
      exp: decoded?.payload?.exp,
      iat: decoded?.payload?.iat,
      sub: decoded?.payload?.sub,
      userId: decoded?.payload?.userId,
    };
  } catch {
    return null;
  }
}


function bindSocket(userId: string, socketId: string) {
  if (!userSockets.has(userId)) userSockets.set(userId, new Set());
  userSockets.get(userId)!.add(socketId);
}
function unbindSocket(userId: string, socketId: string) {
  const set = userSockets.get(userId);
  if (!set) return;
  set.delete(socketId);
  if (set.size === 0) userSockets.delete(userId);
}
function targetsOf(userId: string) {
  return Array.from(userSockets.get(userId) ?? []);
}

// —— 简单每用户速率限制（内存版，后续可换 Redis INCR/EXPIRE）——
const rateMap = new Map<string, { c: number; t: number }>();
function isRateLimited(userId: string, limit = 10): boolean {
  const now = Date.now();
  const rec = rateMap.get(userId);
  if (!rec || now - rec.t > 60_000) { rateMap.set(userId, { c: 1, t: now }); return false; }
  rec.c += 1; return rec.c > limit;
}

export function setupSocketServer(io: Server) {
  // 鉴权中间件：兼容 payload.userId / payload.sub
  

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) return next(new Error('No token provided'));
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
      const uid = String(decoded.userId ?? decoded.sub ?? '');
      if (!uid) return next(new Error('Invalid token payload'));
      (socket as SocketWithAuth).data = { userId: uid };
      next();
    } catch (e) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', async (socket: SocketWithAuth) => {
    const userId = socket.data.userId;
    bindSocket(userId, socket.id);
    console.log('✅ User connected:', userId, socket.id);

    // 拉取并清空离线消息队列
    try {
      const key = `offline:${userId}`;
      const list = await redis.lrange(key, 0, -1);
      if (list.length) {
        for (const raw of list) {
          try { socket.emit('privateMessage', JSON.parse(raw)); } catch {}
        }
        await redis.del(key);
        console.log(`📬 Delivered ${list.length} offline messages to ${userId}`);
      }
    } catch (e) {
      console.error('❌ Offline delivery error:', e);
    }

    // 发送私信（幂等）
    socket.on('privateMessage', async (data: SendPayload) => {
      try {
        if (isRateLimited(userId)) {
          socket.emit('error', { code: 'RATE_LIMIT', message: 'Too many messages. Please slow down.' });
          return;
        }
        const toUserId = typeof data?.toUserId === 'string' ? data.toUserId : '';
        let content = typeof data?.message === 'string' ? data.message.trim() : '';
        if (!toUserId) { socket.emit('error', { code: 'BAD_RECIPIENT', message: 'Invalid recipient' }); return; }
        if (!content) { socket.emit('error', { code: 'EMPTY', message: 'Message cannot be empty' }); return; }
        if (content.length > 1000) { socket.emit('error', { code: 'TOO_LONG', message: 'Message too long' }); return; }

        const onlineTargets = targetsOf(toUserId);
        const status: MessageStatus = onlineTargets.length ? 'delivered' : 'sent';

        // 幂等写库
        const { doc, created } = await createMessageIdempotent({
          fromUserId: userId,
          toUserId,
          content,
          status,
          ...(data.clientMsgId && { clientMsgId: data.clientMsgId })
        });

        // 统一响应负载（用 DB 的 createdAt，保证前后端排序一致）
        const payload = {
          fromUserId: userId,
          toUserId,
          message: doc.content,
          status: doc.status,
          timestamp: doc.createdAt,
          messageId: String((doc as any)._id),
          clientMsgId: data.clientMsgId
        };

        // 在线设备群发；不在线则入离线队列
        if (onlineTargets.length) {
          for (const sid of onlineTargets) io.to(sid).emit('privateMessage', payload);
        } else {
          await redis.rpush(`offline:${toUserId}`, JSON.stringify(payload));
          console.log(`📦 Stored offline message for ${toUserId}`);
        }

        // 给发送者 ACK（带 created 标志）
        socket.emit('messageSent', { messageId: payload.messageId, status: payload.status, timestamp: payload.timestamp, created });
      } catch (e) {
        console.error('❌ Send error:', e);
        socket.emit('error', { code: 'SEND_FAIL', message: 'Failed to send message' });
      }
    });

    // 批量已读
    socket.on('markAsRead', async (data: { messageIds: string[] }) => {
      try {
        const ids = Array.isArray(data?.messageIds) ? data.messageIds : [];
        if (!ids.length) return;

        // 一次性查出发送者，避免 N+1
        const msgs = await Message.find({ _id: { $in: ids }, toUserId: userId }, { fromUserId: 1 }).lean();
        if (!msgs.length) return;

        await Message.updateMany({ _id: { $in: ids }, toUserId: userId }, { $set: { status: 'read' } });

        // 按发送者分组通知
        const bySender = new Map<string, string[]>();
        for (const m of msgs) {
          const arr = bySender.get(m.fromUserId as any) ?? [];
          arr.push(String((m as any)._id));
          bySender.set(m.fromUserId as any, arr);
        }
        for (const [senderId, msgIds] of bySender) {
          for (const sid of targetsOf(senderId)) {
            io.to(sid).emit('messageRead', { messageIds: msgIds, readBy: userId });
          }
        }
      } catch (e) {
        console.error('❌ markAsRead error:', e);
      }
    });

    socket.on('disconnect', () => {
      unbindSocket(userId, socket.id);
      console.log('❌ User disconnected:', userId, socket.id);
    });
  });
}
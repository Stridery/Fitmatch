import crypto from 'crypto';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import redis from '../config/redis.js';                 // 你前面提供的是默认导出
import type { MessageStatus } from '../models/message.js';
import { createMessageIdempotent, Message } from '../models/message.js';

interface JWTPayload { userId?: string; sub?: string; iat?: number; exp?: number; }
interface SocketWithAuth extends Socket { data: { userId: string }; }
interface SendPayload { toUserId: string; message: string; clientMsgId?: string; }

const userSockets = new Map<string, Set<string>>(); // 多设备支持（本机内存）
function roomOf(userId: string) { return `user:${userId}`; }


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
// 本地目标查询保留用于日志；跨实例以房间为准
function targetsOf(userId: string) { return Array.from(userSockets.get(userId) ?? []); }

// —— 每用户速率限制（Redis 版，60 秒窗口）——
async function isRateLimited(userId: string, limit = 20): Promise<boolean> {
  const key = `ratelimit:${userId}`;
  const tx = redis.multi();
  tx.incr(key);
  tx.expire(key, 60);
  const [countRes] = (await tx.exec()) ?? [];
  const count = Array.isArray(countRes) ? Number(countRes[1]) : Number(countRes);
  if (!Number.isFinite(count)) return false;
  return count > limit;
}

export function setupSocketServer(io: Server) {
  // 鉴权中间件：兼容 payload.userId / payload.sub
  

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    const fallbackUserId = socket.handshake.auth?.userId as string | undefined;
    if (!token) {
      if (fallbackUserId) {
        (socket as SocketWithAuth).data = { userId: String(fallbackUserId) };
        return next();
      }
      return next(new Error('No token provided'));
    }
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
      const uid = String(decoded.userId ?? decoded.sub ?? '');
      if (!uid) {
        if (fallbackUserId) {
          (socket as SocketWithAuth).data = { userId: String(fallbackUserId) };
          return next();
        }
        return next(new Error('Invalid token payload'));
      }
      (socket as SocketWithAuth).data = { userId: uid };
      next();
    } catch (e) {
      if (fallbackUserId) {
        (socket as SocketWithAuth).data = { userId: String(fallbackUserId) };
        return next();
      }
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', async (socket: SocketWithAuth) => {
    const userId = socket.data.userId;
    bindSocket(userId, socket.id);
    console.log('✅ User connected:', userId, socket.id);
    // 加入以用户为维度的房间，便于跨实例广播
    await socket.join(roomOf(userId));

    // 标记在线与心跳
    try {
      await redis.hset(`user:${userId}`, { online: 1, lastOnlineAt: Date.now() });
    } catch {}
    const heartbeat = setInterval(async () => {
      try { await redis.hset(`user:${userId}`, { online: 1, lastOnlineAt: Date.now() }); } catch {}
    }, 30_000);

    // 拉取并清空离线消息队列（原子）
    try {
      const key = `offline:${userId}`;
      const tmp = `offline:${userId}:tmp:${crypto.randomUUID()}`;
      // RENAME 为 O(1) 且原子，将列表转移到临时键，避免并发重复投递
      const moved = await redis.rename(key, tmp).then(() => true).catch(() => false);
      if (moved) {
        let delivered = 0;
        while (true) {
          const raw = await redis.lpop(tmp);
          if (!raw) break;
          try { socket.emit('privateMessage', JSON.parse(raw)); delivered += 1; } catch {}
        }
        await redis.del(tmp);
        if (delivered) console.log(`📬 Delivered ${delivered} offline messages to ${userId}`);
      }
    } catch (e) {
      console.error('❌ Offline delivery error:', e);
    }

    // 发送私信（幂等）
    socket.on('privateMessage', async (data: SendPayload) => {
      try {
        if (await isRateLimited(userId)) {
          socket.emit('error', { code: 'RATE_LIMIT', message: 'Too many messages. Please slow down.' });
          return;
        }
        const toUserId = typeof data?.toUserId === 'string' ? data.toUserId : '';
        let content = typeof data?.message === 'string' ? data.message.trim() : '';
        if (!toUserId) { socket.emit('error', { code: 'BAD_RECIPIENT', message: 'Invalid recipient' }); return; }
        if (!content) { socket.emit('error', { code: 'EMPTY', message: 'Message cannot be empty' }); return; }
        if (content.length > 1000) { socket.emit('error', { code: 'TOO_LONG', message: 'Message too long' }); return; }

        // 跨实例查询房间内是否有人在线
        const room = roomOf(toUserId);
        const sockets = await io.in(room).fetchSockets();
        const isOnline = sockets.length > 0;
        const status: MessageStatus = isOnline ? 'delivered' : 'sent';

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

        // 在线设备群发；不在线则入离线队列（并限制长度）
        if (isOnline) {
          io.to(room).emit('privateMessage', payload);
        } else {
          const key = `offline:${toUserId}`;
          await redis.rpush(key, JSON.stringify(payload));
          // 将离线队列长度限制在 1000
          await redis.ltrim(key, -1000, -1);
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

        // 按发送者分组通知（按房间广播）
        const bySender = new Map<string, string[]>();
        for (const m of msgs) {
          const arr = bySender.get(m.fromUserId as any) ?? [];
          arr.push(String((m as any)._id));
          bySender.set(m.fromUserId as any, arr);
        }
        for (const [senderId, msgIds] of bySender) {
          io.to(roomOf(senderId)).emit('messageRead', { messageIds: msgIds, readBy: userId });
        }
      } catch (e) {
        console.error('❌ markAsRead error:', e);
      }
    });

    socket.on('disconnect', async () => {
      unbindSocket(userId, socket.id);
      console.log('❌ User disconnected:', userId, socket.id);
      // 记录最后在线时间
      try {
        await redis.hset(`user:${userId}`, { online: 0, lastOnlineAt: Date.now() });
      } catch {}
      clearInterval(heartbeat);
      try { await socket.leave(roomOf(userId)); } catch {}
    });
  });
}
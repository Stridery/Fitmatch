import crypto from 'crypto';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import redis from '../config/redis.js';                 // 默认导出
import type { MessageStatus } from '../models/message.js';
import { createMessageIdempotent, Message } from '../models/message.js';
import { ThreadParticipant } from '../models/threadParticipant.js';

interface JWTPayload { userId?: string; sub?: string; iat?: number; exp?: number; }
interface SocketWithAuth extends Socket { data: { userId: string }; }
interface SendPayload { threadId: string; content: string; clientMsgId?: string; }

const userSockets = new Map<string, Set<string>>(); // 多设备支持（本机内存）
const heartbeats = new Map<string, NodeJS.Timeout>(); // 心跳定时器，按 socket.id 管理

function roomOf(userId: string) { return `u:${userId}`; }
function threadRoom(threadId: string) { return `room:${threadId}`; } // 保留工具函数，当前未使用线程广播

function mask(str: string, show = 6) {
  if (!str) return '';
  if (str.length <= show * 2) return '*'.repeat(str.length);
  return str.slice(0, show) + '...' + str.slice(-show);
}

function peekJwt(token: string) {
  try {
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

    // —— 标记在线与心跳（心跳只更新时间） ——
    try {
      await redis.hincrby(`user:${userId}`, 'conn', 1); // 连接计数 +1
      await redis.hset(`user:${userId}`, { online: 1, lastOnlineAt: Date.now() });
    } catch {}
    // 防重复启动
    if (heartbeats.has(socket.id)) clearInterval(heartbeats.get(socket.id)!);
    const hb = setInterval(async () => {
      try {
        // 仅更新时间，避免覆盖 offline
        await redis.hset(`user:${userId}`, { lastOnlineAt: Date.now() });
      } catch {}
    }, 30_000);
    heartbeats.set(socket.id, hb);

    // —— 拉取并清空离线消息队列（原子） ——
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
          try {
            const payload = JSON.parse(raw);
            // 统一事件名为 chat:newMessage（与在线广播一致）
            socket.emit('chat:newMessage', payload);
            delivered += 1;
          } catch {}
        }
        await redis.del(tmp);
        if (delivered) console.log(`📬 Delivered ${delivered} offline messages to ${userId}`);
      }
    } catch (e) {
      console.error('❌ Offline delivery error:', e);
    }

    // —— 按需加入/离开线程房间 ——
    socket.on('chat:joinThread', async (data: { threadId: string }) => {
      try {
        const threadId = String(data?.threadId ?? '');
        if (!threadId) return;
        const part = await ThreadParticipant.findOne({ threadId, userId }).lean();
        if (!part) return;
        await socket.join(threadRoom(threadId));
      } catch (e) {
        console.error('joinThread error', e);
      }
    });

    socket.on('chat:leaveThread', async (data: { threadId: string }) => {
      try {
        const threadId = String(data?.threadId ?? '');
        if (!threadId) return;
        await socket.leave(threadRoom(threadId));
      } catch (e) {
        console.error('leaveThread error', e);
      }
    });

    // —— 线程内发送（幂等） ——
    socket.on('chat:send', async (data: SendPayload) => {
      try {
        if (await isRateLimited(userId)) {
          socket.emit('chat:error', { code: 'RATE_LIMIT', message: 'Too many messages. Please slow down.' });
          return;
        }
        const threadId = typeof data?.threadId === 'string' ? data.threadId : '';
        let content = typeof data?.content === 'string' ? data.content.trim() : '';
        if (!threadId) { socket.emit('chat:error', { code: 'BAD_THREAD', message: 'Invalid thread' }); return; }
        if (!content) { socket.emit('chat:error', { code: 'EMPTY', message: 'Message cannot be empty' }); return; }
        if (content.length > 1000) { socket.emit('chat:error', { code: 'TOO_LONG', message: 'Message too long' }); return; }

        // 授权：必须是参与者
        const parts = await ThreadParticipant.find({ threadId }).lean();
        if (!parts.some(p => String(p.userId) === userId)) { socket.emit('chat:error', { code: 'FORBIDDEN' }); return; }
        const toUserId = String((parts.find(p => String(p.userId) !== userId) as any)?.userId ?? '');

        // 在线检测：看对端是否在线
        const sockets = await io.in(roomOf(toUserId)).fetchSockets();
        const isOnline = sockets.length > 0;
        const status: MessageStatus = isOnline ? 'delivered' : 'sent';

        // 幂等写库
        const { doc, created } = await createMessageIdempotent({
          threadId,
          fromUserId: userId,
          toUserId,
          content,
          status,
          ...(data.clientMsgId && { clientMsgId: data.clientMsgId })
        });

        // 统一响应负载（用 DB 的 createdAt，保证前后端排序一致）
        const payload = {
          threadId,
          id: String((doc as any)._id),
          senderId: userId,
          content: doc.content,
          createdAt: doc.createdAt,
          clientMsgId: data.clientMsgId,
        };

        // —— 只给对端广播，避免自己收到多次回声 ——
        io.to(roomOf(toUserId)).emit('chat:newMessage', payload);

        // 若对端离线，入离线队列（个人房间在其上线时会被投递）
        if (!isOnline) {
          const key = `offline:${toUserId}`;
          await redis.rpush(key, JSON.stringify(payload));
          await redis.ltrim(key, -1000, -1);
          console.log(`📦 Stored offline message for ${toUserId}`);
        }

        // 给发送者 ACK（带 created 标志 + clientMsgId 以便前端合并乐观消息）
        socket.emit('messageSent', { 
          id: payload.id, 
          createdAt: payload.createdAt, 
          created,
          clientMsgId: data.clientMsgId 
        });
      } catch (e) {
        console.error('❌ Send error:', e);
        socket.emit('chat:error', { code: 'SEND_FAIL', message: 'Failed to send message' });
      }
    });

    // —— 批量已读 ——
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

    // —— 断开连接 ——
    socket.on('disconnect', async () => {
      unbindSocket(userId, socket.id);
      console.log('❌ User disconnected:', userId, socket.id);

      // 先停心跳，避免心跳把 online 写回 1
      const hbTimer = heartbeats.get(socket.id);
      if (hbTimer) {
        clearInterval(hbTimer);
        heartbeats.delete(socket.id);
      }

      // 连接计数 -1；归零才置 offline
      try {
        const c = await redis.hincrby(`user:${userId}`, 'conn', -1);
        if (c <= 0) {
          await redis.hset(`user:${userId}`, { online: 0, lastOnlineAt: Date.now() });
        } else {
          await redis.hset(`user:${userId}`, { lastOnlineAt: Date.now() });
        }
      } catch {}

      try { await socket.leave(roomOf(userId)); } catch {}
    });
  });
}
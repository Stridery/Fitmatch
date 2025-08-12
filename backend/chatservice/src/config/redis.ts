// src/config/redis.ts
import { Redis } from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const REDIS_URL = process.env.REDIS_URL;
const REDIS_HOST = process.env.REDIS_HOST || '127.0.0.1';
const REDIS_PORT = Number(process.env.REDIS_PORT || 6379);
const REDIS_PASSWORD = process.env.REDIS_PASSWORD || undefined;

// 统一的重连/容错策略
const baseOptions = {
  lazyConnect: false,           // 创建后立即连接
  enableReadyCheck: true,       // 就绪检查（PING）
  maxRetriesPerRequest: null,   // 重要：避免在请求队列层级报错被吃掉
  reconnectOnError: (err: Error) => {
    const msg = err.message || '';
    // 常见 READONLY（主从切换）、ETIMEDOUT 等尝试重连
    if (msg.includes('READONLY') || msg.includes('ETIMEDOUT') || msg.includes('ECONNRESET')) {
      return true;
    }
    return false;
  },
  retryStrategy: (times: number) => {
    // 线性回退 + 上限（20s）
    const delay = Math.min(times * 500, 20_000);
    return delay;
  },
} as const;

const redis = REDIS_URL
  ? new Redis(REDIS_URL, baseOptions)
  : new Redis({
      host: REDIS_HOST,
      port: REDIS_PORT,
      ...(REDIS_PASSWORD && { password: REDIS_PASSWORD }),
      ...baseOptions,
    });

redis.on('connect', () => {
  console.log('✅ Redis connected');
});

redis.on('ready', () => {
  console.log('🚀 Redis is ready to use');
});

redis.on('error', (err) => {
  console.error('❌ Redis error:', err);
});

redis.on('end', () => {
  console.warn('⚠️ Redis connection closed');
});

/**
 * 健康探测：PING 一下
 */
export async function pingRedis(): Promise<boolean> {
  try {
    const res = await redis.ping();
    return res === 'PONG';
  } catch {
    return false;
  }
}

/**
 * 优雅关停
 */
export async function closeRedis(): Promise<void> {
  try {
    await redis.quit(); // 优雅退出（与 .disconnect() 相比会发 QUIT）
    console.log('🛑 Redis connection closed');
  } catch (err) {
    console.error('❌ Error closing Redis connection:', err);
    // 避免卡死：发生错误时强制断开
    try { redis.disconnect(); } catch {}
  }
}

/**
 * 如果之后你要用 socket.io-redis-adapter，可以用这个工厂创建 pub/sub 客户端：
 */
// import { createClient } from 'redis' // 如果使用 node-redis v4
// export async function createRedisPubSub() {
//   const pub = createClient({ url: REDIS_URL });
//   const sub = pub.duplicate();
//   await pub.connect(); await sub.connect();
//   return { pub, sub };
// }

export default redis;
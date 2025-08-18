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
  maxRetriesPerRequest: null,   // 避免请求队列层级报错被吃掉
  reconnectOnError: (err: Error) => {
    const msg = err.message || '';
    if (
      msg.includes('READONLY') ||
      msg.includes('ETIMEDOUT') ||
      msg.includes('ECONNRESET')
    ) {
      return true;
    }
    return false;
  },
  retryStrategy: (times: number) => {
    const delay = Math.min(times * 500, 20_000); // 线性回退 + 上限20s
    return delay;
  },
} as const;

/**
 * 通用注册函数：给任意 Redis 客户端绑定日志/错误处理
 */
function attachRedisLogs(client: Redis, label: string) {
  client.on('error', (err) => {
    console.error(`❌ Redis (${label}) error:`, err);
  });
  client.on('connect', () => {
    console.log(`✅ Redis (${label}) connected`);
  });
  client.on('ready', () => {
    console.log(`🚀 Redis (${label}) ready`);
  });
  client.on('end', () => {
    console.warn(`⚠️ Redis (${label}) connection closed`);
  });
}

/**
 * 主 Redis 客户端
 */
const redis = REDIS_URL
  ? new Redis(REDIS_URL, baseOptions)
  : new Redis({
      host: REDIS_HOST,
      port: REDIS_PORT,
      ...(REDIS_PASSWORD && { password: REDIS_PASSWORD }),
      ...baseOptions,
    });

attachRedisLogs(redis, 'main');

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
 * 优雅关停主连接
 */
export async function closeRedis(): Promise<void> {
  try {
    await redis.quit(); // 优雅退出（发送 QUIT）
    console.log('🛑 Redis (main) closed');
  } catch (err) {
    console.error('❌ Error closing Redis (main):', err);
    try {
      redis.disconnect();
    } catch {}
  }
}

/**
 * 为 Socket.IO 或 pub/sub 创建独立的客户端
 */
export function createRedisPubSubClients(): { pub: Redis; sub: Redis } {
  let pub: Redis;
  let sub: Redis;

  if (REDIS_URL) {
    pub = new Redis(REDIS_URL, baseOptions);
    sub = new Redis(REDIS_URL, baseOptions);
  } else {
    const common = {
      host: REDIS_HOST,
      port: REDIS_PORT,
      ...(REDIS_PASSWORD && { password: REDIS_PASSWORD }),
      ...baseOptions,
    } as const;
    pub = new Redis(common);
    sub = new Redis(common);
  }

  attachRedisLogs(pub, 'pub');
  attachRedisLogs(sub, 'sub');

  return { pub, sub };
}

export default redis;
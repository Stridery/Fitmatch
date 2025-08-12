// src/config/db.ts
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URL = process.env.MONGO_URL;

const OPTIONS: mongoose.ConnectOptions = {
  serverSelectionTimeoutMS: 5_000, // 选主/连通性探测超时
  socketTimeoutMS: 45_000,         // 单条请求最大空闲时长
  maxPoolSize: 50,                 // 连接池上限
  minPoolSize: 0,
  family: 4,                       // 避免 IPv6 环境导致的连接慢
};

let hasBoundEvents = false;

export async function connectDB(uri = MONGO_URL): Promise<typeof mongoose> {
  if (!uri) {
    throw new Error('Missing env MONGO_URL');
  }

  const conn = await mongoose.connect(uri, OPTIONS);

  if (!hasBoundEvents) {
    hasBoundEvents = true;
    const db = mongoose.connection;

    db.on('error', (err) => {
      console.error('❌ MongoDB error:', err);
    });

    db.on('disconnected', () => {
      console.warn('⚠️ MongoDB disconnected');
    });

    db.on('reconnected', () => {
      console.log('🔁 MongoDB reconnected');
    });

    db.once('open', () => {
      console.log(`✅ MongoDB connected: ${db.host}`);
    });
  }

  return conn;
}

export async function closeDB(): Promise<void> {
  try {
    await mongoose.connection.close();
    console.log('🛑 MongoDB connection closed');
  } catch (err) {
    console.error('❌ Error closing MongoDB connection:', err);
  }
}

/**
 * 获取当前连接状态，便于健康检查：
 * 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
 */
export function getDBState(): number {
  return mongoose.connection.readyState;
}

export default connectDB;
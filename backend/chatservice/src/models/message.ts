import mongoose, { Schema, Document, Model } from 'mongoose';

export type MessageStatus = 'sent' | 'delivered' | 'read';

export interface IMessage extends Document {
  fromUserId: string;          // 发送者
  toUserId: string;            // 接收者
  content: string;             // 纯文本内容
  status: MessageStatus;       // 状态
  clientMsgId?: string;        // 客户端生成的幂等ID（同一发送者必须唯一）
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema<IMessage>(
  {
    fromUserId: { type: String, required: true, index: true },
    toUserId:   { type: String, required: true, index: true },
    content:    { type: String, required: true, trim: true, maxlength: 1000 },
    status:     { type: String, enum: ['sent', 'delivered', 'read'], default: 'sent' },
    clientMsgId:{ type: String, index: true }, // 可为空；有则用于幂等
  },
  { timestamps: true }
);

/**
 * 索引设计：
 * 1) 会话方向历史：双向 + 时间倒序（分页稳定建议带 _id 作为二级排序）
 * 2) 收件箱未读/最近消息扫描
 * 3) 幂等唯一：同一发送者(fromUserId)下的 clientMsgId 唯一
 */
MessageSchema.index({ fromUserId: 1, toUserId: 1, createdAt: -1, _id: -1 });
MessageSchema.index({ toUserId: 1, status: 1, createdAt: -1, _id: -1 });
MessageSchema.index(
  { fromUserId: 1, clientMsgId: 1 },
  { unique: true, partialFilterExpression: { clientMsgId: { $type: 'string' } } }
);

export const Message: Model<IMessage> =
  mongoose.models.Message || mongoose.model<IMessage>('Message', MessageSchema);

/**
 * 幂等创建：如果 clientMsgId 冲突（E11000），返回已存在的那条消息
 */
export async function createMessageIdempotent(payload: {
  fromUserId: string;
  toUserId: string;
  content: string;
  status: MessageStatus;
  clientMsgId?: string; // 建议前端每次发送生成，如 uuid
}) {
  const { fromUserId, clientMsgId } = payload;

  try {
    const doc = await Message.create(payload);
    return { doc, created: true };
  } catch (err: any) {
    // Mongo duplicate key
    if (err?.code === 11000 && clientMsgId) {
      const existing = await Message.findOne({ fromUserId, clientMsgId }).lean();
      if (existing) {
        return { doc: existing as any as IMessage, created: false };
      }
    }
    throw err;
  }
}
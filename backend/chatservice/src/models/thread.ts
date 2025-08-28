import mongoose, { Schema, Document, Model } from 'mongoose';

export type ThreadType = 'dm';

export interface IThread extends Document {
  type: ThreadType;
  createdAt: Date;
  updatedAt: Date;
  lastMsgAt?: Date | null;
}

const ThreadSchema = new Schema<IThread>(
  {
    type: { type: String, enum: ['dm'], required: true, default: 'dm' },
    lastMsgAt: { type: Date, default: null, index: true },
  },
  { timestamps: true }
);

ThreadSchema.index({ lastMsgAt: -1, _id: -1 });

export const Thread: Model<IThread> =
  mongoose.models.Thread || mongoose.model<IThread>('Thread', ThreadSchema);


import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IThreadParticipant extends Document {
  threadId: string;
  userId: string;
  joinedAt: Date;
  lastReadAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const ThreadParticipantSchema = new Schema<IThreadParticipant>(
  {
    threadId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    joinedAt: { type: Date, default: () => new Date() },
    lastReadAt: { type: Date, default: null },
  },
  { timestamps: true }
);

ThreadParticipantSchema.index({ threadId: 1, userId: 1 }, { unique: true });
ThreadParticipantSchema.index({ userId: 1, updatedAt: -1, _id: -1 });

export const ThreadParticipant: Model<IThreadParticipant> =
  mongoose.models.ThreadParticipant || mongoose.model<IThreadParticipant>('ThreadParticipant', ThreadParticipantSchema);


import axios from "axios";

export interface ChatThreadSummary {
  _id: string;
  title?: string;
  otherUser?: {
    _id: string;
    nickname?: string;
    avatarUrl?: string;
  };
}

export interface ChatMessageDTO {
  _id: string;
  threadId: string;
  senderId: string;
  content: string;
  createdAt: string;
}

const BASE_URL = `${import.meta.env.VITE_API_BASE}/chat`;

export async function startDM(otherUserId: string) {
  const res = await axios.post<{ thread: ChatThreadSummary }>(
    `${BASE_URL}/threads`,
    { otherUserId }
  );
  return res.data.thread;
}

export async function getThreadMessages(threadId: string, limit = 50) {
  const res = await axios.get<{ messages: ChatMessageDTO[] }>(
    `${BASE_URL}/threads/${threadId}/messages`,
    { params: { limit } }
  );
  return res.data.messages;
}


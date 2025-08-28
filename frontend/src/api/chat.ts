import api from "./client";

export interface ChatThreadSummary {
  id: string;
  type: "dm";
  lastMsgAt: string | null;
  otherUser?: { id: string; nickname?: string; avatarUrl?: string };
}

export interface ChatMessageDTO {
  _id: string;
  threadId: string;
  senderId: string;
  content: string;
  createdAt: string; // ISO string
  clientMsgId?: string;
}

export async function startDM(participantId: string) {
  const res = await api.post<{ thread: ChatThreadSummary }>(
    `/chat/threads`,
    { participantId }
  );
  return res.data.thread;
}

export async function getThreadMessages(
  threadId: string,
  limit = 50,
  before?: string
) {
  const res = await api.get<{ messages: ChatMessageDTO[] }>(
    `/chat/threads/${threadId}/messages`,
    { params: { limit, ...(before ? { before } : {}) } }
  );
  return res.data.messages;
}
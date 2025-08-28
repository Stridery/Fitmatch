import api from "./client";

export interface ChatMessageDTO {
  _id: string;
  senderId: string;
  content: string;
  createdAt: string; // ISO string
}

// History is peer-to-peer: threadId is other user's id
export async function getThreadMessages(
  peerUserId: string,
  limit = 50,
  before?: string
) {
  const res = await api.get<{ messages: ChatMessageDTO[] }>(
    `/chat/history/${peerUserId}`,
    { params: { limit, ...(before ? { before } : {}) } }
  );
  return res.data.messages;
}
import api from "./client";

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
  createdAt: string; // ISO string
}

/** 创建或获取一对一会话（get-or-create） */
export async function startDM(participantId: string) {
  const res = await api.post<{ thread: ChatThreadSummary }>(
    `/chat/threads`,
    { participantId }
  );
  return res.data.thread;
}

/** 拉取会话消息（支持分页：before 为上一页的最早时间戳） */
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

/** 发送消息（可选：幂等需要 clientMsgId） */
export async function sendMessage(
  threadId: string,
  content: string,
  clientMsgId: string
) {
  const res = await api.post<{ message: ChatMessageDTO }>(
    `/chat/threads/${threadId}/messages`,
    { content, clientMsgId }
  );
  return res.data.message;
}
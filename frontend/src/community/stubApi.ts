import type { ConversationSummary, CommunityUser, MessageItem } from "./store";

function randomId(prefix = "id") {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

const mockUsers: CommunityUser[] = Array.from({ length: 20 }).map((_, i) => ({
  id: `u_${i + 1}`,
  nickname: `User ${String.fromCharCode(65 + (i % 26))}${i}`,
  email: `user${i}@example.com`,
  avatarUrl: `https://api.dicebear.com/7.x/notionists/svg?seed=${i}`,
}));

const nowIso = () => new Date().toISOString();

let mockConversations: ConversationSummary[] = mockUsers.slice(0, 8).map((u, idx) => ({
  id: `c_${idx + 1}`,
  otherUser: u,
  updatedAt: nowIso(),
  lastMessage: {
    id: randomId("m"),
    content: `Hello from ${u.nickname}`,
    createdAt: nowIso(),
  },
}));

const mockMessages: Record<string, MessageItem[]> = Object.fromEntries(
  mockConversations.map((c) => [
    c.id,
    [
      { id: randomId("m"), conversationId: c.id, senderId: c.otherUser.id, content: c.lastMessage?.content || "Hi", createdAt: nowIso(), isMine: false },
      { id: randomId("m"), conversationId: c.id, senderId: "me", content: "Hey there!", createdAt: nowIso(), isMine: true },
    ],
  ])
);

export function createMockApi() {
  const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));
  return {
    api: {
      async listConversations(): Promise<ConversationSummary[]> {
        await delay(300);
        return mockConversations;
      },
      async listContacts(): Promise<CommunityUser[]> {
        await delay(250);
        return mockUsers;
      },
      async getMessages(conversationId: string): Promise<MessageItem[]> {
        await delay(250);
        return mockMessages[conversationId] || [];
      },
      async ensureConversationWith(userId: string): Promise<ConversationSummary> {
        await delay(200);
        const user = mockUsers.find((u) => u.id === userId)!;
        const existing = mockConversations.find((c) => c.otherUser.id === userId);
        if (existing) return existing;
        const convo: ConversationSummary = {
          id: randomId("c"),
          otherUser: user,
          updatedAt: nowIso(),
          lastMessage: null,
        };
        mockConversations = [convo, ...mockConversations];
        mockMessages[convo.id] = [];
        return convo;
      },
    },
  } as const;
}


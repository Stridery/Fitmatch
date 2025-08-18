import type { CommunityUser, ConversationSummary, MessageItem } from "./store";

export const api = {
  async listConversations(): Promise<ConversationSummary[]> {
    // TODO: implement with Supabase or your HTTP API
    return [];
  },

  async listContacts(): Promise<CommunityUser[]> {
    // TODO: implement with Supabase or your HTTP API
    return [];
  },

  async getMessages(_conversationId: string): Promise<MessageItem[]> {
    // TODO: implement with Supabase or your HTTP API
    return [];
  },

  async ensureConversationWith(_userId: string): Promise<ConversationSummary> {
    // TODO: implement with Supabase or your HTTP API
    throw new Error("ensureConversationWith not implemented");
  },
} as const;


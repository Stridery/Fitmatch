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

  async getMessages(conversationId: string): Promise<MessageItem[]> {
    // TODO: implement with Supabase or your HTTP API
    void conversationId; // referenced to satisfy linter until implemented
    return [];
  },

  async ensureConversationWith(userId: string): Promise<ConversationSummary> {
    // TODO: implement with Supabase or your HTTP API
    throw new Error(`ensureConversationWith not implemented for user ${userId}`);
  },
} as const;


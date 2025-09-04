import { createWithEqualityFn } from 'zustand/traditional'
import { io, Socket } from "socket.io-client";
import { api } from "./api";

export type TabKey = "messages" | "contacts" | "posts";

export interface CommunityUser {
  id: string;
  nickname: string;
  email: string;
  avatarUrl: string;
}

export interface ConversationSummary {
  id: string;
  otherUser: CommunityUser;
  updatedAt: string;
  lastMessage?: { id: string; content: string; createdAt: string } | null;
}

export interface MessageItem {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: string;
  isMine?: boolean;
}

interface LoadingState {
  conversations: boolean;
  contacts: boolean;
  messages: boolean;
}

interface ErrorState {
  conversations?: string;
  contacts?: string;
  messages?: string;
}

/** ---------- API typing ---------- */
interface CommunityApi {
  listConversations(): Promise<ConversationSummary[]>;
  listContacts(): Promise<CommunityUser[]>;
  getMessages(conversationId: string): Promise<MessageItem[]>;
  ensureConversationWith(userId: string): Promise<ConversationSummary>;
}
const apiClient = api as unknown as CommunityApi;

/** ---------- Socket typing ---------- */
// 服务器 -> 客户端
interface ServerToClientEvents {
  "message:new": (msg: MessageItem) => void;
}
// 客户端 -> 服务器
interface ClientToServerEvents {
  "message:send": (payload: { conversationId: string; content: string }) => void;
}
type ChatSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

/** ---------- Store types ---------- */
interface CommunityState {
  currentTab: TabKey;
  setCurrentTab: (tab: TabKey) => void;

  conversations: ConversationSummary[];
  contacts: CommunityUser[];
  selectedConversationId: string | null;

  messages: Record<string, MessageItem[]>;

  loading: LoadingState;
  errors: ErrorState;

  // Socket
  socket: ChatSocket | null;
  currentUserId: string | null;
  setCurrentUserId: (userId: string | null) => void;
  ensureSocket: (userId: string) => void;

  // Data actions
  fetchConversations: () => Promise<void>;
  fetchContacts: () => Promise<void>;
  selectConversation: (conversationId: string) => void;
  fetchMessageHistory: (conversationId: string) => Promise<void>;
  startConversationWithUser: (user: CommunityUser) => Promise<void>;
  sendMessage: (params: { conversationId: string; content: string }) => void;
}

/** ---------- Helpers ---------- */
const errorMessage = (e: unknown, fallback: string): string =>
  e instanceof Error ? e.message : fallback;

/** ---------- Store ---------- */
export const useCommunityStore = createWithEqualityFn<CommunityState>()((set, get) => ({
  currentTab: "messages",
  setCurrentTab: (tab) => set({ currentTab: tab }),

  conversations: [],
  contacts: [],
  selectedConversationId: null,
  messages: {},

  loading: { conversations: false, contacts: false, messages: false },
  errors: {},

  socket: null,
  currentUserId: null,
  setCurrentUserId: (userId) => set({ currentUserId: userId }),

  ensureSocket: (userId: string) => {
    const existing = get().socket;
    if (existing && existing.connected) return;

    const url = import.meta.env?.VITE_SOCKET_URL;
    if (!url) {
      console.warn("VITE_SOCKET_URL is not set; skipping socket connection");
      return;
    }

    // 关键修改：io() 不传泛型，用变量类型约束为 ChatSocket
    const newSocket: ChatSocket = io(url, {
      transports: ["websocket"],
      autoConnect: true,
      auth: { userId },
    });

    newSocket.on("connect_error", (err: Error) => {
      console.error("Socket connect error", err.message);
    });

    newSocket.on("message:new", (msg: MessageItem) => {
      const { selectedConversationId } = get();
      set((state: CommunityState) => {
        const existingMsgs = state.messages[msg.conversationId] ?? [];
        const updated = [...existingMsgs, msg];
        return { messages: { ...state.messages, [msg.conversationId]: updated } };
      });
      if (selectedConversationId !== msg.conversationId) {
        // TODO: unread count handling
      }
    });

    set({ socket: newSocket });
  },

  fetchConversations: async () => {
    set((s: CommunityState) => ({
      loading: { ...s.loading, conversations: true },
      errors: { ...s.errors, conversations: undefined },
    }));
    try {
      const list = await apiClient.listConversations();
      set((s: CommunityState) => ({
        conversations: list,
        loading: { ...s.loading, conversations: false },
      }));
    } catch (e: unknown) {
      set((s: CommunityState) => ({
        loading: { ...s.loading, conversations: false },
        errors: { ...s.errors, conversations: errorMessage(e, "Failed to load") },
      }));
    }
  },

  fetchContacts: async () => {
    set((s: CommunityState) => ({
      loading: { ...s.loading, contacts: true },
      errors: { ...s.errors, contacts: undefined },
    }));
    try {
      const list = await apiClient.listContacts();
      set((s: CommunityState) => ({
        contacts: list,
        loading: { ...s.loading, contacts: false },
      }));
    } catch (e: unknown) {
      set((s: CommunityState) => ({
        loading: { ...s.loading, contacts: false },
        errors: { ...s.errors, contacts: errorMessage(e, "Failed to load") },
      }));
    }
  },

  selectConversation: (conversationId: string) => {
    set({ selectedConversationId: conversationId });
  },

  fetchMessageHistory: async (conversationId: string) => {
    set((s: CommunityState) => ({
      loading: { ...s.loading, messages: true },
      errors: { ...s.errors, messages: undefined },
    }));
    try {
      const list = await apiClient.getMessages(conversationId);
      set((s: CommunityState) => ({
        messages: { ...s.messages, [conversationId]: list },
        loading: { ...s.loading, messages: false },
      }));
    } catch (e: unknown) {
      set((s: CommunityState) => ({
        loading: { ...s.loading, messages: false },
        errors: { ...s.errors, messages: errorMessage(e, "Failed to load") },
      }));
    }
  },

  startConversationWithUser: async (user: CommunityUser) => {
    const convo = await apiClient.ensureConversationWith(user.id);
    set((s: CommunityState) => ({
      currentTab: "messages",
      selectedConversationId: convo.id,
      conversations: s.conversations.some((c) => c.id === convo.id)
        ? s.conversations
        : [convo, ...s.conversations],
    }));
  },

  sendMessage: ({ conversationId, content }) => {
    const currentUserId = get().currentUserId ?? undefined;
    if (!currentUserId) return;

    const socket = get().socket;
    if (!socket || !socket.connected) {
      get().ensureSocket(currentUserId);
    }

    const tempId = `tmp_${Date.now()}`;
    const optimistic: MessageItem = {
      id: tempId,
      conversationId,
      senderId: currentUserId,
      content,
      createdAt: new Date().toISOString(),
      isMine: true,
    };

    set((state: CommunityState) => {
      const existing = state.messages[conversationId] ?? [];
      return { messages: { ...state.messages, [conversationId]: [...existing, optimistic] } };
    });

    const payload: { conversationId: string; content: string } = { conversationId, content };
    get().socket?.emit("message:send", payload);
  },
}));
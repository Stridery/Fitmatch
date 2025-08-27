import { create } from "zustand";
import { persist } from "zustand/middleware";
import { io, Socket } from "socket.io-client";
import { getThreadMessages, startDM } from "@/api/chat";

type ServerToClientEvents = {
  "chat:new_message": (payload: { threadId: string; message: ChatMessage }) => void;
  "chat:joined": (payload: { threadId: string }) => void;
};

type ClientToServerEvents = {
  "chat:join": (payload: { threadId: string }) => void;
  "chat:leave": (payload: { threadId: string }) => void;
  "chat:send": (payload: { threadId: string; content: string }) => void;
};

type ChatSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

export interface ChatThreadInfo {
  threadId: string;
  title?: string;
  avatarUrl?: string;
  minimized: boolean;
  focused: boolean;
  unread: number;
}

export interface ChatMessage {
  id: string;
  threadId: string;
  senderId: string;
  content: string;
  createdAt: string;
  isMine?: boolean;
}

interface ChatDockState {
  userId: string | null;
  socket: ChatSocket | null;

  openThreads: Record<string, ChatThreadInfo>;
  messages: Record<string, ChatMessage[]>;
  recentContacts: { id: string; nickname?: string; avatarUrl?: string }[];

  ensureSocket: (userId: string) => void;
  joinThread: (threadId: string) => Promise<void>;
  leaveThread: (threadId: string) => void;
  sendMessage: (threadId: string, content: string) => void;
  focusThread: (threadId: string) => void;
  minimizeThread: (threadId: string, minimized: boolean) => void;
  closeThread: (threadId: string) => void;
  startDM: (otherUserId: string) => Promise<string>;
  setUserId: (userId: string | null) => void;
  addRecentContact: (user: { id: string; nickname?: string; avatarUrl?: string }) => void;
}

export const useChatDockStore = create<ChatDockState>()(
  persist(
    (set, get) => ({
      userId: null,
      socket: null,
      openThreads: {},
      messages: {},
      recentContacts: [],

      setUserId: (userId) => set({ userId }),

      ensureSocket: (userId: string) => {
        const existing = get().socket;
        if (existing && existing.connected) return;
        const url = import.meta.env?.VITE_SOCKET_URL;
        if (!url) return;

        const s: ChatSocket = io(url, {
          transports: ["websocket"],
          autoConnect: true,
          auth: { userId },
        });

        s.on("chat:new_message", ({ threadId, message }) => {
          set((state) => {
            const prev = state.messages[threadId] ?? [];
            const updated = [...prev, message];
            return { messages: { ...state.messages, [threadId]: updated } };
          });
          const info = get().openThreads[threadId];
          if (info) {
            const bumpedUnread = info.focused && !info.minimized ? 0 : info.unread + 1;
            set((state) => ({
              openThreads: {
                ...state.openThreads,
                [threadId]: { ...info, unread: bumpedUnread },
              },
            }));
          }
        });

        set({ socket: s });
      },

      joinThread: async (threadId: string) => {
        const socket = get().socket;
        const userId = get().userId ?? undefined;
        if (!userId) return;
        if (!socket || !socket.connected) get().ensureSocket(userId);

        // fetch latest 50
        try {
          const list = await getThreadMessages(threadId, 50);
          set((state) => ({
            messages: {
              ...state.messages,
              [threadId]: list.map((m) => ({
                id: m._id,
                threadId: m.threadId,
                senderId: m.senderId,
                content: m.content,
                createdAt: m.createdAt,
                isMine: m.senderId === userId,
              })),
            },
          }));
        } catch {}

        get().socket?.emit("chat:join", { threadId });
      },

      leaveThread: (threadId: string) => {
        get().socket?.emit("chat:leave", { threadId });
      },

      sendMessage: (threadId: string, content: string) => {
        const userId = get().userId ?? undefined;
        if (!userId) return;
        const optimistic: ChatMessage = {
          id: `tmp_${Date.now()}`,
          threadId,
          senderId: userId,
          content,
          createdAt: new Date().toISOString(),
          isMine: true,
        };
        set((state) => ({
          messages: {
            ...state.messages,
            [threadId]: [...(state.messages[threadId] ?? []), optimistic],
          },
        }));
        get().socket?.emit("chat:send", { threadId, content });
      },

      focusThread: (threadId: string) => {
        set((state) => {
          const info = state.openThreads[threadId];
          if (!info) return {} as any;
          return {
            openThreads: {
              ...state.openThreads,
              [threadId]: { ...info, focused: true, minimized: false, unread: 0 },
            },
          };
        });
      },

      minimizeThread: (threadId: string, minimized: boolean) => {
        set((state) => {
          const info = state.openThreads[threadId];
          if (!info) return {} as any;
          return {
            openThreads: {
              ...state.openThreads,
              [threadId]: { ...info, minimized },
            },
          };
        });
      },

      closeThread: (threadId: string) => {
        get().leaveThread(threadId);
        set((state) => {
          const { [threadId]: _, ...rest } = state.openThreads;
          const { [threadId]: __, ...restMsgs } = state.messages;
          return { openThreads: rest, messages: restMsgs };
        });
      },

      startDM: async (otherUserId: string) => {
        const thread = await startDM(otherUserId);
        const threadId = thread._id;
        // track recent contact
        if (thread.otherUser?._id) {
          const u = thread.otherUser;
          get().addRecentContact({ id: u._id, nickname: u.nickname, avatarUrl: u.avatarUrl });
        }
        const exists = get().openThreads[threadId];
        if (exists) {
          // Focus existing window
          set((state) => ({
            openThreads: {
              ...state.openThreads,
              [threadId]: { ...exists, minimized: false, focused: true, unread: 0 },
            },
          }));
          return threadId;
        }
        set((state) => ({
          openThreads: {
            ...state.openThreads,
            [threadId]: {
              threadId,
              title: thread.title ?? thread.otherUser?.nickname ?? "Chat",
              avatarUrl: thread.otherUser?.avatarUrl,
              minimized: false,
              focused: true,
              unread: 0,
            },
          },
        }));
        await get().joinThread(threadId);
        return threadId;
      },

      addRecentContact: (user) => {
        set((state) => {
          const rest = state.recentContacts.filter((u) => u.id !== user.id);
          return { recentContacts: [user, ...rest].slice(0, 20) };
        });
      },
    }),
    { name: "chat-dock", partialize: (s) => ({ openThreads: s.openThreads, recentContacts: s.recentContacts }) }
  )
);


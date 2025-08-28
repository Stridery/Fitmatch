import { create } from "zustand";
import { persist } from "zustand/middleware";
import { io, Socket } from "socket.io-client";
import { getThreadMessages, startDM } from "@/api/chat";
import { supabase } from "@/lib/supabase";

type ServerToClientEvents = {
  'chat:newMessage': (payload: {
    threadId: string;
    id: string;
    senderId: string;
    content: string;
    createdAt: string;
    clientMsgId?: string;
  }) => void;
  messageRead?: (payload: { messageIds: string[]; readBy: string }) => void;
};

type ClientToServerEvents = {
  'chat:send': (payload: { threadId: string; content: string; clientMsgId?: string }) => void;
  'chat:joinThread': (payload: { threadId: string }) => void;
  'chat:leaveThread': (payload: { threadId: string }) => void;
  markAsRead?: (payload: { messageIds: string[] }) => void;
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

      ensureSocket: async (userId: string) => {
        const existing = get().socket;
        if (existing && existing.connected) return;
        if (!userId) return;
        const url = import.meta.env?.VITE_SOCKET_URL;
        if (!url) return;

        // Fetch JWT from Supabase and pass to socket auth as `token`
        const { data } = await supabase.auth.getSession();
        const accessToken = data.session?.access_token;

        const s: ChatSocket = io(url, {
          transports: ["websocket"],
          autoConnect: true,
          auth: accessToken ? { token: accessToken } : undefined,
        });

        s.on('chat:newMessage', (payload) => {
          const newMsg: ChatMessage = {
            id: payload.id,
            threadId: payload.threadId,
            senderId: payload.senderId,
            content: payload.content,
            createdAt: payload.createdAt,
            isMine: payload.senderId === get().userId,
          };
          set((state) => {
            const prev = state.messages[payload.threadId] ?? [];
            // optimistic replacement by clientMsgId
            const idx = payload.clientMsgId ? prev.findIndex(m => m.id === payload.clientMsgId) : -1;
            const updated = idx >= 0 ? [...prev.slice(0, idx), newMsg, ...prev.slice(idx + 1)] : [...prev, newMsg];
            return { messages: { ...state.messages, [payload.threadId]: updated } };
          });
          const info = get().openThreads[payload.threadId];
          if (info) {
            const bumpedUnread = info.focused && !info.minimized ? 0 : info.unread + 1;
            set((state) => ({
              openThreads: {
                ...state.openThreads,
                [payload.threadId]: { ...info, unread: bumpedUnread },
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
        if (!socket || !socket.connected) await get().ensureSocket(userId);

        // fetch latest 50
        try {
          const list = await getThreadMessages(threadId, 50);
          set((state) => ({
            messages: {
              ...state.messages,
              [threadId]: list.map((m) => ({
                id: m._id,
                threadId: threadId,
                senderId: m.senderId,
                content: m.content,
                createdAt: m.createdAt,
                isMine: m.senderId === userId,
              })),
            },
          }));
        } catch {}
        // Explicitly join thread room for active viewing
        get().socket?.emit('chat:joinThread', { threadId });
      },

      leaveThread: (threadId: string) => {
        get().socket?.emit('chat:leaveThread', { threadId });
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
        const clientMsgId = (globalThis as any).crypto?.randomUUID?.() ?? `c_${Date.now()}`;
        // optimistic id = clientMsgId for replacement
        set((state) => ({
          messages: {
            ...state.messages,
            [threadId]: (state.messages[threadId] ?? []).map(m => m.id === optimistic.id ? { ...m, id: clientMsgId } : m)
          },
        }));
        get().socket?.emit('chat:send', { threadId, content, clientMsgId });
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
          const { [threadId]: _removed, ...rest } = state.openThreads;
          const { [threadId]: _removedMsgs, ...restMsgs } = state.messages;
          return { openThreads: rest, messages: restMsgs };
        });
      },

      startDM: async (otherUserId: string) => {
        if (!otherUserId) return "";
        const thread = await startDM(otherUserId);
        // Guard: accept id or _id, prefer id
        let threadId = (thread as any).id ?? (thread as any)._id;
        if (!threadId) {
          // eslint-disable-next-line no-console
          console.warn('[chatDock] startDM missing thread.id, got:', thread);
          return "";
        }
        threadId = String(threadId);
        try {
          // Debug logs before state change
          // eslint-disable-next-line no-console
          console.log('[chatDock] startDM thread:', thread);
          // eslint-disable-next-line no-console
          console.log('[chatDock] startDM computed threadId:', threadId);
          // eslint-disable-next-line no-console
          console.log('[chatDock] startDM openThreads(before):', { ...get().openThreads });
        } catch {}
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
              title: thread.otherUser?.nickname ?? 'Chat',
              avatarUrl: thread.otherUser?.avatarUrl,
              minimized: false,
              focused: true,
              unread: 0,
            },
          },
        }));
        try {
          // eslint-disable-next-line no-console
          console.log('[chatDock] startDM openThreads(after):', { ...get().openThreads });
        } catch {}
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
    {
      name: "chat-dock",
      partialize: (s) => ({ openThreads: s.openThreads, recentContacts: s.recentContacts }),
      // Validate/repair persisted state shape at load
      version: 1,
      migrate: async (persisted: any, _version) => {
        try {
          const state = persisted?.state ?? persisted;
          const repaired: any = { ...persisted };
          const ot = state?.openThreads;
          const rc = state?.recentContacts;
          let changed = false;
          if (!ot || typeof ot !== 'object' || Array.isArray(ot)) {
            repaired.state = repaired.state || {};
            repaired.state.openThreads = {};
            changed = true;
            // eslint-disable-next-line no-console
            console.warn('[chatDock] repaired invalid openThreads in persisted state');
          }
          if (!Array.isArray(rc)) {
            repaired.state = repaired.state || {};
            repaired.state.recentContacts = [];
            changed = true;
            // eslint-disable-next-line no-console
            console.warn('[chatDock] repaired invalid recentContacts in persisted state');
          }
          // Optionally filter out entries without threadId
          if (repaired.state?.openThreads) {
            const filtered: Record<string, any> = {};
            for (const [k, v] of Object.entries(repaired.state.openThreads)) {
              const tid = (v as any)?.threadId ?? k;
              if (!tid) {
                changed = true;
                continue;
              }
              filtered[String(tid)] = {
                threadId: String(tid),
                title: (v as any)?.title,
                avatarUrl: (v as any)?.avatarUrl,
                minimized: !!(v as any)?.minimized,
                focused: !!(v as any)?.focused,
                unread: Number((v as any)?.unread ?? 0),
              };
            }
            repaired.state.openThreads = filtered;
          }
          if (changed) return repaired;
          return persisted;
        } catch (e) {
          // eslint-disable-next-line no-console
          console.warn('[chatDock] migrate failed, resetting persisted state', e);
          return { state: { openThreads: {}, recentContacts: [] }, version: 1 };
        }
      },
    }
  )
);


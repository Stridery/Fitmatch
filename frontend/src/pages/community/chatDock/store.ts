import { create } from "zustand";
import { persist } from "zustand/middleware";
import { io, Socket } from "socket.io-client";
import type { ManagerOptions, SocketOptions } from "socket.io-client";
import { getThreadMessages, startDM } from "@/api/chat";
import { supabase } from "@/lib/supabase";

/** ============ Socket 事件类型 ============ */
type ServerToClientEvents = {
  "chat:newMessage": (payload: {
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
  "chat:send": (payload: { threadId: string; content: string; clientMsgId?: string }) => void;
  "chat:joinThread": (payload: { threadId: string }) => void;
  "chat:leaveThread": (payload: { threadId: string }) => void;
  markAsRead?: (payload: { messageIds: string[] }) => void;
};

type ChatSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

/** ============ Store 公共类型 ============ */
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

/** 仅持久化的字段（与 partialize 对齐） */
type PersistedShape = {
  openThreads: Record<string, ChatThreadInfo>;
  recentContacts: { id: string; nickname?: string; avatarUrl?: string }[];
};

/** 完整 Zustand State */
interface ChatDockState extends PersistedShape {
  userId: string | null;
  socket: ChatSocket | null;

  messages: Record<string, ChatMessage[]>;

  setUserId: (userId: string | null) => void;
  ensureSocket: (userId: string) => Promise<void>;
  joinThread: (threadId: string) => Promise<void>;
  leaveThread: (threadId: string) => void;
  sendMessage: (threadId: string, content: string) => void;
  focusThread: (threadId: string) => void;
  minimizeThread: (threadId: string, minimized: boolean) => void;
  closeThread: (threadId: string) => void;
  startDM: (otherUserId: string) => Promise<string>;
  addRecentContact: (user: { id: string; nickname?: string; avatarUrl?: string }) => void;
}

/** ============ 工具/类型守卫 ============ */
type AnyRecord = Record<string, unknown>;

const isRecord = (v: unknown): v is AnyRecord =>
  typeof v === "object" && v !== null && !Array.isArray(v);

const toStringSafe = (v: unknown): string => (typeof v === "string" ? v : String(v));
const toNumber = (v: unknown, d = 0): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
};

const isNonEmptyString = (v: unknown): v is string =>
  typeof v === "string" && v.length > 0;

/** API Thread DTO（宽松） */
/*
interface ThreadDTO {
  id?: unknown;
  _id?: unknown;
  otherUser?: {
    nickname?: unknown;
    avatarUrl?: unknown;
  };
}
*/
/** API Message DTO（宽松） */
interface MessageDTO {
  _id?: unknown;
  id?: unknown;
  senderId?: unknown;
  content?: unknown;
  createdAt?: unknown;
}

/** 规范化 ThreadInfo 输入 */
const normalizeThreadInfo = (tid: string, v: unknown): ChatThreadInfo => {
  const src = isRecord(v) ? v : {};
  return {
    threadId: tid,
    title: typeof src.title === "string" ? src.title : undefined,
    avatarUrl: typeof src.avatarUrl === "string" ? src.avatarUrl : undefined,
    minimized: !!src.minimized,
    focused: !!src.focused,
    unread: toNumber(src.unread, 0),
  };
};

/** 解析 startDM 返回值 */
const parseThreadFromUnknown = (
  u: unknown
): { id: string; title?: string; avatarUrl?: string } => {
  // 1) 先解包 { thread: {...} }
  const container = isRecord(u) && isRecord(u.thread) ? (u.thread as AnyRecord)
                    : isRecord(u) ? (u as AnyRecord)
                    : {};

  // 2) 支持 id / _id
  const rawId =
    (typeof container.id === "string" && container.id) ||
    (typeof container._id === "string" && container._id) ||
    "";

  const id = rawId ? toStringSafe(rawId) : "";

  // 3) 其他展示信息
  let title: string | undefined;
  let avatarUrl: string | undefined;
  if (isRecord(container.otherUser)) {
    const ou = container.otherUser as AnyRecord;
    if (typeof ou.nickname === "string") title = ou.nickname;
    if (typeof ou.avatarUrl === "string") avatarUrl = ou.avatarUrl;
  }

  return { id, title, avatarUrl };
};

/** 解析 getThreadMessages 的单条记录 */
const parseMessageDTO = (m: unknown, threadId: string, myUserId: string): ChatMessage | null => {
  if (!isRecord(m)) return null;
  const idRaw = isNonEmptyString(m._id) ? m._id : isNonEmptyString(m.id) ? m.id : undefined;
  const senderIdRaw = m.senderId;
  const contentRaw = m.content;
  const createdAtRaw = m.createdAt;

  if (!idRaw || !isNonEmptyString(senderIdRaw)) return null;
  const id = toStringSafe(idRaw);
  const senderId = toStringSafe(senderIdRaw);
  const content = isNonEmptyString(contentRaw) ? contentRaw : toStringSafe(contentRaw ?? "");
  const createdAt = isNonEmptyString(createdAtRaw)
    ? createdAtRaw
    : new Date().toISOString();

  return {
    id,
    threadId,
    senderId,
    content,
    createdAt,
    isMine: senderId === myUserId,
  };
};

/** ============ Store 实现 ============ */
export const useChatDockStore = create<ChatDockState>()(
  persist(
    (set, get) => ({
      userId: null,
      socket: null,

      openThreads: {},
      messages: {},
      recentContacts: [],

      setUserId: (userId) => set({ userId }),

      ensureSocket: async (userId: string): Promise<void> => {
        const existing = get().socket;
        /*
        if (existing && existing.connected) return;
        if (!userId) return;
        */
       if (existing && existing.connected) { console.log("[socket] already connected"); return; }
      if (!userId) { console.warn("[socket] no userId, skip connect"); return; }


        // ✅ 标准方式读取 Vite 环境变量（构建期替换）
        const envUrl = import.meta.env.VITE_SOCKET_URL as string | undefined;
        console.log("[socket] VITE_SOCKET_URL =", envUrl);

        // 解析：支持三种写法
        // 1) "/socket.io"         -> 同域 + 自定义 path
        // 2) "https://api.x.com"  -> 跨域 + 默认 path(/socket.io)
        // 3) "https://api.x.com/ws/socket.io" -> 跨域 + 自定义 path
        let baseUrl: string | undefined;
        let pathOpt: string | undefined;

        if (envUrl && envUrl.trim() !== "") {
          if (envUrl.startsWith("/")) {
            // 只提供了 path，走同域
            baseUrl = undefined;            // io(opts) 走同域
            pathOpt = envUrl;
          } else {
            try {
              const u = new URL(envUrl, window.location.origin);
              baseUrl = `${u.protocol}//${u.host}`;
              pathOpt = u.pathname && u.pathname !== "/" ? u.pathname : undefined;
            } catch {
              // 不可解析就按同域路径处理（防御）
              if (envUrl.startsWith("/")) {
                baseUrl = undefined;
                pathOpt = envUrl;
              } else {
                baseUrl = envUrl; // 最后兜底
              }
            }
          }
        } else {
          // 没配的话用同域 + 默认 path
          baseUrl = undefined;
          pathOpt = "/socket.io";
        }

        console.log("[socket] resolved baseUrl/path:", baseUrl ?? "(same-origin)", pathOpt);


        // 拿 Supabase 的 token
        const { data } = await supabase.auth.getSession();
        const accessToken = data.session?.access_token;

        const opts: Partial<ManagerOptions & SocketOptions> = {
          transports: ["websocket"],
          autoConnect: true,
          auth: accessToken ? { token: accessToken } : undefined,
        };
        if (pathOpt) opts.path = pathOpt;

        // 根据是否有 baseUrl 选择重载
        const s: ChatSocket = baseUrl ? io(baseUrl, opts) : io(opts);

        s.on("connect_error", (err: unknown) => {
          // eslint-disable-next-line no-console
          console.error("[chatDock] socket connect_error:", err);
        });

        s.on("chat:newMessage", (payload) => {
          const currentUserId = get().userId;
          const isMine = payload.senderId === currentUserId;

          const newMsg = {
            id: payload.id,
            threadId: payload.threadId,
            senderId: payload.senderId,
            content: payload.content,
            createdAt: payload.createdAt,
            isMine,
          } as ChatMessage;

          set((state) => {
            const prev = state.messages[payload.threadId] ?? [];
            const idx = payload.clientMsgId ? prev.findIndex((m) => m.id === payload.clientMsgId) : -1;
            const updated = idx >= 0 ? [...prev.slice(0, idx), newMsg, ...prev.slice(idx + 1)] : [...prev, newMsg];
            return { messages: { ...state.messages, [payload.threadId]: updated } };
          });

          const info = get().openThreads[payload.threadId];
          if (info) {
            const nextUnread = info.focused && !info.minimized ? 0 : (isMine ? info.unread : info.unread + 1);
            set((state) => ({
              openThreads: {
                ...state.openThreads,
                [payload.threadId]: { ...info, unread: nextUnread },
              },
            }));
          }
        });

        set({ socket: s });
      },

      joinThread: async (threadId: string) => {
        console.log("[thread] joinThread start:", threadId);

        if (!threadId) return;
        const userId = get().userId;
        if (!userId) return;

        const socket = get().socket;
        if (!socket || !socket.connected) {
          await get().ensureSocket(userId);
        }

        try {
          const listUnknown = await getThreadMessages(threadId, 50);
          const list = Array.isArray(listUnknown) ? listUnknown : [];
          console.log("[thread] history fetched:", Array.isArray(list) ? list.length : list);
          const parsed: ChatMessage[] = [];
          for (const m of list) {
            const pm = parseMessageDTO(m as MessageDTO, threadId, userId);
            if (pm) parsed.push(pm);
          }
          set((state) => ({
            messages: {
              ...state.messages,
              [threadId]: parsed,
            },
          }));
        } catch (e) {
          // eslint-disable-next-line no-console
          console.warn("[chatDock] getThreadMessages failed:", e);
        }

        get().socket?.emit("chat:joinThread", { threadId });
        console.log("[thread] emitted chat:joinThread");
      },

      leaveThread: (threadId: string) => {
        if (threadId) get().socket?.emit("chat:leaveThread", { threadId });
      },

      sendMessage: (threadId: string, content: string) => {
        const userId = get().userId;
        if (!userId || !threadId) return;

        const optimisticId = `tmp_${Date.now()}`;
        const optimistic: ChatMessage = {
          id: optimisticId,
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

        const rnd =
          (globalThis.crypto && "randomUUID" in globalThis.crypto)
            ? (globalThis.crypto.randomUUID as () => string)()
            : `c_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

        set((state) => ({
          messages: {
            ...state.messages,
            [threadId]: (state.messages[threadId] ?? []).map((m) =>
              m.id === optimisticId ? { ...m, id: rnd } : m
            ),
          },
        }));

        get().socket?.emit("chat:send", { threadId, content, clientMsgId: rnd });
      },

      focusThread: (threadId: string) => {
        set((state) => {
          const info = state.openThreads[threadId];
          if (!info) return state; // 不改变
          return {
            ...state,
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
          if (!info) return state;
          return {
            ...state,
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
          const nextOpen: Record<string, ChatThreadInfo> = {};
          for (const [k, v] of Object.entries(state.openThreads)) {
            if (k !== threadId) nextOpen[k] = v;
          }
          const nextMsgs: Record<string, ChatMessage[]> = {};
          for (const [k, v] of Object.entries(state.messages)) {
            if (k !== threadId) nextMsgs[k] = v;
          }
          return { ...state, openThreads: nextOpen, messages: nextMsgs };
        });
      },

      startDM: async (otherUserId: string) => {
        if (!otherUserId) return "";

        console.log("[store] startDM called with:", otherUserId);
        const raw = (await startDM(otherUserId)) as unknown;
        console.log("[store] startDM API response:", raw);
        
        // 👉 如果你在 chat API 层还有日志，这里再加一条更清晰的：
        // console.log("[chatDock] startDM raw:", raw);

        const { id: threadId, title, avatarUrl } = parseThreadFromUnknown(raw);

        if (!isNonEmptyString(threadId)) {
          // 关键日志：把 raw 的 keys 打出来，避免把整个对象丢进 React 子树导致 #185
          const keys = isRecord(raw) ? Object.keys(raw) : typeof raw;
          // eslint-disable-next-line no-console
          console.warn("[chatDock] startDM: missing thread id. raw keys/type =", keys);
          return "";
        }

        const exists = get().openThreads[threadId];
        if (exists) {
          set((state) => ({
            ...state,
            openThreads: {
              ...state.openThreads,
              [threadId]: { ...exists, minimized: false, focused: true, unread: 0 },
            },
          }));
        } else {
          set((state) => ({
            ...state,
            openThreads: {
              ...state.openThreads,
              [threadId]: normalizeThreadInfo(threadId, {
                title: title ?? "Chat",
                avatarUrl,
                minimized: false,
                focused: true,
                unread: 0,
              }),
            },
          }));
        }

        await get().joinThread(threadId);
        return threadId;
      },

      addRecentContact: (user) => {
        if (!user.id) return;
        set((state) => {
          const rest = state.recentContacts.filter((u) => u.id !== user.id);
          return { ...state, recentContacts: [user, ...rest].slice(0, 20) };
        });
      },
    }),
    {
      name: "chat-dock",
      version: 2, // 触发修正后的 migrate
      partialize: (s) => ({ openThreads: s.openThreads, recentContacts: s.recentContacts }),

      /** 传入/返回“state 本体” */
      migrate: (persisted: unknown): PersistedShape => {
        const prev = isRecord(persisted) ? (persisted as PersistedShape) : ({} as PersistedShape);

        // ---- openThreads 修复（保持你现有实现）----
        const rawOpen = isRecord((prev as AnyRecord).openThreads)
          ? ((prev as AnyRecord).openThreads as Record<string, unknown>)
          : {};
        const fixedOpen: Record<string, ChatThreadInfo> = {};
        for (const [k, v] of Object.entries(rawOpen)) {
          const tidCandidate = isRecord(v) && isNonEmptyString(v.threadId) ? v.threadId : k;
          const tid = toStringSafe(tidCandidate);
          if (!tid) continue;
          fixedOpen[tid] = normalizeThreadInfo(tid, v);
        }

        // ---- recentContacts 修复（全新写法，避免 (T|null)[] 和必填属性陷阱）----
        const rawRecentUnknown = (prev as AnyRecord).recentContacts;
        const rawRecent: unknown[] = Array.isArray(rawRecentUnknown) ? rawRecentUnknown : [];

        const fixedRecent: PersistedShape["recentContacts"] = [];
        for (const u of rawRecent) {
          if (!isRecord(u)) continue;

          let id: string | null = null;
          if (isNonEmptyString(u.id)) id = u.id;
          else if (isNonEmptyString((u as AnyRecord)._id)) id = String((u as AnyRecord)._id);
          if (!id) continue;

          // 按条件赋值，保持“可选属性”，而不是“必有但可能 undefined”
          const entry: { id: string; nickname?: string; avatarUrl?: string } = { id };
          if (typeof u.nickname === "string") entry.nickname = u.nickname;
          if (typeof u.avatarUrl === "string") entry.avatarUrl = u.avatarUrl;

          fixedRecent.push(entry);
          if (fixedRecent.length >= 20) break;
        }

        return { openThreads: fixedOpen, recentContacts: fixedRecent };
      },

      onRehydrateStorage: () => (state) => {
        if (!state) return;
        const okOpen =
          state.openThreads && typeof state.openThreads === "object" && !Array.isArray(state.openThreads);
        const okRecent = Array.isArray(state.recentContacts);
        if (!okOpen || !okRecent) {
          // eslint-disable-next-line no-console
          console.warn("[chatDock] invalid persisted shape; resetting");
          state.openThreads = {};
          state.recentContacts = [];
        }
      },
    }
  )
);

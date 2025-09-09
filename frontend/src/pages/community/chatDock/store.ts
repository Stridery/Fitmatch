import { createWithEqualityFn } from "zustand/traditional";
import { persist } from "zustand/middleware";
import { io, Socket } from "socket.io-client";
import type { ManagerOptions, SocketOptions } from "socket.io-client";
import { getThreadMessages, startDM as apiStartDM, listThreads } from "@/api/chat";
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
  otherUserId?: string;
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

/** seed：从搜索结果直接带过来的头像与昵称 */
type ThreadSeed = { nickname?: string; avatarUrl?: string };

/** 仅持久化的字段（与 partialize 对齐） */
export type RecentContact = {
  id: string;
  nickname?: string;
  avatarUrl?: string;
  lastMessage?: string;
  lastMessageAt?: string; // ISO
  unreadCountFromUser?: number;
};

type PersistedShape = {
  openThreads: Record<string, ChatThreadInfo>;
  recentContacts: RecentContact[];
};

/** 完整 Zustand State */
export interface ChatDockState extends PersistedShape {
  userId: string | null;
  socket: ChatSocket | null;

  messages: Record<string, ChatMessage[]>;
  totalUnread: () => number;

  setUserId: (userId: string | null) => void;
  ensureSocket: (userId: string) => Promise<void>;
  joinThread: (threadId: string) => Promise<void>;
  leaveThread: (threadId: string) => void;
  sendMessage: (threadId: string, content: string) => void;
  focusThread: (threadId: string) => void;
  minimizeThread: (threadId: string, minimized: boolean) => void;
  closeThread: (threadId: string) => void;
  updateThreadInfo: (threadId: string, patch: Partial<ChatThreadInfo>) => void;
  startDM: (otherUserId: string, seed?: ThreadSeed) => Promise<string>;
  addRecentContact: (user: { id: string; nickname?: string; avatarUrl?: string }) => void;
  updateRecentOnIncoming: (senderId: string, content: string, createdAt: string) => void;
  updateRecentOnOutgoing: (otherUserId: string, content: string, createdAt: string) => void;
  clearUnreadForUser: (userId: string) => void;
  disconnectSocket: () => void;
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
const isNonEmptyString = (v: unknown): v is string => typeof v === "string" && v.length > 0;

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
    title: typeof (src as AnyRecord).title === "string" ? ((src as AnyRecord).title as string) : undefined,
    avatarUrl:
      typeof (src as AnyRecord).avatarUrl === "string"
        ? ((src as AnyRecord).avatarUrl as string)
        : undefined,
    otherUserId:
      typeof (src as AnyRecord).otherUserId === "string"
        ? ((src as AnyRecord).otherUserId as string)
        : undefined,
    minimized: !!(src as AnyRecord).minimized,
    focused: !!(src as AnyRecord).focused,
    unread: toNumber((src as AnyRecord).unread, 0),
  };
};

/** 解析 startDM 返回值（兼容 {thread:{...}} 或直接 {...}） */
const parseThreadFromUnknown = (
  u: unknown
): { id: string; title?: string; avatarUrl?: string; otherUserId?: string } => {
  const container =
    isRecord(u) && isRecord((u as AnyRecord).thread)
      ? ((u as AnyRecord).thread as AnyRecord)
      : isRecord(u)
      ? (u as AnyRecord)
      : {};

  const rawId =
    (typeof container.id === "string" && container.id) ||
    (typeof container._id === "string" && (container._id as string)) ||
    "";
  const id = rawId ? toStringSafe(rawId) : "";

  let title: string | undefined;
  let avatarUrl: string | undefined;
  let otherUserId: string | undefined;

  if (isRecord((container as AnyRecord).otherUser)) {
    const ou = (container as AnyRecord).otherUser as AnyRecord;
    if (typeof ou.id === "string") otherUserId = ou.id;
    if (typeof ou.nickname === "string") title = ou.nickname;
    if (typeof ou.avatarUrl === "string") avatarUrl = ou.avatarUrl;
  }

  return { id, title, avatarUrl, otherUserId };
};

/** 解析 getThreadMessages 的单条记录 */
const parseMessageDTO = (m: unknown, threadId: string, myUserId: string): ChatMessage | null => {
  if (!isRecord(m)) return null;
  const idRaw = isNonEmptyString((m as AnyRecord)._id)
    ? (m as AnyRecord)._id
    : isNonEmptyString((m as AnyRecord).id)
    ? (m as AnyRecord).id
    : undefined;
  const senderIdRaw = (m as AnyRecord).senderId;
  const contentRaw = (m as AnyRecord).content;
  const createdAtRaw = (m as AnyRecord).createdAt;

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

/** ===== 幂等控制：正在 join 的线程集合（开发/严格模式/HMR 下只发一次请求） ===== */
const joiningThreads = new Set<string>();

/** ============ Store 实现 ============ */
export const useChatDockStore = createWithEqualityFn<ChatDockState>()(
  persist(
    (set, get) => ({
      userId: null,
      socket: null,

      openThreads: {},
      messages: {},
      recentContacts: [],

      totalUnread: () => {
        const list = get().recentContacts ?? [];
        let sum = 0;
        for (const u of list) {
          const n = Number((u as any).unreadCountFromUser ?? 0);
          if (Number.isFinite(n)) sum += n;
        }
        return sum;
      },

      setUserId: (userId) => set({ userId }),

      ensureSocket: async (userId: string): Promise<void> => {
        if (!userId) {
          console.warn("[socket] no userId, skip connect");
          return;
        }

        const envUrl = import.meta.env.VITE_SOCKET_URL as string | undefined;
        const g = globalThis as Record<string, unknown>;
        let baseUrl: string | undefined;
        let pathOpt: string | undefined;

        if (envUrl && envUrl.trim() !== "") {
          if (envUrl.startsWith("/")) {
            baseUrl = undefined;
            pathOpt = envUrl;
          } else {
            try {
              const u = new URL(envUrl, window.location.origin);
              baseUrl = `${u.protocol}//${u.host}`;
              pathOpt = u.pathname && u.pathname !== "/" ? u.pathname : undefined;
            } catch {
              if (envUrl.startsWith("/")) {
                baseUrl = undefined;
                pathOpt = envUrl;
              } else {
                baseUrl = envUrl;
              }
            }
          }
        } else {
          baseUrl = undefined;
          pathOpt = "/socket.io";
        }

        const { data } = await supabase.auth.getSession();
        const accessToken = data.session?.access_token;

        const opts: Partial<ManagerOptions & SocketOptions> = {
          transports: ["websocket", "polling"],
          autoConnect: true,
          auth: accessToken ? { token: accessToken } : undefined,
        };
        if (pathOpt) opts.path = pathOpt;

        const s: ChatSocket = baseUrl ? io(baseUrl, opts) : io(opts);

        s.on("connect_error", (err: unknown) => {
          // eslint-disable-next-line no-console
          console.error("[chatDock] socket connect_error:", err);
        });

        s.on("chat:newMessage", (payload) => {
          const currentUserId = get().userId;
          const isMine = payload.senderId === currentUserId;

          const newMsg: ChatMessage = {
            id: payload.id,
            threadId: payload.threadId,
            senderId: payload.senderId,
            content: payload.content,
            createdAt: payload.createdAt,
            isMine,
          };

          set((state) => {
            const prev = state.messages[payload.threadId] ?? [];
            const idx =
              payload.clientMsgId ? prev.findIndex((m) => m.id === payload.clientMsgId) : -1;
            const updated =
              idx >= 0 ? [...prev.slice(0, idx), newMsg, ...prev.slice(idx + 1)] : [...prev, newMsg];
            return { messages: { ...state.messages, [payload.threadId]: updated } };
          });

          const info = get().openThreads[payload.threadId];
          if (info) {
            const nextUnread =
              info.focused && !info.minimized ? 0 : isMine ? info.unread : info.unread + 1;
            set((state) => ({
              openThreads: {
                ...state.openThreads,
                [payload.threadId]: { ...info, unread: nextUnread },
              },
            }));
          }

          // 更新最近联系人信息（未读按对端累计）
          if (isMine) {
            // 自己发的：定位对端用户ID（若已知）
            const t = get().openThreads[payload.threadId];
            const otherUserId = t?.otherUserId;
            if (otherUserId) {
              get().updateRecentOnOutgoing(otherUserId, payload.content, payload.createdAt);
            }
          } else {
            // 对方发来：senderId 即对方
            get().updateRecentOnIncoming(payload.senderId, payload.content, payload.createdAt);
          }
        });

        set({ socket: s });

        // 初次连接后尝试加载我的线程列表，便于构建最近联系人排序
        try {
          const threads = await listThreads();
          // 按 lastMsgAt 更新 recent 的时间戳，保持不丢 nickname/avatar
          set((state) => {
            const map = new Map<string, RecentContact>();
            for (const u of state.recentContacts ?? []) map.set(u.id, { ...u });
            for (const t of threads ?? []) {
              const otherId = (t as any)?.otherUser?.id as string | undefined; // 后端简版可能未返回 otherUser
              if (!otherId) continue;
              const prev = map.get(otherId) ?? { id: otherId };
              const lastAt = (t as any)?.lastMsgAt ? String((t as any).lastMsgAt) : prev.lastMessageAt;
              map.set(otherId, { ...prev, lastMessageAt: lastAt });
            }
            return { ...state, recentContacts: Array.from(map.values()) };
          });
        } catch {
          // ignore
        }

        // Disconnect on tab close
        if (!g.__chatdock_unload_bound) {
          g.__chatdock_unload_bound = true;

          globalThis.addEventListener("beforeunload", () => {
            try {
              get().socket?.disconnect();
            } catch (e) {
              // 可选：记录日志，至少不让 catch 是空的
              console.warn("[chatdock] socket disconnect on unload failed:", e);
            }
          });
        }
      },

      /** ⭐ 幂等 + 临时线程拦截 的 joinThread */
      joinThread: async (threadId: string) => {
        // 1) 临时占位线程不拉历史、不进房间
        if (!threadId || threadId.startsWith("tmp_dm_")) return;

        // 2) in-flight 防抖：同一线程并发/重复调用直接返回
        if (joiningThreads.has(threadId)) return;
        joiningThreads.add(threadId);

        try {
          const userId = get().userId;
          if (!userId) return;

          const socket = get().socket;
          if (!socket || !socket.connected) {
            await get().ensureSocket(userId);
          }

          // 3) 真正请求历史
          const listUnknown = await getThreadMessages(threadId, 50);
          const list = Array.isArray(listUnknown) ? listUnknown : [];
          const parsed: ChatMessage[] = [];
          for (const m of list) {
            const pm = parseMessageDTO(m as MessageDTO, threadId, userId);
            if (pm) parsed.push(pm);
          }
          set((state) => ({
            messages: { ...state.messages, [threadId]: parsed },
          }));

          // 4) 再 join 房间（重复 join 服务端应忽略）
          get().socket?.emit("chat:joinThread", { threadId });
        } catch (e) {
          console.warn("[chatDock] getThreadMessages failed:", e);
        } finally {
          joiningThreads.delete(threadId);
        }
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

        // 立刻刷新最近联系人（无需等待服务端回环）
        const t = get().openThreads[threadId];
        const otherUserId = t?.otherUserId;
        if (otherUserId) {
          get().updateRecentOnOutgoing(otherUserId, content, new Date().toISOString());
        }
      },

      focusThread: (threadId: string) => {
        set((state) => {
          const info = state.openThreads[threadId];
          if (!info) return state;
          return {
            ...state,
            openThreads: {
              ...state.openThreads,
              [threadId]: { ...info, focused: true, minimized: false, unread: 0 },
            },
          };
        });
        // 打开时清除该会话对端的未读
        const t = get().openThreads[threadId];
        const otherUserId = t?.otherUserId;
        if (otherUserId) get().clearUnreadForUser(otherUserId);
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

      updateThreadInfo: (threadId: string, patch: Partial<ChatThreadInfo>) => {
        set((state) => {
          const before = state.openThreads[threadId];
          if (!before) return state;
          return {
            ...state,
            openThreads: {
              ...state.openThreads,
              [threadId]: normalizeThreadInfo(threadId, { ...before, ...patch }),
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

        const remaining = Object.keys(get().openThreads).length;
        if (remaining === 0) {
          const s = get().socket;
          try {
            s?.disconnect();
          } catch {
            // noop
          }
          set({ socket: null });
        }
      },

      /** ⭐ 支持 seed：先临时窗口，后合并真实线程 */
      startDM: async (otherUserId: string, seed?: ThreadSeed) => {
        if (!otherUserId) return "";

        // 1) 临时窗口
        const tempId = `tmp_dm_${otherUserId}`;
        const existing = get().openThreads[tempId];
        if (!existing) {
          set((state) => ({
            openThreads: {
              ...state.openThreads,
              [tempId]: {
                threadId: tempId,
                title: seed?.nickname ?? "Chat",
                avatarUrl: seed?.avatarUrl,
                otherUserId,
                minimized: false,
                focused: true,
                unread: 0,
              },
            },
          }));
        } else {
          set((state) => ({
            openThreads: {
              ...state.openThreads,
              [tempId]: {
                ...state.openThreads[tempId],
                title: seed?.nickname ?? state.openThreads[tempId].title,
                avatarUrl: seed?.avatarUrl ?? state.openThreads[tempId].avatarUrl,
                minimized: false,
                focused: true,
              },
            },
          }));
        }

        // 2) 请求后端，拿真实 ID
        const raw = (await apiStartDM(otherUserId)) as unknown;
        const { id: realId, title, avatarUrl, otherUserId: fromApi } = parseThreadFromUnknown(raw);
        const threadId = realId || tempId;

        // 3) 合并临时 -> 真实
        set((state) => {
          const curr = state.openThreads[tempId] || {
            threadId: tempId,
            title: "Chat",
            avatarUrl: undefined as string | undefined,
            otherUserId,
            minimized: false,
            focused: true,
            unread: 0,
          };
          const next = { ...state.openThreads };
          delete next[tempId];
          next[threadId] = {
            ...curr,
            threadId,
            title: title ?? seed?.nickname ?? curr.title,
            avatarUrl: avatarUrl ?? seed?.avatarUrl ?? curr.avatarUrl,
            otherUserId: fromApi ?? otherUserId,
            minimized: false,
            focused: true,
            unread: 0,
          };
          return { openThreads: next };
        });

        // 3.5) 将联系人加入最近列表（不重复）
        get().addRecentContact({ id: fromApi ?? otherUserId, nickname: title ?? seed?.nickname, avatarUrl: avatarUrl ?? seed?.avatarUrl });

        // 4) 加入真实线程（由 joinThread 负责幂等 + 加载历史）
        await get().joinThread(threadId);
        return threadId;
      },

      addRecentContact: (user) => {
        if (!user.id) return;
        set((state) => {
          const rest = state.recentContacts.filter((u) => u.id !== user.id);
          const merged = [{ ...user }, ...rest];
          return { ...state, recentContacts: merged.slice(0, 20) };
        });
      },

      updateRecentOnIncoming: (senderId, content, createdAt) => {
        if (!senderId) return;
        set((state) => {
          const list = state.recentContacts ?? [];
          const others = list.filter((u) => u.id !== senderId);
          const prev = list.find((u) => u.id === senderId) ?? { id: senderId };
          const unread = Number(prev.unreadCountFromUser ?? 0) + 1;
          const next = {
            ...prev,
            lastMessage: content,
            lastMessageAt: createdAt,
            unreadCountFromUser: unread,
          } as RecentContact;
          return { ...state, recentContacts: [next, ...others].slice(0, 50) };
        });
      },

      updateRecentOnOutgoing: (otherUserId, content, createdAt) => {
        if (!otherUserId) return;
        set((state) => {
          const list = state.recentContacts ?? [];
          const others = list.filter((u) => u.id !== otherUserId);
          const prev = list.find((u) => u.id === otherUserId) ?? { id: otherUserId };
          const next = {
            ...prev,
            lastMessage: content,
            lastMessageAt: createdAt,
            unreadCountFromUser: 0, // 自己发出不产生对端未读计数
          } as RecentContact;
          return { ...state, recentContacts: [next, ...others].slice(0, 50) };
        });
      },

      clearUnreadForUser: (userId) => {
        if (!userId) return;
        set((state) => ({
          ...state,
          recentContacts: (state.recentContacts ?? []).map((u) =>
            u.id === userId ? { ...u, unreadCountFromUser: 0 } : u
          ),
        }));
      },

      disconnectSocket: () => {
        try { get().socket?.disconnect(); } catch {
          console.warn("[chatdock] socket disconnect failed");
        }
        set({ socket: null });
      },
    }),
    {
      name: "chat-dock",
      version: 3,
      partialize: (s) => ({ openThreads: s.openThreads, recentContacts: s.recentContacts }),

      migrate: (persisted: unknown): PersistedShape => {
        const prev = isRecord(persisted) ? (persisted as PersistedShape) : ({} as PersistedShape);

        const rawOpen = isRecord((prev as AnyRecord).openThreads)
          ? ((prev as AnyRecord).openThreads as Record<string, unknown>)
          : {};
        const fixedOpen: Record<string, ChatThreadInfo> = {};
        for (const [k, v] of Object.entries(rawOpen)) {
          const tidCandidate = isRecord(v) && isNonEmptyString((v as AnyRecord).threadId)
            ? ((v as AnyRecord).threadId as string)
            : k;
          const tid = toStringSafe(tidCandidate);
          if (!tid) continue;
          fixedOpen[tid] = normalizeThreadInfo(tid, v);
        }

        const rawRecentUnknown = (prev as AnyRecord).recentContacts;
        const rawRecent: unknown[] = Array.isArray(rawRecentUnknown) ? rawRecentUnknown : [];

        const fixedRecent: PersistedShape["recentContacts"] = [];
        for (const u of rawRecent) {
          if (!isRecord(u)) continue;

          let id: string | null = null;
          if (isNonEmptyString((u as AnyRecord).id)) id = (u as AnyRecord).id as string;
          else if (isNonEmptyString((u as AnyRecord)._id)) id = String((u as AnyRecord)._id);
          if (!id) continue;

          const entry: RecentContact = { id };
          if (typeof (u as AnyRecord).nickname === "string") entry.nickname = (u as AnyRecord).nickname as string;
          if (typeof (u as AnyRecord).avatarUrl === "string") entry.avatarUrl = (u as AnyRecord).avatarUrl as string;
          if (typeof (u as AnyRecord).lastMessage === "string") entry.lastMessage = (u as AnyRecord).lastMessage as string;
          if (typeof (u as AnyRecord).lastMessageAt === "string") entry.lastMessageAt = (u as AnyRecord).lastMessageAt as string;
          if (Number.isFinite(Number((u as AnyRecord).unreadCountFromUser))) entry.unreadCountFromUser = Number((u as AnyRecord).unreadCountFromUser);

          fixedRecent.push(entry);
          if (fixedRecent.length >= 50) break;
        }

        return { openThreads: fixedOpen, recentContacts: fixedRecent };
      },

      onRehydrateStorage: () => (state) => {
        if (!state) return;
        const okOpen =
          state.openThreads &&
          typeof state.openThreads === "object" &&
          !Array.isArray(state.openThreads);
        const okRecent = Array.isArray(state.recentContacts);
        if (!okOpen || !okRecent) {
          console.warn("[chatDock] invalid persisted shape; resetting");
          state.openThreads = {};
          state.recentContacts = [];
        }
      },
    }
  )
);
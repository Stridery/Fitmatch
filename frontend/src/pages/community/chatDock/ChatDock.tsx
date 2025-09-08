import { useEffect, useRef } from "react";
import { X, Minus, Maximize2 } from "lucide-react";
import { useChatDockStore } from "./store";
import ChatWindowContent from "./ChatWindowContent";
import { useUser } from "@/contexts/UserContext";
import HeaderPanel from "./HeaderPanel";
import { searchUsers } from "@/api/user";

export default function ChatDock() {
  const { user } = useUser();

  const setUserId = useChatDockStore((s) => s.setUserId);
  const ensureSocket = useChatDockStore((s) => s.ensureSocket);

  const openThreads = useChatDockStore((s) => s.openThreads);
  const minimizeThread = useChatDockStore((s) => s.minimizeThread);
  const closeThread = useChatDockStore((s) => s.closeThread);
  const focusThread = useChatDockStore((s) => s.focusThread);
  const updateThreadInfo = useChatDockStore((s) => s.updateThreadInfo);
  const recent = useChatDockStore((s) => s.recentContacts);

  useEffect(() => {
    if (user?.id) {
      setUserId(user.id);
      ensureSocket(user.id);
    }
  }, [user?.id, setUserId, ensureSocket]);

  const entries =
    openThreads && typeof openThreads === "object" ? Object.entries(openThreads) : [];

  // 尝试为缺失 avatar/title 的线程补全：先 recentContacts，兜底再查接口
  const fetchedRef = useRef<Record<string, boolean>>({});
  useEffect(() => {
    (async () => {
      for (const [threadId, raw] of entries) {
        const otherUserId =
          typeof (raw as any)?.otherUserId === "string" ? (raw as any).otherUserId : undefined;
        const avatarUrl =
          typeof (raw as any)?.avatarUrl === "string" ? (raw as any).avatarUrl : undefined;
        if (!otherUserId || avatarUrl) continue;

        // 1) 先用最近联系人兜底（同步、最快）
        const fromRecent = recent.find((u) => u.id === otherUserId);
        if (fromRecent?.avatarUrl || fromRecent?.nickname) {
          updateThreadInfo(threadId, {
            avatarUrl:
              typeof fromRecent.avatarUrl === "string" ? fromRecent.avatarUrl : undefined,
            title: typeof fromRecent.nickname === "string" ? fromRecent.nickname : undefined,
          });
          continue;
        }

        // 2) 退而求其次：调用远程（避免重复）
        if (fetchedRef.current[threadId]) continue;
        fetchedRef.current[threadId] = true;
        try {
          // 如果有按ID查用户的 API，建议改成 getUserById(otherUserId)
          const users = await searchUsers(otherUserId);
          const u = Array.isArray(users) && users.length > 0 ? users[0] : undefined;
          if (u) {
            updateThreadInfo(threadId, {
              avatarUrl: typeof (u as any).avatarUrl === "string" ? (u as any).avatarUrl : undefined,
              title: typeof (u as any).nickname === "string" ? (u as any).nickname : undefined,
            });
          }
        } catch {
          // ignore
        }
      }
    })();
  }, [entries, recent, updateThreadInfo]);

  return (
    <div className="fixed bottom-4 right-4 z-50 hidden lg:flex items-end gap-3">
      <HeaderPanel />

      {entries.map(([threadId, raw]) => {
        const info = {
          threadId,
          title:
            typeof (raw as any)?.title === "string" ? (raw as any).title : undefined,
          avatarUrl:
            typeof (raw as any)?.avatarUrl === "string" ? (raw as any).avatarUrl : undefined,
          otherUserId:
            typeof (raw as any)?.otherUserId === "string" ? (raw as any).otherUserId : undefined,
          minimized: !!(raw as any)?.minimized,
          focused: !!(raw as any)?.focused,
          unread: Number.isFinite(Number((raw as any)?.unread))
            ? Number((raw as any).unread)
            : 0,
        };

        console.log("[dock] threadId=", threadId, "avatarUrl=", info.avatarUrl, "title=", info.title);

        // 关键日志：看看 header 渲染到底拿到了什么
        // console.debug("[dock] header info", info);

        // 兜底：如果 openThreads 里还没头像，尝试从 recentContacts 匹配
        const fallbackAvatar =
          (info.otherUserId &&
            recent.find((u) => u.id === info.otherUserId)?.avatarUrl) ||
          undefined;
        const displayAvatar = info.avatarUrl || fallbackAvatar;

        return (
          <div
            key={threadId}
            className={`w-[320px] ${
              info.minimized ? "h-12" : "h-[420px]"
            } bg-white shadow-xl rounded-lg overflow-hidden border`}
            onMouseDown={() => focusThread(threadId)}
          >
            {/* Header */}
            <div className="h-12 border-b bg-white flex items-center px-3 gap-2 select-none">
              {typeof displayAvatar === "string" && displayAvatar.length > 0 ? (
                <img
                  src={displayAvatar}
                  className="w-7 h-7 rounded-full object-cover"
                  onError={(e) => {
                    // 方便定位 404 / 权限问题
                    // console.warn("[dock] avatar load failed:", displayAvatar);
                    (e.currentTarget as HTMLImageElement).style.display = "none";
                  }}
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-gray-200" />
              )}
              <div className="text-sm font-medium flex-1 truncate">
                {info.title ?? "Chat"}
              </div>
              {info.unread > 0 && (
                <div className="text-xs bg-red-600 text-white px-2 py-0.5 rounded-full mr-1">
                  {info.unread}
                </div>
              )}
              <button
                className="p-1 rounded text-gray-600 hover:bg-gray-100 hover:text-black"
                onClick={() => minimizeThread(threadId, !info.minimized)}
                title={info.minimized ? "Expand" : "Minimize"}
              >
                {info.minimized ? <Maximize2 size={16} /> : <Minus size={16} />}
              </button>
              <button
                className="p-1 rounded text-gray-600 hover:bg-gray-100 hover:text-black"
                onClick={() => closeThread(threadId)}
                title="Close"
              >
                <X size={16} />
              </button>
            </div>

            {/* Body */}
            {!info.minimized && (
              <div className="h-[calc(100%-3rem)]">
                <ChatWindowContent threadId={threadId} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
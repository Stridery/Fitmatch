import { useEffect } from "react";
import { X, Minus, Maximize2 } from "lucide-react";
import { useChatDockStore } from "./store";
import ChatWindowContent from "./ChatWindowContent";
import { useUser } from "@/contexts/UserContext";
import HeaderPanel from "./HeaderPanel";

export default function ChatDock() {
  const { user } = useUser();
  const setUserId = useChatDockStore((s) => s.setUserId);
  const ensureSocket = useChatDockStore((s) => s.ensureSocket);
  const openThreads = useChatDockStore((s) => s.openThreads);
  const minimizeThread = useChatDockStore((s) => s.minimizeThread);
  const closeThread = useChatDockStore((s) => s.closeThread);
  const focusThread = useChatDockStore((s) => s.focusThread);

  useEffect(() => {
    if (user?.id) {
      setUserId(user.id);
      // 直接连上 socket，避免 joinThread 时 userId 未就绪
      ensureSocket(user.id);
    }
  }, [user?.id]);

  const entries =
    openThreads && typeof openThreads === "object" ? Object.entries(openThreads) : [];
  console.log("[ui] ChatDock render, openThreads count:", entries.length);

  return (
    <div className="fixed bottom-4 right-4 z-50 hidden lg:flex items-end gap-3">
      <HeaderPanel />

      {entries.map(([threadId, raw]) => {
        console.log("[ui] render threadId =", threadId, "raw =", raw);

        const info = {
          threadId,
          title: typeof (raw as any)?.title === "string" ? (raw as any).title : (raw as any)?.title,
          avatarUrl: typeof (raw as any)?.avatarUrl === "string" ? (raw as any).avatarUrl : (raw as any)?.avatarUrl,
          minimized: !!(raw as any)?.minimized,
          focused: !!(raw as any)?.focused,
          unread: Number.isFinite(Number((raw as any)?.unread)) ? Number((raw as any).unread) : (raw as any)?.unread,
        };

        // 单独打印每个字段，确认类型
        console.log("[ui] thread info fields:", {
          threadId: info.threadId,
          title: info.title,
          titleType: typeof info.title,
          avatarUrl: info.avatarUrl,
          avatarUrlType: typeof info.avatarUrl,
          minimized: info.minimized,
          focused: info.focused,
          unread: info.unread,
          unreadType: typeof info.unread,
        });

        return (
          <div
            key={threadId}
            className={`w-[320px] ${info.minimized ? "h-12" : "h-[420px]"} bg-white shadow-xl rounded-lg overflow-hidden border`}
            onMouseDown={() => focusThread(threadId)}
          >
            {/* Header */}
            <div className="h-12 border-b bg-white flex items-center px-3 gap-2 select-none">
              {typeof info.avatarUrl === "string" && info.avatarUrl.length > 0 ? (
                <img src={info.avatarUrl} className="w-7 h-7 rounded-full object-cover" />
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
                className="p-1 hover:bg-gray-100 rounded"
                onClick={() => minimizeThread(threadId, !info.minimized)}
                title={info.minimized ? "Expand" : "Minimize"}
              >
                {info.minimized ? <Maximize2 size={16} /> : <Minus size={16} />}
              </button>
              <button
                className="p-1 hover:bg-gray-100 rounded"
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
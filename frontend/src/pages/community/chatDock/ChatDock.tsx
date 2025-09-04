import { useEffect } from "react";
import { X, Minus, Maximize2 } from "lucide-react";
import { useChatDockStore } from "./store";
import ChatWindowContent from "./ChatWindowContent";
import { useUser } from "@/contexts/UserContext";
import HeaderPanel from "./HeaderPanel";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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
      ensureSocket(user.id);
    }
  }, [user?.id, setUserId, ensureSocket]);

  // Desktop only
  if (typeof window !== "undefined" && window.innerWidth < 1024) return null;

  const threadEntries = Object.entries(openThreads);

  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-end gap-3">
      <HeaderPanel />

      {threadEntries.map(([threadId, info]) => (
        <div
          key={threadId}
          className={`w-[320px] ${info.minimized ? "h-12" : "h-[420px]"} bg-white shadow-xl rounded-lg overflow-hidden border`}
          onMouseDown={() => focusThread(threadId)}
        >
          {/* Header */}
          <div className="h-12 border-b bg-white flex items-center px-3 gap-2 select-none">
            <Avatar className="w-7 h-7">
              {info.avatarUrl && <AvatarImage src={info.avatarUrl} alt={info.title ?? "Chat avatar"} />}
              <AvatarFallback>{(info.title?.charAt(0) ?? "?").toUpperCase()}</AvatarFallback>
            </Avatar>
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
      ))}
    </div>
  );
}


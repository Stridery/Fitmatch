import { useEffect, useRef, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useChatDockStore } from "./store";

export default function ChatWindowContent({ threadId }: { threadId: string }) {
  const messages = useChatDockStore((s) => s.messages[threadId] ?? []);
  const joinThread = useChatDockStore((s) => s.joinThread);
  const leaveThread = useChatDockStore((s) => s.leaveThread);
  const sendMessage = useChatDockStore((s) => s.sendMessage);

  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement | null>(null);

  // mount / unmount：进入/离开线程
  useEffect(() => {
    if (!threadId) return;
    console.log("[ui] ChatWindowContent mount -> joinThread", threadId);
    joinThread(threadId);
    return () => {
      console.log("[ui] ChatWindowContent unmount -> leaveThread", threadId);
      leaveThread(threadId);
    };
  }, [threadId, joinThread, leaveThread]);

  // 消息变化时滚动到底部
  useEffect(() => {
    console.log("[ui] messages.len =", messages.length, "for", threadId);
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, threadId]);

  const fmtTime = (iso: string) => {
    const d = new Date(iso);
    return Number.isNaN(d.getTime())
      ? "-"
      : d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;
    sendMessage(threadId, text);
    setInput("");
  };

  // 将任意类型的 content 转为可安全渲染的字符串，避免 React #185
  const toDisplayText = (val: unknown): string => {
    if (typeof val === "string") return val;
    console.warn("[ui] non-string message.content, typeof =", typeof val, val);
    try {
      return JSON.stringify(val);
    } catch {
      return String(val);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-gray-50">
        {(Array.isArray(messages) ? messages : []).map((m) => {
          const text = toDisplayText(m.content);
          return (
            <div key={m.id} className="flex">
              <div
                className={`max-w-[75%] px-3 py-2 rounded-lg text-sm ${
                  m.isMine ? "bg-blue-600 text-white ml-auto" : "bg-white border ml-0"
                }`}
              >
                {text}
                <div className="mt-1 text-[10px] opacity-70 text-right">
                  {fmtTime(m.createdAt)}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      {/* 输入区 */}
      <div className="h-20 border-t bg-white flex items-center gap-2 px-3">
        <Textarea
          placeholder="Type a message"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          className="flex-1 resize-none h-12"
        />
        <Button onClick={handleSend}>Send</Button>
      </div>
    </div>
  );
}

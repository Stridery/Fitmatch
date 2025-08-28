import { useEffect, useMemo, useRef, useState } from "react";
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

  useEffect(() => {
    if (!threadId) return;
    joinThread(threadId);
    return () => leaveThread(threadId);
    // Intentionally depend only on threadId to avoid effect churn from store fn identities
  }, [threadId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;
    sendMessage(threadId, text);
    setInput("");
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-gray-50">
        {messages.map((m) => (
          <div key={m.id} className="flex">
            <div
              className={`max-w-[75%] px-3 py-2 rounded-lg text-sm ${
                m.isMine ? "bg-blue-600 text-white ml-auto" : "bg-white border ml-0"
              }`}
            >
              {m.content}
              <div className="mt-1 text-[10px] opacity-70 text-right">
                {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </div>
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>
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


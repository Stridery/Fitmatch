import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useCommunityStore } from "../store";

export function ChatWindow() {
  const selectedConversationId = useCommunityStore((s) => s.selectedConversationId);
  const currentConversation = useCommunityStore((s) => s.currentConversation);
  const messages = useCommunityStore((s) => s.messages[selectedConversationId ?? ""] ?? []);
  const fetchMessageHistory = useCommunityStore((s) => s.fetchMessageHistory);
  const sendMessage = useCommunityStore((s) => s.sendMessage);
  const loadingMessages = useCommunityStore((s) => s.loading.messages);
  const errors = useCommunityStore((s) => s.errors);

  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (selectedConversationId) {
      fetchMessageHistory(selectedConversationId);
    }
  }, [fetchMessageHistory, selectedConversationId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  if (!currentConversation) return null;

  const handleSend = () => {
    const text = input.trim();
    if (!text || !selectedConversationId) return;
    sendMessage({ conversationId: selectedConversationId, content: text });
    setInput("");
  };

  return (
    <div className="flex flex-col h-full">
      <div className="h-14 border-b bg-white flex items-center gap-3 px-4">
        <img
          src={currentConversation.otherUser.avatarUrl}
          alt={currentConversation.otherUser.nickname}
          className="w-8 h-8 rounded-full"
        />
        <div className="font-medium">{currentConversation.otherUser.nickname}</div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
        {loadingMessages && (
          <div className="text-sm text-gray-500">Loading messages...</div>
        )}
        {errors.messages && (
          <div className="text-sm text-red-600">{errors.messages}</div>
        )}
        {messages.map((m) => (
          <div key={m.id} className="flex">
            <div
              className={`max-w-[75%] px-3 py-2 rounded-lg text-sm ${
                m.isMine
                  ? "bg-blue-600 text-white ml-auto"
                  : "bg-white border ml-0"
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

      <div className="h-16 border-t bg-white flex items-center gap-2 px-3">
        <Input
          placeholder="Type a message"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSend();
          }}
          className="flex-1"
        />
        <Button onClick={handleSend}>Send</Button>
      </div>
    </div>
  );
}


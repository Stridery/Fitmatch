import React, { useRef, useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface Message {
  sender: "me" | "other";
  content: string;
}

const ChatPage: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    { sender: "other", content: "你好！" },
    { sender: "me", content: "你好，请问你今天有空训练吗？" },
  ]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages((prev) => [...prev, { sender: "me", content: input }]);
    setInput("");
    // 🔧 后续你可以在这里发 socket.emit
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex h-screen">
      {/* 📍 左侧联系人列表 */}
      <div className="w-1/4 border-r p-4">
        <h2 className="text-xl font-semibold mb-4">联系人</h2>
        <ul className="space-y-2">
          <li className="cursor-pointer p-2 rounded hover:bg-gray-100">好友 A</li>
          <li className="cursor-pointer p-2 rounded hover:bg-gray-100">好友 B</li>
        </ul>
      </div>

      {/* 💬 右侧聊天框 */}
      <div className="flex flex-col w-3/4">
        {/* 顶部栏 */}
        <div className="h-14 border-b flex items-center px-4 text-lg font-medium">
          与 好友 A 的对话
        </div>

        {/* 消息显示区域 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`max-w-xs px-4 py-2 rounded-lg ${
                msg.sender === "me"
                  ? "bg-blue-500 text-white self-end ml-auto"
                  : "bg-gray-200 text-black self-start mr-auto"
              }`}
            >
              {msg.content}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* 底部输入框 */}
        <div className="h-16 border-t flex items-center px-4 gap-2">
          <Input
            placeholder="输入消息..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1"
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSend();
            }}
          />
          <Button onClick={handleSend}>发送</Button>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
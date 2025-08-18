import { useEffect } from "react";
import { useCommunityStore } from "./store";
import { ChatWindow } from "./chat/ChatWindow";

export function MessagesTab() {
  const conversations = useCommunityStore((s) => s.conversations);
  const selectedConversationId = useCommunityStore((s) => s.selectedConversationId);
  const selectConversation = useCommunityStore((s) => s.selectConversation);
  const fetchConversations = useCommunityStore((s) => s.fetchConversations);
  const loadingConversations = useCommunityStore((s) => s.loading.conversations);
  const errors = useCommunityStore((s) => s.errors);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  return (
    <div className="flex h-[72vh] border rounded-md overflow-hidden">
      <aside className="w-80 border-r bg-white">
        <div className="p-3 border-b font-semibold">Conversations</div>
        {loadingConversations && (
          <div className="p-3 text-sm text-gray-500">Loading conversations...</div>
        )}
        {errors.conversations && (
          <div className="p-3 text-sm text-red-600">{errors.conversations}</div>
        )}
        <ul className="divide-y">
          {conversations.map((c) => (
            <li
              key={c.id}
              onClick={() => selectConversation(c.id)}
              className={`p-3 cursor-pointer hover:bg-gray-50 ${
                selectedConversationId === c.id ? "bg-blue-50" : ""
              }`}
            >
              <div className="flex items-center gap-3">
                <img
                  src={c.otherUser.avatarUrl}
                  alt={c.otherUser.nickname}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div className="min-w-0">
                  <div className="flex justify-between gap-2">
                    <span className="font-medium truncate">
                      {c.otherUser.nickname}
                    </span>
                    <span className="text-xs text-gray-500 shrink-0">
                      {new Date(c.updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 truncate">
                    {c.lastMessage?.content ?? "Start chatting"}
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </aside>

      <section className="flex-1 bg-gray-50">
        {selectedConversationId ? (
          <ChatWindow />
        ) : (
          <div className="h-full grid place-items-center text-gray-500">
            Select a conversation
          </div>
        )}
      </section>
    </div>
  );
}


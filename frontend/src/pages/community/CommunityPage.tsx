import { useEffect } from "react";
import { MessagesTab } from "./MessagesTab";
import { ContactsTab } from "./ContactsTab";
import { PostsTab } from "./PostsTab";
import { useCommunityStore } from "./store";
import { useUser } from "@/contexts/UserContext";

export default function CommunityPage() {
  const currentTab = useCommunityStore((s) => s.currentTab);
  const setCurrentTab = useCommunityStore((s) => s.setCurrentTab);
  const ensureSocket = useCommunityStore((s) => s.ensureSocket);
  const setCurrentUserId = useCommunityStore((s) => s.setCurrentUserId);
  const { user } = useUser();

  useEffect(() => {
    // Default to messages tab when entering the page
    setCurrentTab("messages");
  }, [setCurrentTab]);

  useEffect(() => {
    if (user?.id) {
      setCurrentUserId(user.id);
      ensureSocket(user.id);
    }
  }, [user?.id, ensureSocket, setCurrentUserId]);

  return (
    <div className="w-full">
      <div className="mb-4 border-b border-gray-200">
        <nav className="flex gap-4" aria-label="Tabs">
          <button
            className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              currentTab === "messages"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-600 hover:text-blue-600"
            }`}
            onClick={() => setCurrentTab("messages")}
          >
            Messages
          </button>
          <button
            className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              currentTab === "contacts"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-600 hover:text-blue-600"
            }`}
            onClick={() => setCurrentTab("contacts")}
          >
            Contacts
          </button>
          <button
            className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              currentTab === "posts"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-600 hover:text-blue-600"
            }`}
            onClick={() => setCurrentTab("posts")}
          >
            Posts
          </button>
        </nav>
      </div>

      {currentTab === "messages" && <MessagesTab />}
      {currentTab === "contacts" && <ContactsTab />}
      {currentTab === "posts" && <PostsTab />}
    </div>
  );
}


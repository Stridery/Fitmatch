import { useEffect } from "react";
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
    setCurrentTab("posts");
  }, [setCurrentTab]);

  useEffect(() => {
    if (user?.id) {
      setCurrentUserId(user.id);
      ensureSocket();
    }
  }, [user?.id, ensureSocket, setCurrentUserId]);

  return (
    <div className="w-full">
      <div className="mb-4 flex items-center justify-between">
        <div className="text-lg font-semibold">Community</div>
        <div className="hidden lg:block" />
      </div>
      <PostsTab />
    </div>
  );
}


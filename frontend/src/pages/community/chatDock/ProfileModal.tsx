import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { getUserByUsername } from "@/api/userSearch";
import { useChatDockStore } from "./store";

interface Props {
  username: string | null;
  onClose: () => void;
}

export default function ProfileModal({ username, onClose }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any | null>(null);
  const startDM = useChatDockStore((s) => s.startDM);

  useEffect(() => {
    (async () => {
      if (!username) return;
      try {
        setLoading(true);
        setError(null);
        const u = await getUserByUsername(username);
        setUser(u);
      } catch (e) {
        setError("Failed to load profile");
      } finally {
        setLoading(false);
      }
    })();
  }, [username]);

  return (
    <Dialog open={!!username} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Profile</DialogTitle>
        </DialogHeader>
        {loading && <div className="text-sm text-gray-500">Loading...</div>}
        {error && <div className="text-sm text-red-600">{error}</div>}
        {user && (
          <div className="flex items-center gap-3">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} className="w-12 h-12 rounded-full" />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gray-200" />
            )}
            <div className="flex-1">
              <div className="font-medium">{user.nickname ?? user.username}</div>
              <div className="text-xs text-gray-500">@{user.username}</div>
            </div>
            <Button onClick={() => startDM(user._id)}>Message</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}


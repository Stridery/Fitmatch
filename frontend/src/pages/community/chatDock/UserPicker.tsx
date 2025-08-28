import { useEffect, useMemo, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { searchUsers } from "@/api/user";
import { useChatDockStore } from "./store";
import ProfileModal from "./ProfileModal";

export default function UserPicker() {
  const startDM = useChatDockStore((s) => s.startDM);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [list, setList] = useState<any[]>([]);
  const [profileUsername, setProfileUsername] = useState<string | null>(null);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    if (timer.current) window.clearTimeout(timer.current);
    if (q.trim().length < 2) {
      setList([]);
      return;
    }
    timer.current = window.setTimeout(async () => {
      try {
        setLoading(true);
        setError(null);
        const users = await searchUsers(q.trim());
        setList(users);
      } catch (e) {
        setError("Failed to search users");
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [q]);

  return (
    <div className="w-80 bg-white border rounded-lg shadow p-3">
      <div className="text-sm font-medium mb-2">Start a chat</div>
      <Input placeholder="Search user..." value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="mt-2 max-h-64 overflow-y-auto space-y-1">
        {loading && <div className="text-xs text-gray-500">Searching...</div>}
        {error && <div className="text-xs text-red-600">{error}</div>}
        {list.map((u) => (
          <div key={u._id} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded">
            {u.avatarUrl ? (
              <img src={u.avatarUrl} className="w-7 h-7 rounded-full" />
            ) : (
              <div className="w-7 h-7 rounded-full bg-gray-200" />
            )}
            <div className="flex-1 min-w-0">
              <div className="text-sm truncate">{u.nickname ?? u.username}</div>
              <div className="text-[11px] text-gray-500 truncate">@{u.username}</div>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="secondary" onClick={() => setProfileUsername(u.username)}>
                View Profile
              </Button>
              <Button size="sm" onClick={() => startDM(u._id)}>Message</Button>
            </div>
          </div>
        ))}
        {!loading && !error && q.trim().length >= 2 && list.length === 0 && (
          <div className="text-xs text-gray-500">No users found</div>
        )}
      </div>
      <ProfileModal username={profileUsername} onClose={() => setProfileUsername(null)} />
    </div>
  );
}


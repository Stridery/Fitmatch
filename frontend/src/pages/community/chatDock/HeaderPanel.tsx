import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { searchUsers, type PublicUserDTO } from "@/api/user";
import { useChatDockStore } from "./store";

export default function HeaderPanel() {
  const startDM = useChatDockStore((s) => s.startDM);
  const recent = useChatDockStore((s) => s.recentContacts);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [list, setList] = useState<PublicUserDTO[]>([]);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    if (timer.current) window.clearTimeout(timer.current);
    if (q.trim().length < 2) {
      setList([]);
      setError(null);
      setLoading(false);
      return;
    }
    timer.current = window.setTimeout(async () => {
      try {
        setLoading(true);
        setError(null);
        const users = await searchUsers(q.trim());
        setList(Array.isArray(users) ? users : []);
      } catch {
        setError("Failed to search");
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [q]);

  useEffect(() => {
    try {
      console.log("[chatDock] persisted:", localStorage.getItem("chat-dock"));
    } catch {}
  }, []);

  // 每次渲染打印一下列表状态
  console.log("[ui] HeaderPanel render q=", q,
    "recent=", Array.isArray(recent) ? recent : null,
    "list=", Array.isArray(list) ? list : null);

  const renderUser = (u: { id: string; nickname?: unknown; avatarUrl?: unknown }) => {
    console.log("[ui] renderUser id=", u.id,
      "nickname=", u.nickname, "typeof=", typeof u.nickname,
      "avatarUrl=", u.avatarUrl, "typeof=", typeof u.avatarUrl);

    return (
      <div
        key={u.id}
        className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
        onClick={async () => {
          try {
            console.log("[ui] click startDM", u.id);
            const tid = await startDM(u.id);
            console.log("[ui] startDM returned:", tid);
          } finally {
            setQ("");
            setList([]);
          }
        }}
      >
        {typeof u.avatarUrl === "string" ? (
          <img src={u.avatarUrl} className="w-7 h-7 rounded-full" />
        ) : (
          <div className="w-7 h-7 rounded-full bg-gray-200" />
        )}
        <div className="text-sm truncate">
          {typeof u.nickname === "string" ? u.nickname : JSON.stringify(u.nickname ?? u.id)}
        </div>
      </div>
    );
  };

  return (
    <div className="w-[280px] bg-white border rounded-lg shadow overflow-hidden">
      <div className="p-2 border-b bg-gray-50">
        <Input placeholder="Search by nickname" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <div className="max-h-72 overflow-y-auto p-2">
        {q.trim().length >= 2 ? (
          <div className="space-y-1">
            {loading && <div className="text-xs text-gray-500">Searching...</div>}
            {error && <div className="text-xs text-red-600">{error}</div>}
            {(Array.isArray(list) ? list : []).map((u) => renderUser(u as any))}
          </div>
        ) : (
          <div className="space-y-1">
            {(Array.isArray(recent) ? recent : []).map((u) => renderUser(u as any))}
          </div>
        )}
      </div>
    </div>
  );
}
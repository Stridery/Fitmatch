import { useEffect, useMemo, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { searchUsers, type PublicUserDTO } from "@/api/user";
import { useChatDockStore } from "./store";
import { supabase } from "@/lib/supabase";

export default function HeaderPanel() {
  const startDM = useChatDockStore((s) => s.startDM);
  const recent = useChatDockStore((s) => s.recentContacts);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [list, setList] = useState<PublicUserDTO[]>([]);
  const timer = useRef<number | null>(null);

  // 计算未读总数
  const totalUnread = useMemo(() => {
    try {
      return (Array.isArray(recent) ? recent : []).reduce((sum, c: any) => sum + (Number(c?.unread) || 0), 0);
    } catch {
      return 0;
    }
  }, [recent]);

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

  const getAvatar = (u: { id: string; avatarUrl?: unknown }) => {
    const url = typeof u.avatarUrl === "string" && u.avatarUrl.length > 0
      ? u.avatarUrl
      : supabase.storage.from("avatars").getPublicUrl(String(u.id)).data.publicUrl;
    return url || undefined;
  };

  const renderRecentCard = (u: { id: string; nickname?: unknown; avatarUrl?: unknown; lastMessage?: unknown; lastMessageAt?: unknown; unread?: unknown }) => {
    const avatar = getAvatar(u);
    const nickname = typeof u.nickname === "string" && u.nickname.length > 0 ? u.nickname : u.id;
    const preview = typeof u.lastMessage === "string" ? u.lastMessage : "";
    const unread = Number(u.unread) || 0;
    return (
      <div
        key={String(u.id)}
        className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
        onClick={async () => {
          try {
            await startDM(String(u.id), { nickname: typeof u.nickname === "string" ? u.nickname : undefined, avatarUrl: avatar });
          } finally {
            setQ("");
            setList([]);
          }
        }}
      >
        {avatar ? (
          <img src={avatar} className="w-9 h-9 rounded-full object-cover" />
        ) : (
          <div className="w-9 h-9 rounded-full bg-gray-200" />
        )}
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium truncate">{nickname as any}</div>
          <div className="text-xs text-gray-500 truncate">{preview}</div>
        </div>
        {unread > 0 && (
          <div className="text-[11px] bg-red-600 text-white px-2 py-0.5 rounded-full whitespace-nowrap">
            {unread}
          </div>
        )}
      </div>
    );
  };

  const renderUser = (u: { id: string; nickname?: unknown; avatarUrl?: unknown }) => {
    return (
      <div
        key={u.id}
        className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
        onClick={async () => {
          try {
            await startDM(u.id, {
              nickname: typeof u.nickname === "string" ? u.nickname : undefined,
              avatarUrl: typeof u.avatarUrl === "string" ? u.avatarUrl : undefined,
            });
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
    <div className="w-[360px] bg-white border rounded-lg shadow overflow-hidden">
      <div className="px-3 py-2 border-b bg-gray-50 flex items-center gap-2">
        <Input placeholder="Search users" value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="text-xs text-gray-600 whitespace-nowrap">Unread: {totalUnread}</div>
      </div>
      <div className="max-h-[420px] overflow-y-auto p-2">
        {q.trim().length >= 2 ? (
          <div className="space-y-1">
            {loading && <div className="text-xs text-gray-500">Searching...</div>}
            {error && <div className="text-xs text-red-600">{error}</div>}
            {list.length > 0 ? (
              list.map((u) => renderUser(u as any))
            ) : (
              !loading && !error && (
                <div className="text-xs text-gray-500 px-1">No users found</div>
              )
            )}
          </div>
        ) : (
          <div className="space-y-1">
            {(Array.isArray(recent) && recent.length > 0) ? (
              [...recent]
                .sort((a: any, b: any) => {
                  const ta = a?.lastMessageAt ? Date.parse(String(a.lastMessageAt)) : 0;
                  const tb = b?.lastMessageAt ? Date.parse(String(b.lastMessageAt)) : 0;
                  return tb - ta;
                })
                .map((u: any) => renderRecentCard(u))
            ) : (
              <div className="text-xs text-gray-500 px-1">No recent contacts yet</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
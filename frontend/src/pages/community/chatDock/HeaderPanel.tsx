import { useEffect, useMemo, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { searchUsers, type PublicUserDTO } from "@/api/user";
import { useChatDockStore } from "./store";
import { getAvatarPublicUrl } from "@/lib/avatar";

export default function HeaderPanel() {
  const startDM = useChatDockStore((s) => s.startDM);
  const recent = useChatDockStore((s) => s.recentContacts);
  const addRecentContact = useChatDockStore((s) => s.addRecentContact);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [list, setList] = useState<PublicUserDTO[]>([]);
  const timer = useRef<number | null>(null);
  const hydratedRef = useRef<Record<string, boolean>>({});

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

  // 补齐最近联系人中的 nickname / avatar（按需、去重）
  useEffect(() => {
    (async () => {
      for (const u of recent ?? []) {
        const userId = u?.id;
        if (!userId || hydratedRef.current[userId]) continue;
        const hasNickname = typeof u?.nickname === "string" && u.nickname.length > 0;
        const hasAvatar = typeof u?.avatarUrl === "string" && u.avatarUrl.length > 0;
        if (hasNickname && hasAvatar) {
          hydratedRef.current[userId] = true;
          continue;
        }
        try {
          hydratedRef.current[userId] = true;
          const users = await searchUsers(userId);
          const found = Array.isArray(users) && users.length > 0 ? users[0] : undefined;
          const fallbackAvatar = getAvatarPublicUrl(userId);
          if (found || fallbackAvatar) {
            addRecentContact({
              id: userId,
              nickname: (found && typeof found.nickname === "string") ? found.nickname : u.nickname,
              avatarUrl:
                (found && typeof found.avatarUrl === "string" && found.avatarUrl.length > 0)
                  ? found.avatarUrl
                  : (u.avatarUrl ?? fallbackAvatar),
            });
          }
        } catch {
          // ignore
        }
      }
    })();
  }, [recent, addRecentContact]);

  const totalUnread = useMemo(() => {
    let sum = 0;
    for (const u of recent ?? []) {
      const n = Number((u as any).unreadCountFromUser ?? 0);
      if (Number.isFinite(n)) sum += n;
    }
    return sum;
  }, [recent]);

  const sortedRecent = useMemo(() => {
    const arr = Array.isArray(recent) ? [...recent] : [];
    return arr.sort((a, b) => {
      const ta = a.lastMessageAt ? Date.parse(a.lastMessageAt) : 0;
      const tb = b.lastMessageAt ? Date.parse(b.lastMessageAt) : 0;
      return tb - ta;
    });
  }, [recent]);

  const renderResultItem = (u: { id: string; nickname?: unknown; avatarUrl?: unknown }) => {
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
      <div className="h-12 px-3 border-b bg-gray-50 flex items-center gap-2">
        <Input placeholder="Search by nickname" value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="ml-auto text-xs text-gray-600 whitespace-nowrap">Unread: {totalUnread}</div>
      </div>

      <div className="max-h-[420px] overflow-y-auto p-2">
        {q.trim().length >= 2 && (
          <div className="mb-3">
            <div className="text-[11px] uppercase tracking-wide text-gray-500 px-1 mb-1">Results</div>
            <div className="space-y-1">
              {loading && <div className="text-xs text-gray-500">Searching...</div>}
              {error && <div className="text-xs text-red-600">{error}</div>}
              {(Array.isArray(list) ? list : []).map((u) => renderResultItem(u as any))}
              {!loading && !error && list.length === 0 && (
                <div className="text-xs text-gray-500 px-1 py-1">No users found</div>
              )}
            </div>
          </div>
        )}

        <div>
          <div className="text-[11px] uppercase tracking-wide text-gray-500 px-1 mb-1">Recent</div>
          {sortedRecent.length === 0 ? (
            <div className="px-2 py-6 text-sm text-gray-500 text-center">No recent contacts yet</div>
          ) : (
            <div className="space-y-1">
              {sortedRecent.map((u) => {
                const avatarUrl = typeof u.avatarUrl === "string" && u.avatarUrl.length > 0
                  ? u.avatarUrl
                  : (getAvatarPublicUrl(u.id) ?? undefined);
                return (
                  <div
                    key={u.id}
                    className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
                    onClick={() => startDM(u.id, { nickname: u.nickname, avatarUrl })}
                  >
                    {avatarUrl ? (
                      <img src={avatarUrl} className="w-9 h-9 rounded-full object-cover" />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-gray-200" />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium truncate">{u.nickname ?? u.id}</div>
                      <div className="text-xs text-gray-500 truncate">{u.lastMessage ?? ""}</div>
                    </div>
                    {Number(u.unreadCountFromUser ?? 0) > 0 && (
                      <div className="text-[10px] bg-red-600 text-white px-2 py-0.5 rounded-full">
                        {u.unreadCountFromUser}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
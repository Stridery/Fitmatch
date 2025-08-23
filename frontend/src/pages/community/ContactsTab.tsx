import { useEffect, useMemo, useState } from "react";
import { useCommunityStore } from "./store";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function ContactsTab() {
  const contacts = useCommunityStore((s) => s.contacts);
  const fetchContacts = useCommunityStore((s) => s.fetchContacts);
  const startConversationWithUser = useCommunityStore((s) => s.startConversationWithUser);
  const loadingContacts = useCommunityStore((s) => s.loading.contacts);
  const errors = useCommunityStore((s) => s.errors);

  const [query, setQuery] = useState("");

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const sorted = [...contacts].sort((a, b) => a.nickname.localeCompare(b.nickname));
    if (!q) return sorted;
    return sorted.filter((c) =>
      c.nickname.toLowerCase().includes(q) || c.email.toLowerCase().includes(q)
    );
  }, [contacts, query]);

  return (
    <div className="border rounded-md overflow-hidden">
      <div className="p-3 flex items-center gap-3 border-b bg-white">
        <Input
          placeholder="Search contacts..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="max-w-md"
        />
      </div>
      {loadingContacts && (
        <div className="p-3 text-sm text-gray-500">Loading contacts...</div>
      )}
      {errors.contacts && (
        <div className="p-3 text-sm text-red-600">{errors.contacts}</div>
      )}
      <ul className="divide-y">
        {filtered.map((u) => (
          <li key={u.id} className="p-3 hover:bg-gray-50">
            <Button
              className="flex items-center gap-3 w-full text-left"
              onClick={() => startConversationWithUser(u)}
            >
              <img
                src={u.avatarUrl}
                alt={u.nickname}
                className="w-10 h-10 rounded-full object-cover"
              />
              <div className="min-w-0">
                <div className="font-medium truncate">{u.nickname}</div>
                <div className="text-sm text-gray-600 truncate">{u.email}</div>
              </div>
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}


import { createContext, useContext, useEffect, useState } from "react";
import { getUserProfile } from "@/api/user";
import { supabase } from "@/lib/supabase";
import type { User, UserProfile } from "@/entities/user";

interface UserContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  loading: boolean;
}

const UserContext = createContext<UserContextType>({
  user: null,
  setUser: () => {},
  loading: true,
});

export const useUser = () => useContext(UserContext);

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;     // 卸载保护
    let runId = 0;        // 防竞态：只接受最后一次 load 的结果

    const apply = (u: User | null) => { if (alive) setUser(u); };

    const loadUser = async (hintSession?: any) => {
      const my = ++runId;
      try {
        if (alive) setLoading(true);
        // 优先用事件里传来的 session，减少一次 I/O
        const session =
          hintSession ?? (await supabase.auth.getSession()).data.session;

        if (!session) {
          apply(null);
          return;
        }

        const supaUser = session.user;

        // profile 拉取失败不阻塞 UI
        let profile: UserProfile | null = null;
        try {
          profile = await getUserProfile(session.access_token);
        } catch {
          profile = null;
        }


        // 过期结果丢弃
        if (!alive || my !== runId) return;

        apply({
          id: supaUser.id,
          email: supaUser.email ?? "",
          profile,
        });
      } catch {
        if (!alive || my !== runId) return;
        apply(null);
      } finally {
        if (alive && my === runId) setLoading(false); // 无论如何都落地
      }
    };

    // 首帧同步
    loadUser();

    // 订阅：不要 await，避免把 UI 卡在 Loading
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        apply(null);
        setLoading(false);
        return;
      }
      loadUser(session); // 不 await
    });

    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return (
    <UserContext.Provider value={{ user, setUser, loading }}>
      {children}
    </UserContext.Provider>
  );
};
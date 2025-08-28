import { createContext, useContext, useEffect, useState } from "react";
import { getUserProfile } from "@/api/user";
import { supabase } from "@/lib/supabase";
import type { User, UserProfile } from "@/entities/user";

interface UserContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  loading: boolean;
  token: string | null;
}

const UserContext = createContext<UserContextType>({
  user: null,
  setUser: () => {},
  loading: true,
  token: null, 
});

export const useUser = () => useContext(UserContext);

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(
    () => localStorage.getItem("token") // 刷新后可恢复
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    let runId = 0;
    const apply = (u: User | null, t: string | null) => {
      if (!alive) return;
      setUser(u);
      setToken(t);
      if (t) localStorage.setItem("token", t);
      else localStorage.removeItem("token");
    };

    const loadUser = async (hintSession?: any) => {
      const my = ++runId;
      try {
        if (alive) setLoading(true);
        const session =
          hintSession ?? (await supabase.auth.getSession()).data.session;

        if (!session) {
          apply(null, null);
          return;
        }

        const supaUser = session.user;
        const accessToken = session.access_token;   // ⭐ token 在这里

        let profile: UserProfile | null = null;
        try {
          // 这里可以改为不传 token，如果你用了 axios 拦截器（第2步）
          profile = await getUserProfile();
        } catch { profile = null; }

        if (!alive || my !== runId) return;

        apply(
          { id: supaUser.id, email: supaUser.email ?? "", profile },
          accessToken
        );
      } catch {
        if (!alive || my !== runId) return;
        apply(null, null);
      } finally {
        if (alive && my === runId) setLoading(false);
      }
    };

    loadUser();

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        apply(null, null);
        setLoading(false);
        return;
      }
      loadUser(session);
    });

    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return (
    <UserContext.Provider value={{ user, setUser, loading, token }}>
      {children}
    </UserContext.Provider>
  );
};
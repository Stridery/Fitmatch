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
    const loadUser = async () => {
      setLoading(true);

      const { data: { session }, error } = await supabase.auth.getSession();

      if (!session || error) {
        setUser(null);
        setLoading(false);
        return;
      }

      const supabaseUser = session.user;
      const accessToken = session.access_token;

      let profile: UserProfile | null = null;
      try {
        profile = await getUserProfile(accessToken);
      } catch {
        profile = null; // 没填 profile 也没关系
      }

      setUser({
        id: supabaseUser.id,
        email: supabaseUser.email ?? "",
        profile,
      });

      setLoading(false);
    };

    // 初次加载
    loadUser();

    // 订阅 Auth 状态变化，保持全局 user 同步
    const { data: listener } = supabase.auth.onAuthStateChange(async () => {
      await loadUser();
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  return (
    <UserContext.Provider value={{ user, setUser, loading }}>
      {children}
    </UserContext.Provider>
  );
};
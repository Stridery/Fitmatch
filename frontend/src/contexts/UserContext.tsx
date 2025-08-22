import { createContext, useContext, useEffect, useState } from "react";
import { getUserProfile } from "@/api/user";
import { supabase } from "@/lib/supabase";
import type { User, UserProfile } from "@/entities/user";

interface UserContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  loading: boolean;
  logout: () => Promise<void>;
}

const UserContext = createContext<UserContextType>({
  user: null,
  setUser: () => {},
  loading: true,
  logout: async () => {},
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

    loadUser();

    const { data } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session) {
        setUser(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      const supabaseUser = session.user;
      const accessToken = session.access_token;
      let profile: UserProfile | null = null;
      try {
        profile = await getUserProfile(accessToken);
      } catch {
        profile = null;
      }
      setUser({
        id: supabaseUser.id,
        email: supabaseUser.email ?? "",
        profile,
      });
      setLoading(false);
    });

    return () => {
      data.subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <UserContext.Provider value={{ user, setUser, loading, logout: handleLogout }}>
      {children}
    </UserContext.Provider>
  );
};
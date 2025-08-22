import { supabase } from "@/lib/supabase";

/**
 * 获取当前登录用户（Supabase auth.users）
 * 如果未登录，返回 null
 */
export async function getSupabaseUser() {
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    console.error("Failed to get Supabase user:", error);
    return null;
  }

  if (!data?.user) {
    return null;
  }

  return {
    id: data.user.id,
    email: data.user.email!,
  };
}

/**
 * 退出登录
 */
export async function logout() {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error("Failed to sign out:", error);
    throw error;
  }
}
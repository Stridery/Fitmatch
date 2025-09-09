// Simple helper to generate a public avatar URL from Supabase storage
// Assumes a public bucket named "avatars" and each file named by userId
import { supabase } from "./supabase";

export function getAvatarPublicUrl(userId: string | undefined | null): string | undefined {
  if (!userId) return undefined;
  try {
    const { data } = supabase.storage.from("avatars").getPublicUrl(String(userId));
    const url = data?.publicUrl;
    return typeof url === "string" && url.length > 0 ? url : undefined;
  } catch {
    return undefined;
  }
}


import api from "./client";
import axios from "axios";
import type { UserProfile, Injury } from "@/entities/user";

const BASE = "/users"; // 因为 api.baseURL 已经配置过了

export interface PublicUserDTO {
  id: string;
  nickname?: string;
  avatarUrl?: string;
}

export const setUserProfile = (profile: Partial<UserProfile>) => {
  return api.post(`${BASE}/me`, profile);
};

export async function getUserProfile() {
  try {
    const res = await api.get<UserProfile>(`${BASE}/me`);
    return res.data;
  } catch (err: unknown) {
    if (axios.isAxiosError(err) && err.response?.status === 409) {
      // 后端说「profile 不存在」
      return null;
    }
    throw err;
  }
}

export async function saveInjuriesBatch(batch: {
  created: Injury[];
  updated: Injury[];
  deletedIds: string[];
}) {
  const res = await api.post(`${BASE}/injuries/batch`, batch);
  return res.data;
}

export async function getUserInjuries() {
  const res = await api.get<Injury[]>(`${BASE}/injuries`);
  return res.data;
}

export async function searchUsers(q: string): Promise<PublicUserDTO[]> {
  if (!q?.trim()) return [];
  const res = await api.get<{ users: PublicUserDTO[] }>(`${BASE}/search`, {
    params: { q },
  });
  return res.data.users;
}
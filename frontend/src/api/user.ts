import axios from 'axios';
import type { UserProfile } from '@/entities/user';
import type { Injury } from '@/entities/user'

const BASE_URL = `${import.meta.env.VITE_API_BASE}/users`;  // 你的 user-service 地址

export const setUserProfile = (profile: Partial<UserProfile>, token: string) => {
  return axios.post(`${BASE_URL}/me`, profile, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export async function getUserProfile(token: string) {
  try {
    const res = await axios.get<UserProfile>(`${BASE_URL}/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return res.data;
  } catch (err) {
    if (axios.isAxiosError(err) && err.response?.status === 409) {
      // 后端说「找不到 profile」
      return null;
    }
    // 其他错误仍然抛出
    throw err;
  }
}

export async function saveInjuriesBatch(batch: {
  created: Injury[];
  updated: Injury[];
  deletedIds: string[];
}, token: string) {
  const res = await axios.post(
    `${BASE_URL}/injuries/batch`,
    batch,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return res.data;
}

export async function getUserInjuries(token: string) {
  const res = await axios.get<Injury[]>(`${BASE_URL}/injuries`, {
      headers: {
        Authorization: `Bearer ${token}`,
      }
  },)
  return res.data
}
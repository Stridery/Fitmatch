import axios from "axios";

export interface PublicUserDTO {
  _id: string;
  username: string;
  nickname?: string;
  avatarUrl?: string;
}

const BASE_URL = `${import.meta.env.VITE_API_BASE}/users`;

export async function searchUsers(q: string) {
  const res = await axios.get<{ users: PublicUserDTO[] }>(`${BASE_URL}/search`, {
    params: { q },
  });
  return res.data.users;
}

export async function getUserByUsername(username: string) {
  const res = await axios.get<{ user: PublicUserDTO }>(
    `${BASE_URL}/by-username/${encodeURIComponent(username)}`
  );
  return res.data.user;
}


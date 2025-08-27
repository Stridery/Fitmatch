import axios from "axios";

export interface PublicUserDTO {
  id: string;
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

// Optional: by-username not implemented on backend; reserved for future use


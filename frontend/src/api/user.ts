import axios from 'axios'

const BASE_URL = 'http://localhost:8080/user'  // 替换为你的 Auth Service 实际地址

export const setUserProfile = (profile: any, token: string) => {
  return axios.post(`${BASE_URL}/set-profile`, profile, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};
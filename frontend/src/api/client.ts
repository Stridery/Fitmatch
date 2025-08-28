// src/api/client.ts
import axios from "axios";
import { supabase } from "@/lib/supabase";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE, // no trailing slash
});

// You can return a Promise from an axios request interceptor
api.interceptors.request.use(async (config) => {
  const { data } = await supabase.auth.getSession(); // cached by supabase-js
  const accessToken = data.session?.access_token;
  if (accessToken) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

export default api;
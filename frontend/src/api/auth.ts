<<<<<<< HEAD
const API_BASE = "http://localhost:8080/auth"; // 改成你的实际后端地址

export async function sendRegisterCode(email: string) {
  const res = await fetch(`${API_BASE}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  return res.json();
}

export async function confirmRegister(email: string, code: string) {
  const res = await fetch(`${API_BASE}/confirm-register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, code }),
  });
  return res.json(); // 里面有 token
}

export async function login(email: string, password: string) {
  const res = await fetch(`${API_BASE}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return res.json(); // 里面有 token
}

export async function sendResetCode(email: string) {
  const res = await fetch(`${API_BASE}/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  return res.json();
}

export async function resetPassword(email: string, newPassword: string, code: string) {
  const res = await fetch(`${API_BASE}/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, newPassword, code }),
  });
  return res.json();
}
=======
import axios from 'axios'

const BASE_URL = 'http://localhost:8080/fitmatch/auth'  // 替换为你的 Auth Service 实际地址

export const register = (email: string, password: string, nickname: string, role: string) =>
  axios.post(`${BASE_URL}/register`, { email, password, nickname, role})

export const login = (email: string, password: string) =>
  axios.post(`${BASE_URL}/login`, { email, password })

export const confirmRegister = (email: string, code: string) =>
  axios.post(`${BASE_URL}/verify`, { email, code })

export const forgotPassword = (email: string) =>
  axios.post(`${BASE_URL}/forgot-password`, { email })

export const resetPassword = (email: string, code: string, newPassword: string) =>
  axios.post(`${BASE_URL}/reset-password`, { email, code, newPassword })
>>>>>>> cc59d295ca9eb6aafe04b3d70dbab4282dfbd8ba

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
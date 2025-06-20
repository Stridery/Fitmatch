
import axios from 'axios'

const BASE_URL = 'http://localhost:8080/auth'  // 替换为你的 Auth Service 实际地址

export const register = (email: string, password: string, nickname: string) => {
  return axios.post(`${BASE_URL}/register`, { email, password, nickname})
}


export const login = (email: string, password: string) => {
  return axios.post(`${BASE_URL}/login`, { email, password })
}


export const confirmRegister = (email: string, code: string) => {
  return axios.post(`${BASE_URL}/confirm-register`, { email, code })
}


export const forgotPassword = (email: string) => {
  return axios.post(`${BASE_URL}/forgot-password`, { email })
}


export const resetPassword = (email: string, code: string, newpassword: string) => {
  return axios.post(`${BASE_URL}/reset-password`, { email, code, newpassword })
}


import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import dns from 'dns'

dns.setDefaultResultOrder?.('ipv4first') // 避免 localhost → ::1

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  server: {
    host: true,
    port: 5173,
    proxy: {
      // API 请求转发到本地网关 8080
      '/api': {
        target: 'http://127.0.0.1:8080',
        changeOrigin: true,
        secure: false,
        // Nginx 会去掉 /api，这里保持一致
        rewrite: (p) => p.replace(/^\/api/, ''),
      },
      // WebSocket 转发到本地 chat-service 4000
      '/socket.io': {
        target: 'http://127.0.0.1:4000',
        ws: true,
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
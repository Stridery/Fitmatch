/// <reference types="vite/client" />

declare module '*.css';

// 在这里扩展 ImportMetaEnv
interface ImportMetaEnv {
  readonly VITE_SOCKET_URL?: string; // 你的自定义环境变量
  // 以后还有别的 VITE_ 开头变量，也可以写在这里
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
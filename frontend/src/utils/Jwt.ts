// src/utils/Jwt.ts

/**
 * 安全解析 JWT 的 payload 部分
 * @param token JWT 字符串
 * @returns 解析出的 payload 对象 或 null（格式错误）
 */
export function parseJwt(token: string): any | null {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;

    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = atob(base64);
    const jsonPayload = decodeURIComponent(
      decoded
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );

    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error('Failed to parse JWT:', e);
    return null;
  }
}

/**
 * 判断 JWT 是否已过期
 * @param token JWT 字符串
 * @returns 是否已过期
 */
export function isTokenExpired(token: string): boolean {
  const payload = parseJwt(token);
  if (!payload || !payload.exp) return true;

  const expiryTimeMs = payload.exp; 
  return Date.now() > expiryTimeMs;
}
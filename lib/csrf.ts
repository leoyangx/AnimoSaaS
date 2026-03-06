import crypto from 'crypto';
import { cookies } from 'next/headers';

const CSRF_TOKEN_LENGTH = 32;
const CSRF_COOKIE_NAME = 'csrf_token';
const CSRF_HEADER_NAME = 'x-csrf-token';

/**
 * 生成 CSRF token
 */
export async function generateCsrfToken(): Promise<string> {
  return crypto.randomBytes(CSRF_TOKEN_LENGTH).toString('hex');
}

/**
 * 设置 CSRF token 到 cookie
 */
export async function setCsrfToken(): Promise<string> {
  const token = await generateCsrfToken();
  const cookieStore = await cookies();

  cookieStore.set(CSRF_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production' && process.env.DISABLE_SECURE_COOKIE !== 'true',
    sameSite: 'strict',
    maxAge: 60 * 60, // 1 hour
    path: '/',
  });

  return token;
}

/**
 * 获取 CSRF token
 */
export async function getCsrfToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(CSRF_COOKIE_NAME)?.value;
}

/**
 * 验证 CSRF token
 */
export async function verifyCsrfToken(token: string): Promise<boolean> {
  const storedToken = await getCsrfToken();

  if (!storedToken || !token) {
    return false;
  }

  // 使用时间安全的比较防止时序攻击
  try {
    return crypto.timingSafeEqual(Buffer.from(storedToken), Buffer.from(token));
  } catch {
    return false;
  }
}

/**
 * 从请求中提取 CSRF token
 */
export function extractCsrfToken(request: Request): string | null {
  // 优先从 header 获取
  const headerToken = request.headers.get(CSRF_HEADER_NAME);
  if (headerToken) {
    return headerToken;
  }

  // 其次从 body 获取（用于表单提交）
  // 注意：这需要在调用此函数前先读取 body
  return null;
}

/**
 * CSRF 中间件辅助函数
 */
export async function validateCsrfForRequest(request: Request): Promise<boolean> {
  // 只验证状态变更方法
  const method = request.method.toUpperCase();
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    return true;
  }

  const token = extractCsrfToken(request);
  if (!token) {
    return false;
  }

  return await verifyCsrfToken(token);
}

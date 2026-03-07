import crypto from 'crypto';

const CSRF_TOKEN_LENGTH = 32;
const CSRF_COOKIE_NAME = 'csrf_token';
const CSRF_HEADER_NAME = 'x-csrf-token';

/**
 * 生成 CSRF token
 */
export function generateCsrfToken(): string {
  return crypto.randomBytes(CSRF_TOKEN_LENGTH).toString('hex');
}

/**
 * Double Submit Cookie 验证
 * 比较 cookie 中的 token 与 header 中的 token 是否一致
 */
export function validateCsrfDouble(
  cookieToken: string | undefined,
  headerToken: string | null
): boolean {
  if (!cookieToken || !headerToken) {
    return false;
  }

  try {
    return crypto.timingSafeEqual(Buffer.from(cookieToken), Buffer.from(headerToken));
  } catch {
    return false;
  }
}

/**
 * 从请求中验证 CSRF（用于中间件）
 * 使用 Double Submit Cookie 模式：
 * - cookie csrf_token（httpOnly）由服务端设置
 * - header x-csrf-token 由前端 JS 从 meta tag 或 API 获取后发送
 */
export function validateCsrfFromRequest(
  request: Request & { cookies?: { get(name: string): { value: string } | undefined } }
): boolean {
  const method = request.method.toUpperCase();

  // GET/HEAD/OPTIONS 不需要 CSRF 验证
  if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    return true;
  }

  const cookieToken = request.cookies?.get(CSRF_COOKIE_NAME)?.value;
  const headerToken = request.headers.get(CSRF_HEADER_NAME);

  return validateCsrfDouble(cookieToken, headerToken);
}

export { CSRF_COOKIE_NAME, CSRF_HEADER_NAME };

import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

/**
 * 延迟初始化 JWT_SECRET，避免模块加载（构建阶段）时因缺少环境变量而崩溃。
 * 首次调用时读取并缓存，运行时如果缺少则 throw。
 */
let _jwtSecret: string | null = null;

function getJwtSecret(): string {
  if (!_jwtSecret) {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error(
        'JWT_SECRET environment variable is required. Please set it in your .env file.'
      );
    }
    _jwtSecret = secret;
  }
  return _jwtSecret;
}

/**
 * JWT Token 负载类型
 */
export interface TokenPayload {
  id: string;
  email: string;
  role: string;
  tenantId?: string;
}

export async function createToken(payload: TokenPayload) {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: '7d' });
}

export async function createSuperAdminToken(payload: { id: string; email: string }) {
  return jwt.sign({ ...payload, role: 'superadmin' }, getJwtSecret(), { expiresIn: '24h' });
}

export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    // 检查是否在 Edge Runtime 运行
    const isEdge = process.env.NEXT_RUNTIME === 'edge';

    if (isEdge) {
      // Edge Runtime 下无法使用 jsonwebtoken 的 verify (含有 Node 原生依赖)
      // 使用 decodeToken 降级处理，用于基础的角色路由逻辑
      return decodeToken(token);
    }

    return jwt.verify(token, getJwtSecret()) as TokenPayload;
  } catch (e) {
    return null;
  }
}

/**
 * 手动解码 JWT Token（不验证签名）
 * 仅用于中间件环境下的基础校验
 *
 * 警告：此函数不验证签名，仅用于 Edge Runtime 中的角色路由判断。
 * 实际的权限验证必须在 route handler 中使用完整的 verifyToken 完成。
 */
export function decodeToken(token: string): TokenPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    // Base64Url 解码 Payload 部分（使用 Web API atob，兼容 Edge Runtime）
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const payload = JSON.parse(jsonPayload);

    // 检查过期时间（基础校验）
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export async function getSession(
  type: 'user' | 'admin' | 'superadmin' = 'user'
): Promise<TokenPayload | null> {
  const cookieStore = await cookies();

  if (type === 'superadmin') {
    const token = cookieStore.get('superadmin_token')?.value;
    if (!token) return null;
    const session = await verifyToken(token);
    if (!session || session.role !== 'superadmin') return null;
    return session;
  }

  const cookieName = type === 'admin' ? 'admin_token' : 'auth_token';
  const token = cookieStore.get(cookieName)?.value;
  if (!token) return null;
  return verifyToken(token);
}

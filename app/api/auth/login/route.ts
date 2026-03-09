import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createToken } from '@/lib/auth';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { loginSchema } from '@/lib/validators';
import { errorResponse, successResponse, validationErrorResponse } from '@/lib/api-response';
import { getTenantIdFromRequestSafe } from '@/lib/tenant-context';
import { getTenantBySlug } from '@/lib/tenant';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    // 速率限制检查
    const ip = getClientIp(req);
    const rateLimitError = checkRateLimit(ip, 'auth');
    if (rateLimitError) return rateLimitError;

    // 获取租户 ID
    let tenantId = getTenantIdFromRequestSafe(req);
    if (!tenantId) {
      // 回退到默认租户
      const defaultTenant = await getTenantBySlug('default');
      if (!defaultTenant) {
        return errorResponse('系统未初始化', 503);
      }
      tenantId = defaultTenant.id;
    }

    // 解析请求体
    const body = await req.json();

    // Zod 验证
    const validationResult = loginSchema.safeParse(body);
    if (!validationResult.success) {
      return validationErrorResponse(validationResult.error);
    }

    const { email, password } = validationResult.data;

    // 先尝试在当前租户中查找用户
    let user = await db.users.getByEmail(email, tenantId);

    // 如果当前租户找不到，且不是默认租户，尝试跨租户查找（仅限 ADMIN 角色）
    if (!user && tenantId) {
      user = await db.users.getByEmailAcrossTenants(email, 'ADMIN');
      // 如果找到了，更新 tenantId 为用户实际所属的租户
      if (user) {
        tenantId = user.tenantId;
      }
    }

    // 验证密码（使用统一错误消息防止用户枚举）
    const isPasswordValid = user ? await bcrypt.compare(password, user.password || '') : false;

    if (!user || !isPasswordValid) {
      return errorResponse('邮箱或密码错误', 401);
    }

    // 检查账号状态
    if (user.disabled) {
      return errorResponse('账号已被禁用，请联系管理员', 403);
    }

    // 生成 JWT token（包含用户实际所属的 tenantId）
    const token = await createToken({
      id: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
    });

    // 更新最后登录信息
    await db.users.updateLastLogin(user.id);

    // 设置 cookie
    const response = successResponse(
      {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
        },
      },
      '登录成功'
    );

    const cookieName = user.role === 'ADMIN' ? 'admin_token' : 'auth_token';

    response.cookies.set(cookieName, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production' && process.env.DISABLE_SECURE_COOKIE !== 'true',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return response;
  } catch (e) {
    console.error('Login error:', e);
    return errorResponse('登录失败，请稍后重试', 500, e);
  }
}

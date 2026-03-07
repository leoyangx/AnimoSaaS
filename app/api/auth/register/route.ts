import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createToken } from '@/lib/auth';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { registerSchema } from '@/lib/validators';
import { errorResponse, successResponse, validationErrorResponse } from '@/lib/api-response';
import { getTenantIdFromRequestSafe } from '@/lib/tenant-context';
import { getTenantBySlug } from '@/lib/tenant';
import { checkQuota, incrementQuota } from '@/lib/quota';
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
      const defaultTenant = await getTenantBySlug('default');
      if (!defaultTenant) {
        return errorResponse('系统未初始化', 503);
      }
      tenantId = defaultTenant.id;
    }

    // 解析请求体
    const body = await req.json();

    // Zod 验证（包含密码强度验证）
    const validationResult = registerSchema.safeParse(body);
    if (!validationResult.success) {
      return validationErrorResponse(validationResult.error);
    }

    const { email, password, invitationCode } = validationResult.data;

    // 配额检查
    const quotaCheck = await checkQuota(tenantId, 'users');
    if (!quotaCheck.allowed) {
      return errorResponse(quotaCheck.message || '用户数已达上限', 403);
    }

    // 验证邀请码
    const code = await db.codes.getByCode(invitationCode, tenantId);
    if (!code || code.status !== 'unused') {
      return errorResponse('邀请码无效或已被使用', 400);
    }

    // 检查邮箱是否已注册
    const existingUser = await db.users.getByEmail(email, tenantId);
    if (existingUser) {
      return errorResponse('该邮箱已被注册', 400);
    }

    // 使用更高的 salt rounds 哈希密码
    const hashedPassword = await bcrypt.hash(password, 12);

    // 创建用户
    const newUser = await db.users.create(tenantId, {
      email,
      password: hashedPassword,
      role: 'student',
    });

    if (!newUser) {
      return errorResponse('注册失败，请稍后重试', 500);
    }

    // 更新配额
    await incrementQuota(tenantId, 'users');

    // 标记邀请码为已使用
    await db.codes.use(invitationCode, tenantId, newUser.id);

    // 记录操作日志
    await db.logs.create('USER_REGISTER', email, tenantId, `新用户注册，使用邀请码: ${invitationCode}`);

    // 生成 JWT token（包含 tenantId）
    const token = await createToken({
      id: newUser.id,
      email: newUser.email,
      role: newUser.role,
      tenantId,
    });

    // 设置 cookie
    const response = successResponse(
      {
        user: {
          id: newUser.id,
          email: newUser.email,
          role: newUser.role,
        },
      },
      '注册成功'
    );

    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production' && process.env.DISABLE_SECURE_COOKIE !== 'true',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return response;
  } catch (e) {
    console.error('Register error:', e);
    return errorResponse('注册失败，请稍后重试', 500, e);
  }
}

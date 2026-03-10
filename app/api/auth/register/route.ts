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
import { verificationCodes } from '@/lib/verification-codes';

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

    const { email, password, invitationCode, verificationCode } = validationResult.data;

    // 配额检查
    const quotaCheck = await checkQuota(tenantId, 'users');
    if (!quotaCheck.allowed) {
      return errorResponse(quotaCheck.message || '用户数已达上限', 403);
    }

    // 获取系统配置
    const config = await db.config.get(tenantId);

    // 验证方式：邮箱验证码 或 邀请码
    if (config.emailVerificationEnabled) {
      // 邮箱验证码模式
      if (!verificationCode) {
        return errorResponse('请输入邮箱验证码', 400);
      }

      // 动态导入验证码存储
      const storedCode = verificationCodes.get(email);

      if (!storedCode) {
        return errorResponse('验证码不存在或已过期', 400);
      }

      if (storedCode.expires < Date.now()) {
        verificationCodes.delete(email);
        return errorResponse('验证码已过期', 400);
      }

      if (storedCode.code !== verificationCode) {
        return errorResponse('验证码错误', 400);
      }

      // 验证成功，删除验证码
      verificationCodes.delete(email);
    } else {
      // 邀请码模式
      if (!invitationCode) {
        return errorResponse('请输入邀请码', 400);
      }

      const code = await db.codes.getByCode(invitationCode, tenantId);
      if (!code || code.status !== 'unused') {
        return errorResponse('邀请码无效或已被使用', 400);
      }

      // 标记邀请码为已使用（稍后执行）
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
      role: 'STUDENT',
    });

    if (!newUser) {
      return errorResponse('注册失败，请稍后重试', 500);
    }

    // 更新配额
    await incrementQuota(tenantId, 'users');

    // 标记邀请码为已使用（仅在邀请码模式下）
    if (!config.emailVerificationEnabled && invitationCode) {
      await db.codes.use(invitationCode, tenantId, newUser.id);
    }

    // 记录操作日志
    await db.logs.create(
      'USER_REGISTER',
      email,
      tenantId,
      config.emailVerificationEnabled
        ? `新用户注册，使用邮箱验证`
        : `新用户注册，使用邀请码: ${invitationCode}`
    );

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

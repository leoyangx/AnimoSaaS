import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getTenantIdFromRequestSafe } from '@/lib/tenant-context';
import { getTenantBySlug } from '@/lib/tenant';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { errorResponse, successResponse } from '@/lib/api-response';

export async function GET(req: NextRequest) {
  console.log('GET /api/init hit');

  try {
    // 获取租户 ID
    let tenantId = getTenantIdFromRequestSafe(req);
    if (!tenantId) {
      const defaultTenant = await getTenantBySlug('default');
      if (!defaultTenant) {
        return errorResponse('系统未初始化，请先运行迁移脚本', 503);
      }
      tenantId = defaultTenant.id;
    }

    const adminEmail = 'admin@example.com';
    const existingAdmin = await db.users.getByEmail(adminEmail, tenantId);

    // If admin already exists, do nothing — no force reset allowed
    if (existingAdmin) {
      console.log('Admin already exists, skipping init');
      return successResponse({ exists: true }, '管理员账号已存在');
    }

    // First-time bootstrap only: create admin when no admin exists
    let password = process.env.ADMIN_PASSWORD;
    let isGeneratedPassword = false;

    // 如果未设置环境变量，生成强随机密码
    if (!password) {
      password = crypto.randomBytes(16).toString('hex');
      isGeneratedPassword = true;
      console.warn('⚠️  未设置 ADMIN_PASSWORD，已生成临时密码');
    }

    // 验证密码强度
    if (password.length < 12) {
      return errorResponse('管理员密码必须至少12位，请在 .env 中设置 ADMIN_PASSWORD', 400);
    }

    if (!/[A-Z]/.test(password)) {
      return errorResponse('管理员密码必须包含大写字母', 400);
    }

    if (!/[a-z]/.test(password)) {
      return errorResponse('管理员密码必须包含小写字母', 400);
    }

    if (!/[0-9]/.test(password)) {
      return errorResponse('管理员密码必须包含数字', 400);
    }

    // 使用更高的 salt rounds 增强安全性
    const hashedPassword = await bcrypt.hash(password, 12);

    console.log('Creating new admin user');
    await db.users.create(tenantId, {
      email: adminEmail,
      password: hashedPassword,
      role: 'ADMIN',
    });

    // 如果是自动生成的密码，返回给用户
    const response: any = {
      email: adminEmail,
      message: '管理员账号初始化成功',
    };

    if (isGeneratedPassword) {
      response.temporaryPassword = password;
      response.warning = '这是临时密码，请立即登录并修改密码！';
      console.log(`\n${'='.repeat(60)}`);
      console.log('🔐 管理员账号已创建');
      console.log(`📧 邮箱: ${adminEmail}`);
      console.log(`🔑 临时密码: ${password}`);
      console.log('⚠️  请立即登录并修改密码！');
      console.log(`${'='.repeat(60)}\n`);
    }

    return successResponse(response);
  } catch (e) {
    console.error('Init error:', e);
    return errorResponse('初始化失败', 500, e instanceof Error ? e.message : String(e));
  }
}

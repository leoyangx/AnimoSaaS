import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createSuperAdminToken } from '@/lib/auth';
import { errorResponse, successResponse } from '@/lib/api-response';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return errorResponse('请输入邮箱和密码', 400);
    }

    const superAdmin = await prisma.superAdmin.findUnique({
      where: { email },
    });

    if (!superAdmin) {
      return errorResponse('邮箱或密码错误', 401);
    }

    const isValid = await bcrypt.compare(password, superAdmin.password);
    if (!isValid) {
      return errorResponse('邮箱或密码错误', 401);
    }

    // 更新最后登录时间
    await prisma.superAdmin.update({
      where: { id: superAdmin.id },
      data: { lastLogin: new Date() },
    });

    // 生成 token
    const token = await createSuperAdminToken({
      id: superAdmin.id,
      email: superAdmin.email,
    });

    const response = successResponse(
      {
        user: {
          id: superAdmin.id,
          email: superAdmin.email,
          name: superAdmin.name,
          role: 'superadmin',
        },
      },
      '登录成功'
    );

    response.cookies.set('superadmin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production' && process.env.DISABLE_SECURE_COOKIE !== 'true',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
    });

    return response;
  } catch (e) {
    console.error('Super admin login error:', e);
    return errorResponse('登录失败', 500, e);
  }
}

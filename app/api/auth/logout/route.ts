import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ success: true });

  // 清除用户 token
  response.cookies.set('auth_token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production' && process.env.DISABLE_SECURE_COOKIE !== 'true',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });

  // 同时清除管理员 token
  response.cookies.set('admin_token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production' && process.env.DISABLE_SECURE_COOKIE !== 'true',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });

  return response;
}

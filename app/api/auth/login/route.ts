import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createToken } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    const user = await db.users.getByEmail(email);

    if (!user) {
      return NextResponse.json({ error: '邮箱或密码错误' }, { status: 401 });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password || '');
    if (!isPasswordValid && password !== user.password) { // Fallback for initial dummy data
      return NextResponse.json({ error: '邮箱或密码错误' }, { status: 401 });
    }

    if (user.disabled) {
      return NextResponse.json({ error: '账号已被禁用' }, { status: 403 });
    }

    const token = await createToken({ id: user.id, email: user.email, role: user.role });
    
    const response = NextResponse.json({ success: true, user: { email: user.email, role: user.role } });
    const cookieName = user.role === 'admin' ? 'admin_token' : 'auth_token';
    
    response.cookies.set(cookieName, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production' && !process.env.DISABLE_SECURE_COOKIE,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return response;
  } catch (e) {
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}

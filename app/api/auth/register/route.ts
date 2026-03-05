import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createToken } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const { email, password, invitationCode } = await req.json();

    // Validate invitation code
    const code = await db.codes.getByCode(invitationCode);
    if (!code || code.status !== 'unused') {
      return NextResponse.json({ error: '邀请码无效或已被使用' }, { status: 400 });
    }

    // Check if user exists
    if (await db.users.getByEmail(email)) {
      return NextResponse.json({ error: '该邮箱已被注册' }, { status: 400 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const newUser = await db.users.create({ email, password: hashedPassword, role: 'student' });
    
    if (!newUser) {
      return NextResponse.json({ error: '注册失败' }, { status: 500 });
    }

    // Mark code as used
    await db.codes.use(invitationCode, newUser.id);

    const token = await createToken({ id: newUser.id, email: newUser.email, role: newUser.role });
    
    const response = NextResponse.json({ success: true, user: { email: newUser.email, role: newUser.role } });
    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production' && !process.env.DISABLE_SECURE_COOKIE,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return response;
  } catch (e) {
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}

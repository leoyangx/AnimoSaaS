import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  const session = await getSession('admin');
  if (!session || (session as any).role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { email, password } = await req.json();
  
  const existingUser = await db.users.getByEmail(email);
  if (existingUser) {
    return NextResponse.json({ error: '用户已存在' }, { status: 400 });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await db.users.create({
    email,
    password: hashedPassword,
    role: 'student'
  });

  // Log action
  await db.logs.create('CREATE_USER', (session as any).email, `手动创建学员: ${email}`);

  return NextResponse.json({ success: true, user });
}

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function GET(req: NextRequest) {
  console.log('GET /api/init hit');
  const { searchParams } = new URL(req.url);
  const force = searchParams.get('force') === 'true';

  try {
    const adminEmail = 'admin@example.com';
    const existingAdmin = await db.users.getByEmail(adminEmail);

    if (existingAdmin && !force) {
      console.log('Admin already exists, skipping init');
      return NextResponse.json({ message: '管理员账号已存在', email: adminEmail });
    }

    const password = process.env.ADMIN_PASSWORD || 'admin123456';
    const hashedPassword = await bcrypt.hash(password, 10);

    if (existingAdmin && force) {
      console.log('Force init: updating existing admin password');
      await db.users.update(existingAdmin.id, { password: hashedPassword });
    } else {
      console.log('Creating new admin user');
      await db.users.create({
        email: adminEmail,
        password: hashedPassword,
        role: 'admin',
      });
    }

    return NextResponse.json({ 
      message: '管理员账号初始化成功', 
      email: adminEmail,
      password: '已设置为环境变量中的 ADMIN_PASSWORD 或 默认 admin123456'
    });
  } catch (e) {
    console.error('Init error:', e);
    return NextResponse.json({ error: '初始化失败', details: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}

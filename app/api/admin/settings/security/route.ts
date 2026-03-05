import { NextResponse } from 'next/server';
import { updateSecuritySettings } from '@/lib/settings-service';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Email validation if provided
    if (body.adminEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.adminEmail)) {
      return NextResponse.json({ error: '无效的管理员邮箱格式' }, { status: 400 });
    }

    const updated = await updateSecuritySettings({
      allowRegistration: body.allowRegistration,
      requireInvitation: body.requireInvitation,
      adminEmail: body.adminEmail,
    });
    
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Failed to update security settings:', error);
    return NextResponse.json({ error: '更新失败，请检查数据库连接' }, { status: 500 });
  }
}

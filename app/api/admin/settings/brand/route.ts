import { NextResponse } from 'next/server';
import { updateSystemSettings } from '@/lib/settings-service';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Validation
    if (!body.siteName || body.siteName.trim() === '') {
      return NextResponse.json({ error: '站点名称不能为空' }, { status: 400 });
    }

    const updated = await updateSystemSettings({
      siteName: body.siteName,
      logoUrl: body.logoUrl,
      footerText: body.footerText,
      primaryColor: body.primaryColor,
    });
    
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Failed to update brand settings:', error);
    return NextResponse.json({ error: '更新失败，请检查数据库连接' }, { status: 500 });
  }
}

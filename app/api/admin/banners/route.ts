import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession('admin');
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const banners = await db.banners.getAll(session.tenantId!);

    return NextResponse.json(banners);
  } catch (error) {
    console.error('Get banners error:', error);
    return NextResponse.json({ error: '获取失败' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession('admin');
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const body = await req.json();
    const { content, link, linkText, bgColor, textColor, enabled, scrollSpeed } = body;

    if (!content) {
      return NextResponse.json({ error: '公告内容不能为空' }, { status: 400 });
    }

    const banner = await db.banners.create(session.tenantId!, {
      content,
      link: link || null,
      linkText: linkText || null,
      bgColor: bgColor || '#00ff88',
      textColor: textColor || '#000000',
      enabled: enabled !== false,
      scrollSpeed: scrollSpeed || 50,
    });

    await db.logs.create('BANNER_CREATE', session.email, session.tenantId!, `创建横幅: ${content}`);

    return NextResponse.json(banner);
  } catch (error) {
    console.error('Create banner error:', error);
    return NextResponse.json({ error: '创建失败' }, { status: 500 });
  }
}

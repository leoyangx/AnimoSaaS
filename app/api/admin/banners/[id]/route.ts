import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession('admin');
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { content, link, linkText, bgColor, textColor, enabled, scrollSpeed } = body;

    const banner = await db.banners.update(id, session.tenantId!, {
      content,
      link: link || null,
      linkText: linkText || null,
      bgColor: bgColor || '#00ff88',
      textColor: textColor || '#000000',
      enabled: enabled !== false,
      scrollSpeed: scrollSpeed || 50,
    });

    await db.logs.create('BANNER_UPDATE', session.email, session.tenantId!, `更新横幅: ${content}`);

    return NextResponse.json(banner);
  } catch (error) {
    console.error('Update banner error:', error);
    return NextResponse.json({ error: '更新失败' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession('admin');
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const { id } = await params;

    await db.banners.delete(id, session.tenantId!);

    await db.logs.create('BANNER_DELETE', session.email, session.tenantId!, `删除横幅: ${id}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete banner error:', error);
    return NextResponse.json({ error: '删除失败' }, { status: 500 });
  }
}

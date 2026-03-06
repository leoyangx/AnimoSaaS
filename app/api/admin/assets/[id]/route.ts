import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession('admin');
  if (!session || (session as any).role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const data = await req.json();
  await db.assets.update(id, data);

  // Log action
  await db.logs.create(
    'UPDATE_ASSET',
    (session as any).email,
    `编辑素材 ID: ${id}, 标题: ${data.title}`
  );

  return NextResponse.json({ success: true });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession('admin');
  if (!session || (session as any).role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  await db.assets.delete(id);

  // Log action
  await db.logs.create('DELETE_ASSET', (session as any).email, `删除素材 ID: ${id}`);

  return NextResponse.json({ success: true });
}

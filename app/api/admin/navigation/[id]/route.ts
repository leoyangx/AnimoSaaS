import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { getTenantIdFromRequest } from '@/lib/tenant-context';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession('admin');
  if (!session || (session as any).role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const tenantId = getTenantIdFromRequest(req);
  const data = await req.json();
  const item = await db.navigation.update(id, data);
  await db.logs.create('UPDATE_NAV', (session as any).email, tenantId, `更新导航: ${data.name}`);
  return NextResponse.json(item);
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession('admin');
  if (!session || (session as any).role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const tenantId = getTenantIdFromRequest(req);
  await db.navigation.delete(id);
  await db.logs.create('DELETE_NAV', (session as any).email, tenantId, `删除导航 ID: ${id}`);
  return NextResponse.json({ success: true });
}

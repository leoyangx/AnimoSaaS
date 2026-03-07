import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { getTenantIdFromRequest } from '@/lib/tenant-context';

export async function GET(req: Request) {
  const session = await getSession('admin');
  if (!session || (session as any).role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const tenantId = getTenantIdFromRequest(req);
  return NextResponse.json(await db.categories.getAll(tenantId));
}

export async function POST(req: Request) {
  const session = await getSession('admin');
  if (!session || (session as any).role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const tenantId = getTenantIdFromRequest(req);
  const data = await req.json();
  const item = await db.categories.create(tenantId, data);
  await db.logs.create('CREATE_CATEGORY', (session as any).email, tenantId, `创建分类: ${data.name}`);
  return NextResponse.json(item);
}

import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { getTenantIdFromRequest } from '@/lib/tenant-context';

export async function POST(req: Request) {
  const session = await getSession('admin');
  if (!session || (session as any).role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const tenantId = getTenantIdFromRequest(req);
  const data = await req.json();
  await db.config.update(tenantId, data);

  // Log action
  await db.logs.create('UPDATE_SETTINGS', (session as any).email, tenantId, `更新系统配置`);

  return NextResponse.json({ success: true, config: await db.config.get(tenantId) });
}

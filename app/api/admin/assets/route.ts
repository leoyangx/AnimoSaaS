import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { getTenantIdFromRequest } from '@/lib/tenant-context';
import { checkQuota, incrementQuota } from '@/lib/quota';
import { generateId } from '@/lib/utils';

export async function POST(req: Request) {
  const session = await getSession('admin');
  if (!session || (session as any).role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const tenantId = getTenantIdFromRequest(req);

  // 配额检查
  const quotaCheck = await checkQuota(tenantId, 'assets');
  if (!quotaCheck.allowed) {
    return NextResponse.json({ error: quotaCheck.message }, { status: 403 });
  }

  const data = await req.json();
  const newAsset = await db.assets.create(tenantId, data);

  // 更新配额
  await incrementQuota(tenantId, 'assets');

  // Log action
  await db.logs.create('CREATE_ASSET', (session as any).email, tenantId, `创建素材: ${data.title}`);

  return NextResponse.json({ success: true, asset: newAsset });
}

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getTenantIdFromRequestSafe } from '@/lib/tenant-context';
import { getTenantBySlug } from '@/lib/tenant';

export async function GET(req: Request) {
  // 获取租户 ID
  let tenantId = getTenantIdFromRequestSafe(req);
  if (!tenantId) {
    const defaultTenant = await getTenantBySlug('default');
    if (defaultTenant) {
      tenantId = defaultTenant.id;
    }
  }

  if (!tenantId) {
    return NextResponse.json({
      siteName: 'AnimoSaaS',
      slogan: 'Private Domain Material Distribution System',
      logo: '',
      watermark: 'ANIMO',
    });
  }

  const config = await db.config.get(tenantId);
  return NextResponse.json({
    siteName: config.title || 'AnimoSaaS',
    slogan: config.slogan || 'Private Domain Material Distribution System',
    logo: config.logo || '',
    watermark: config.watermark || 'ANIMO',
  });
}

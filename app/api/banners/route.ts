import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getTenantIdSafe } from '@/lib/tenant-context';

export async function GET(req: NextRequest) {
  try {
    const tenantId = await getTenantIdSafe();
    if (!tenantId) {
      return NextResponse.json([]);
    }

    const banners = await db.banners.getActive(tenantId);

    // 不缓存：公告内容由管理员实时更新，前台每次请求都应获取最新数据
    return NextResponse.json(banners, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    console.error('Get public banners error:', error);
    return NextResponse.json([]);
  }
}


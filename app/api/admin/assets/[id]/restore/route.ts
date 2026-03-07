import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { db } from '@/lib/db';
import { getTenantIdFromRequest } from '@/lib/tenant-context';
import { errorResponse, successResponse } from '@/lib/api-response';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession('admin');
    if (!session || (session as any).role !== 'admin') {
      return errorResponse('未授权访问', 401);
    }

    const { id } = await params;
    const tenantId = getTenantIdFromRequest(req);

    // 恢复资产
    const asset = await prisma.asset.update({
      where: { id, tenantId, deletedAt: { not: null } },
      data: { deletedAt: null },
    });

    await db.logs.create('RESTORE_ASSET', (session as any).email, tenantId, `恢复资产: ${asset.title}`);

    return successResponse(asset, '资产恢复成功');
  } catch (error) {
    console.error('Restore asset error:', error);
    return errorResponse('恢复资产失败', 500, error);
  }
}

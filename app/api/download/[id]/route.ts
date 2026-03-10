import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { getTenantIdFromRequestSafe } from '@/lib/tenant-context';
import { getTenantBySlug } from '@/lib/tenant';
import { StorageEngine } from '@/lib/storage';
import { errorResponse } from '@/lib/api-response';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) {
    return errorResponse('请先登录', 401);
  }

  // 获取租户 ID
  let tenantId = getTenantIdFromRequestSafe(request);
  if (!tenantId) {
    const defaultTenant = await getTenantBySlug('default');
    tenantId = defaultTenant?.id || '';
  }

  const { id: assetId } = await params;
  const asset = await db.assets.getById(assetId, tenantId);

  if (!asset) {
    return errorResponse('素材不存在', 404);
  }

  const config = await db.config.get(tenantId);

  // Real Storage Engine Integration
  const storage = new StorageEngine(config);
  const { url: directLink, error: storageError } = await storage.resolveDownloadUrl(
    asset.downloadUrl,
    asset.storageProvider || 'AList'
  );

  if (!directLink || !directLink.startsWith('http')) {
    return errorResponse(`下载解析失败: ${storageError || '无法解析为有效的下载链接'}`, 400);
  }

  // Increment download count
  const userId = session ? session.id : undefined;
  await db.assets.incrementDownload(assetId, tenantId, userId);

  return NextResponse.redirect(directLink);
}

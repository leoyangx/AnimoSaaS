import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { getTenantIdFromRequestSafe } from '@/lib/tenant-context';
import { getTenantBySlug } from '@/lib/tenant';
import { StorageEngine } from '@/lib/storage';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: '请先登录' }, { status: 401 });
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
    return NextResponse.json({ error: '素材不存在' }, { status: 404 });
  }

  const config = await db.config.get(tenantId);

  // Real Storage Engine Integration
  const storage = new StorageEngine(config);
  const { url: directLink, error: storageError } = await storage.resolveDownloadUrl(asset.downloadUrl, asset.storageProvider || 'AList');

  if (!directLink || !directLink.startsWith('http')) {
    return new NextResponse(`下载解析失败: ${storageError || '无法解析为有效的下载链接'}`, { status: 400 });
  }

  // Increment download count
  const userId = session ? (session as any).id : null;
  await db.assets.incrementDownload(assetId, tenantId, userId);

  return NextResponse.redirect(directLink);
}

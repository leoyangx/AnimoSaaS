import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { StorageEngine } from '@/lib/storage';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: '请先登录' }, { status: 401 });
  }

  const { id: assetId } = await params;
  const asset = await db.assets.getById(assetId);

  if (!asset) {
    return NextResponse.json({ error: '素材不存在' }, { status: 404 });
  }

  const config = await db.config.get();
  
  // Real Storage Engine Integration
  const storage = new StorageEngine(config);
  const { url: directLink, error: storageError } = await storage.resolveDownloadUrl(asset.downloadUrl, asset.storageProvider || 'AList');
  
  if (!directLink || !directLink.startsWith('http')) {
    return new NextResponse(`下载解析失败: ${storageError || '无法解析为有效的下载链接'}`, { status: 400 });
  }

  // Increment download count
  const userId = session ? (session as any).id : null;
  await db.assets.incrementDownload(assetId, userId);

  return NextResponse.redirect(directLink);
}

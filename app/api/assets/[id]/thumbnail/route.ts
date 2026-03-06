import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { StorageEngine } from '@/lib/storage';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    let asset = await db.assets.getById(id);
    const config = await db.config.get();

    // 如果数据库中找不到，且 ID 以 alist- 开头，说明是动态获取的 AList 素材
    if (!asset && id.startsWith('alist-')) {
      try {
        let base64Path = id.replace('alist-', '');
        // 还原 URL 安全的 Base64
        base64Path = base64Path.replace(/-/g, '+').replace(/_/g, '/');
        // 补齐等号
        while (base64Path.length % 4 !== 0) {
          base64Path += '=';
        }
        const decodedPath = Buffer.from(base64Path, 'base64').toString('utf-8');

        asset = {
          id,
          title: decodedPath.split('/').pop() || '未知素材',
          description: '来自 AList 的动态素材',
          thumbnail: decodedPath,
          category: 'alist',
          tags: ['AList'],
          downloadUrl: decodedPath,
          storageProvider: 'AList',
          createdAt: new Date(),
          downloadCount: 0,
        } as any;
      } catch (e) {
        console.error('[Thumbnail Proxy] ID Decode Error:', e);
      }
    }

    if (!asset || !asset.thumbnail) {
      return new NextResponse('Not Found', { status: 404 });
    }

    const storage = new StorageEngine(config);
    const thumbnailUrl = await storage.resolveThumbnailUrl(
      asset.thumbnail,
      asset.storageProvider || 'AList'
    );

    // 后端代理请求，绕过防盗链
    // 动态提取网盘域名的 origin 作为 Referer，确保兼容性
    const targetUrl = new URL(thumbnailUrl);
    const headers: Record<string, string> = {
      Referer: targetUrl.origin,
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
    };

    // 如果是 AList，添加 Authorization 头
    if (asset.storageProvider === 'AList' && config.alistToken) {
      headers['Authorization'] = config.alistToken;
    }

    const response = await fetch(thumbnailUrl, {
      headers,
    });

    if (!response.ok) {
      return new NextResponse('Failed to fetch thumbnail', { status: response.status });
    }

    const contentType = response.headers.get('Content-Type') || 'image/jpeg';
    const buffer = await response.arrayBuffer();

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('[Thumbnail Proxy] Error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

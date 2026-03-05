import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { StorageEngine } from '@/lib/storage';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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
          downloadCount: 0
        } as any;
      } catch (e) {
        console.error('[Download Proxy] ID Decode Error:', e);
      }
    }

    if (!asset || !asset.downloadUrl) {
      return new NextResponse('Asset Not Found', { status: 404 });
    }

    // 1. 记录下载日志
    const session = await getSession();
    const userId = session ? (session as any).id : null;
    await db.assets.incrementDownload(id, userId);

    // 2. 获取直链
    const storage = new StorageEngine(config);
    const { url: downloadUrl, error: storageError } = await storage.resolveDownloadUrl(asset.downloadUrl, asset.storageProvider || 'AList');

    // 3. 确保 downloadUrl 是绝对路径
    if (!downloadUrl || !downloadUrl.startsWith('http')) {
      let errorDetail = '';
      if (storageError) {
        errorDetail = storageError;
      } else {
        errorDetail = !downloadUrl 
          ? 'Resolved URL is empty.' 
          : `Resolved URL is not an absolute HTTP link: "${downloadUrl}". This usually means AList API failed or the asset path is not a full URL.`;
      }
      
      console.error(`[Download Proxy] Failed to resolve a valid download URL for asset ${id}. ${errorDetail}`);
      return new NextResponse(`Failed to resolve a valid download URL. Details: ${errorDetail}. Please check your storage configuration in Admin Settings.`, { status: 400 });
    }

    // 3.5 如果开启了直链下载，直接重定向
    if (asset.isDirectDownload) {
      return NextResponse.redirect(downloadUrl);
    }

    // 4. 后端代理请求网盘文件流，伪造 Referer
    const targetUrl = new URL(downloadUrl);
    const headers: Record<string, string> = {
      'Referer': targetUrl.origin,
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': '*/*'
    };

    // 仅当目标 URL 包含 AList 域名时才发送 Authorization Token
    // 避免将 Token 发送到第三方存储服务器（如 123pan, alipan）导致 403 错误
    if (asset.storageProvider === 'AList' && config.alistToken && config.alistUrl && downloadUrl.includes(new URL(config.alistUrl).hostname)) {
      headers['Authorization'] = config.alistToken;
      console.log('[Download Proxy] Adding Authorization header for AList internal URL');
    }

    console.log(`[Download Proxy] Fetching from: ${downloadUrl}`);
    const response = await fetch(downloadUrl, {
      headers,
      redirect: 'follow', // 显式允许重定向
      signal: AbortSignal.timeout(600000) // 10 minutes timeout
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'No error body');
      console.error(`[Download Proxy] Failed to fetch from storage. Status: ${response.status}, URL: ${downloadUrl}, Body: ${errorText}`);
      return new NextResponse(`Failed to fetch file from storage: ${response.statusText}`, { status: response.status });
    }

    // 4. 构造响应头，强制浏览器原地弹出下载框并设置正确文件名
    // 优先从 Content-Disposition 获取文件名，如果没有则从 URL 提取
    const remoteDisposition = response.headers.get('Content-Disposition');
    let remoteFilename = '';
    
    if (remoteDisposition) {
      const match = remoteDisposition.match(/filename\*=UTF-8''([^";]+)/i) || 
                    remoteDisposition.match(/filename="?([^";]+)"?/i);
      if (match && match[1]) {
        remoteFilename = decodeURIComponent(match[1]);
      }
    }
    
    // 如果远程没有文件名，从 URL 提取
    if (!remoteFilename) {
      remoteFilename = downloadUrl.split('/').pop()?.split('?')[0] || '';
    }

    const urlExtension = remoteFilename.split('.').pop()?.toLowerCase() || '';
    
    // 智能处理文件名：如果标题已经包含后缀，则不再重复添加
    let finalFilename = asset.title;
    if (urlExtension && !finalFilename.toLowerCase().endsWith(`.${urlExtension}`)) {
      finalFilename = `${finalFilename}.${urlExtension}`;
    }
    
    // 构造 Content-Disposition
    // filename 参数应为 ASCII，filename* 参数为 UTF-8 编码
    const asciiFilename = encodeURIComponent(finalFilename.replace(/[^\x00-\x7F]/g, '_'));
    const encodedFilename = encodeURIComponent(finalFilename);

    // 使用 ReadableStream 进行流式转发，不占用服务器内存
    const stream = response.body;
    if (!stream) {
      console.error('[Download Proxy] Empty response body from storage');
      return new NextResponse('Empty response from storage', { status: 500 });
    }

    const contentType = response.headers.get('Content-Type') || 'application/octet-stream';
    
    // 如果返回的是 JSON 或 HTML，且状态码是 200，说明可能是 AList 的错误页面或 API 响应
    // 允许图片和视频的 HTML 预览（虽然不常见），但主要防御 JSON 错误
    if (contentType.includes('application/json')) {
      const errorJson = await response.text().catch(() => '{}');
      console.error(`[Download Proxy] Storage provider returned JSON error: ${errorJson}`);
      return new NextResponse(`Storage provider error: ${errorJson}`, { status: 500 });
    }

    const contentLength = response.headers.get('Content-Length');

    const responseHeaders: Record<string, string> = {
      'Content-Type': contentType,
      // 同时提供 filename 和 filename* 以获得最佳兼容性
      'Content-Disposition': `attachment; filename="${asciiFilename}"; filename*=UTF-8''${encodedFilename}`,
      'Cache-Control': 'no-cache',
      'X-Content-Type-Options': 'nosniff',
    };

    if (contentLength) {
      responseHeaders['Content-Length'] = contentLength;
    }

    console.log(`[Download Proxy] Starting stream for ${finalFilename} (${contentLength || 'unknown size'})`);

    return new NextResponse(stream, {
      headers: responseHeaders,
    });
  } catch (error) {
    console.error('[Download Proxy] Error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

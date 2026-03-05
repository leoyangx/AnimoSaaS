import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * 模拟参考网站的 admin.php 逻辑
 * 在用户点击下载时，先发送一个 POST 请求到后端进行记录
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: assetId } = await params;
    
    // 1. 增加下载计数
    await db.assets.incrementDownload(assetId);
    
    // 2. 返回成功响应，不包含下载地址（下载地址已在前端持有，实现原地下载）
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Download Log] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

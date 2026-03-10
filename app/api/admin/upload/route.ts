import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { createHash } from 'crypto';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(req: NextRequest) {
  try {
    const session = await getSession('admin');
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: '未授权', success: false }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: '未找到文件', success: false }, { status: 400 });
    }

    // 验证文件类型
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: '不支持的文件类型，仅支持 JPG/PNG/WEBP/GIF/SVG', success: false },
        { status: 400 }
      );
    }

    // 验证文件大小
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: '文件大小不能超过 5MB', success: false },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 基于内容生成哈希防止重复文件
    const hash = createHash('md5').update(buffer).digest('hex').substring(0, 12);
    const timestamp = Date.now();
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const filename = `${hash}-${timestamp}.${ext}`;

    // 按日期分目录存储
    const dateDir = new Date().toISOString().slice(0, 7); // YYYY-MM
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'images', dateDir);
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    const filepath = join(uploadsDir, filename);
    await writeFile(filepath, buffer);

    const url = `/uploads/images/${dateDir}/${filename}`;

    return NextResponse.json({
      success: true,
      url,
      filename: file.name,
      size: file.size,
      mimeType: file.type,
    });
  } catch (error) {
    console.error('Image upload error:', error);
    return NextResponse.json({ error: '上传失败', success: false }, { status: 500 });
  }
}

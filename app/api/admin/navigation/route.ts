import { NextResponse } from 'next/server';
import { updateNavigation } from '@/lib/settings-service';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    if (!Array.isArray(body)) {
      return NextResponse.json({ error: '导航数据格式错误，应为数组' }, { status: 400 });
    }

    // Basic item validation
    for (const item of body) {
      if (!item.label || item.label.trim() === '') {
        return NextResponse.json({ error: '导航标签不能为空' }, { status: 400 });
      }
    }

    const updated = await updateNavigation(body);
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Failed to update navigation:', error);
    return NextResponse.json({ error: '保存导航失败，请检查数据格式' }, { status: 500 });
  }
}

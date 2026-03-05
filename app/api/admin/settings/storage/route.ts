import { NextResponse } from 'next/server';
import { updateStorageSettings } from '@/lib/settings-service';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    if (!body.provider) {
      return NextResponse.json({ error: '存储提供商不能为空' }, { status: 400 });
    }

    const updated = await updateStorageSettings({
      provider: body.provider,
      config: body.config,
    });
    
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Failed to update storage settings:', error);
    return NextResponse.json({ error: '更新失败，请检查配置格式' }, { status: 500 });
  }
}

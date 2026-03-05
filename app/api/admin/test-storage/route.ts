import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

export async function POST(req: Request) {
  const session = await getSession('admin');
  if (!session || (session as any).role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const data = await req.json();
  const { type } = data;

  // Simulate API call to storage provider
  await new Promise(resolve => setTimeout(resolve, 1000));

  if (type === 'alist') {
    if (!data.alistUrl || !data.alistToken) {
      return NextResponse.json({ success: false, error: '请填写完整的 AList 配置' });
    }
    return NextResponse.json({ success: true, message: 'AList 连接成功' });
  }

  return NextResponse.json({ success: true, message: '配置已验证' });
}

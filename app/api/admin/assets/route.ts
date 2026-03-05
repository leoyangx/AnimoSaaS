import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { generateId } from '@/lib/utils';

export async function POST(req: Request) {
  const session = await getSession('admin');
  if (!session || (session as any).role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const data = await req.json();
  const newAsset = await db.assets.create(data);
  
  // Log action
  await db.logs.create('CREATE_ASSET', (session as any).email, `创建素材: ${data.title}`);
  
  return NextResponse.json({ success: true, asset: newAsset });
}

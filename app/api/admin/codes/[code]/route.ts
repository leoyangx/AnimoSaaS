import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const session = await getSession('admin');
  if (!session || (session as any).role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { code } = await params;
  await db.codes.delete(code);
  return NextResponse.json({ success: true });
}

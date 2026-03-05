import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { InvitationCode } from '@/lib/types';

export async function POST(req: Request) {
  const session = await getSession('admin');
  if (!session || (session as any).role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { count } = await req.json();
    await db.codes.generate(count || 10);
    
    // Log action
    await db.logs.create('GENERATE_CODES', (session as any).email, `批量生成邀请码: ${count || 10} 个`);
    
    return NextResponse.json({ success: true, codes: await db.codes.getAll() });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to generate codes' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const session = await getSession('admin');
  if (!session || (session as any).role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const codes = await db.codes.getAll();
  const text = codes.map((c: InvitationCode) => `${c.code}\t${c.status}`).join('\n');
  
  return new NextResponse(text, {
    headers: {
      'Content-Type': 'text/plain',
      'Content-Disposition': 'attachment; filename=invitation_codes.txt',
    },
  });
}

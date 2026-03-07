import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { getTenantIdFromRequest } from '@/lib/tenant-context';
import { InvitationCode } from '@/lib/types';

export async function POST(req: Request) {
  const session = await getSession('admin');
  if (!session || (session as any).role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const tenantId = getTenantIdFromRequest(req);

  try {
    const { count } = await req.json();
    await db.codes.generate(tenantId, count || 10);

    // Log action
    await db.logs.create(
      'GENERATE_CODES',
      (session as any).email,
      tenantId,
      `批量生成邀请码: ${count || 10} 个`
    );

    return NextResponse.json({ success: true, codes: await db.codes.getAll(tenantId) });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to generate codes' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const session = await getSession('admin');
  if (!session || (session as any).role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const tenantId = getTenantIdFromRequest(req);
  const codes = await db.codes.getAll(tenantId);
  const text = codes.map((c: InvitationCode) => `${c.code}\t${c.status}`).join('\n');

  return new NextResponse(text, {
    headers: {
      'Content-Type': 'text/plain',
      'Content-Disposition': 'attachment; filename=invitation_codes.txt',
    },
  });
}

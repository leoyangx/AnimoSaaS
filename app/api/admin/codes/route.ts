import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { getTenantIdFromRequest } from '@/lib/tenant-context';
import { invitationCodeGenerateSchema } from '@/lib/validators';
import { errorResponse, successResponse, validationErrorResponse } from '@/lib/api-response';
import { InvitationCode } from '@/lib/types';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const session = await getSession('admin');
    if (!session || session.role !== 'ADMIN') {
      return errorResponse('未授权访问', 401);
    }

    const tenantId = getTenantIdFromRequest(req);
    const body = await req.json();

    const validationResult = invitationCodeGenerateSchema.safeParse(body);
    if (!validationResult.success) {
      return validationErrorResponse(validationResult.error);
    }

    const { count } = validationResult.data;
    await db.codes.generate(tenantId, count);

    await db.logs.create('GENERATE_CODES', session.email, tenantId, `批量生成邀请码: ${count} 个`);

    const codes = await db.codes.getAll(tenantId);
    return successResponse(codes, `成功生成 ${count} 个邀请码`);
  } catch (error) {
    console.error('Generate codes error:', error);
    return errorResponse('生成邀请码失败', 500, error);
  }
}

export async function GET(req: Request) {
  try {
    const session = await getSession('admin');
    if (!session || session.role !== 'ADMIN') {
      return errorResponse('未授权访问', 401);
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
  } catch (error) {
    console.error('Export codes error:', error);
    return errorResponse('导出邀请码失败', 500, error);
  }
}

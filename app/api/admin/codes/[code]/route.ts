import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { getTenantIdFromRequest } from '@/lib/tenant-context';
import { errorResponse, successResponse } from '@/lib/api-response';

export async function DELETE(req: Request, { params }: { params: Promise<{ code: string }> }) {
  try {
    const session = await getSession('admin');
    if (!session || session.role !== 'ADMIN') {
      return errorResponse('未授权访问', 401);
    }

    const { code } = await params;
    const tenantId = getTenantIdFromRequest(req);
    await db.codes.delete(code, tenantId);
    await db.logs.create('DELETE_CODE', session.email, tenantId, `删除邀请码: ${code}`);
    return successResponse(null, '邀请码已删除');
  } catch (error) {
    console.error('Delete code error:', error);
    return errorResponse('删除邀请码失败', 500, error);
  }
}

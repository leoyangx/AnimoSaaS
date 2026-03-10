import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { getTenantIdFromRequest } from '@/lib/tenant-context';
import { moveSchema } from '@/lib/validators';
import { errorResponse, successResponse, validationErrorResponse } from '@/lib/api-response';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getSession('admin');
    if (!session || session.role !== 'ADMIN') {
      return errorResponse('未授权访问', 401);
    }
    const tenantId = getTenantIdFromRequest(req);
    const body = await req.json();

    const validationResult = moveSchema.safeParse(body);
    if (!validationResult.success) {
      return validationErrorResponse(validationResult.error);
    }

    await db.navigation.move(id, tenantId, validationResult.data.direction);
    await db.logs.create(
      'MOVE_NAV',
      session.email,
      tenantId,
      `移动导航 ID: ${id}, 方向: ${validationResult.data.direction}`
    );
    return successResponse(null, '导航排序更新成功');
  } catch (error) {
    console.error('Move navigation error:', error);
    return errorResponse('移动导航失败', 500, error);
  }
}

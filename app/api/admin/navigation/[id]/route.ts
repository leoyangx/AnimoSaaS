import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { getTenantIdFromRequest } from '@/lib/tenant-context';
import { navigationItemSchema } from '@/lib/validators';
import { errorResponse, successResponse, validationErrorResponse } from '@/lib/api-response';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getSession('admin');
    if (!session || session.role !== 'ADMIN') {
      return errorResponse('未授权访问', 401);
    }
    const tenantId = getTenantIdFromRequest(req);
    const body = await req.json();

    const validationResult = navigationItemSchema.safeParse(body);
    if (!validationResult.success) {
      return validationErrorResponse(validationResult.error);
    }

    const item = await db.navigation.update(id, tenantId, validationResult.data);
    await db.logs.create(
      'UPDATE_NAV',
      session.email,
      tenantId,
      `更新导航: ${validationResult.data.name}`
    );
    return successResponse(item, '导航更新成功');
  } catch (error) {
    console.error('Update navigation error:', error);
    return errorResponse('更新导航失败', 500, error);
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getSession('admin');
    if (!session || session.role !== 'ADMIN') {
      return errorResponse('未授权访问', 401);
    }
    const tenantId = getTenantIdFromRequest(req);
    await db.navigation.delete(id, tenantId);
    await db.logs.create('DELETE_NAV', session.email, tenantId, `删除导航 ID: ${id}`);
    return successResponse(null, '导航已删除');
  } catch (error) {
    console.error('Delete navigation error:', error);
    return errorResponse('删除导航失败', 500, error);
  }
}

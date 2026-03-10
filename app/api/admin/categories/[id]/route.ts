import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { getTenantIdFromRequest } from '@/lib/tenant-context';
import { categoryUpdateSchema } from '@/lib/validators';
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

    const validationResult = categoryUpdateSchema.safeParse(body);
    if (!validationResult.success) {
      return validationErrorResponse(validationResult.error);
    }

    const item = await db.categories.update(id, tenantId, validationResult.data);
    await db.logs.create(
      'UPDATE_CATEGORY',
      session.email,
      tenantId,
      `更新分类: ${validationResult.data.name || id}`
    );
    return successResponse(item, '分类更新成功');
  } catch (error) {
    console.error('Update category error:', error);
    return errorResponse('更新分类失败', 500, error);
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
    await db.categories.delete(id, tenantId);
    await db.logs.create('DELETE_CATEGORY', session.email, tenantId, `删除分类 ID: ${id}`);
    return successResponse(null, '分类已删除');
  } catch (error) {
    console.error('Delete category error:', error);
    return errorResponse('删除分类失败', 500, error);
  }
}

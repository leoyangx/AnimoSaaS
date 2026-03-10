import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { getTenantIdFromRequest } from '@/lib/tenant-context';
import { decrementQuota } from '@/lib/quota';
import { userUpdateSchema } from '@/lib/validators';
import { errorResponse, successResponse, validationErrorResponse } from '@/lib/api-response';
import bcrypt from 'bcryptjs';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession('admin');
    if (!session || session.role !== 'ADMIN') {
      return errorResponse('未授权访问', 401);
    }

    const { id } = await params;
    const tenantId = getTenantIdFromRequest(req);
    const body = await req.json();

    // Zod 输入验证
    const validationResult = userUpdateSchema.safeParse(body);
    if (!validationResult.success) {
      return validationErrorResponse(validationResult.error);
    }

    const { disabled, password } = validationResult.data;

    const updateData: any = {};
    if (disabled !== undefined) updateData.disabled = disabled;
    if (password) {
      updateData.password = await bcrypt.hash(password, 12);
    }

    await db.users.update(id, tenantId, updateData);

    // Log action
    const action = password ? 'CHANGE_PASSWORD' : 'TOGGLE_USER_STATUS';
    const details = password
      ? `修改学员 ID: ${id} 的密码`
      : `修改学员 ID: ${id} 的状态为: ${disabled ? '禁用' : '启用'}`;
    await db.logs.create(action, session.email, tenantId, details);

    return successResponse(null, '操作成功');
  } catch (error) {
    console.error('Update user error:', error);
    return errorResponse('操作失败', 500, error);
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession('admin');
    if (!session || session.role !== 'ADMIN') {
      return errorResponse('未授权访问', 401);
    }

    const { id } = await params;
    const tenantId = getTenantIdFromRequest(req);
    await db.users.delete(id, tenantId);

    // 更新配额
    await decrementQuota(tenantId, 'users');

    // Log action
    await db.logs.create('DELETE_USER', session.email, tenantId, `删除学员 ID: ${id}`);

    return successResponse(null, '用户已删除');
  } catch (error) {
    console.error('Delete user error:', error);
    return errorResponse('删除用户失败', 500, error);
  }
}

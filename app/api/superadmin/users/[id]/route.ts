import { prisma } from '@/lib/prisma';
import { errorResponse, successResponse } from '@/lib/api-response';

/**
 * PATCH /api/superadmin/users/[id]
 * 更新用户状态（启用/禁用）
 */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { disabled } = body;

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return errorResponse('用户不存在', 404);
    }

    await prisma.user.update({
      where: { id },
      data: { disabled },
    });

    return successResponse(null, disabled ? '用户已禁用' : '用户已启用');
  } catch (e) {
    console.error('Update user error:', e);
    return errorResponse('更新用户失败', 500, e);
  }
}

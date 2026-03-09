import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { errorResponse, successResponse, validationErrorResponse } from '@/lib/api-response';
import { z } from 'zod';

const adminUpdateSchema = z.object({
  email: z.string().email('邮箱格式不正确').optional(),
  password: z
    .string()
    .min(8, '密码至少8位')
    .regex(/[A-Z]/, '密码必须包含大写字母')
    .regex(/[a-z]/, '密码必须包含小写字母')
    .regex(/[0-9]/, '密码必须包含数字')
    .optional(),
  disabled: z.boolean().optional(),
});

/**
 * GET /api/superadmin/tenants/[id]/admins/[adminId]
 * 获取租户管理员详情
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string; adminId: string }> }
) {
  try {
    const { id: tenantId, adminId } = await params;

    const admin = await prisma.user.findFirst({
      where: {
        id: adminId,
        tenantId,
        role: 'ADMIN',
        deletedAt: null,
      },
      select: {
        id: true,
        email: true,
        role: true,
        disabled: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!admin) {
      return errorResponse('管理员不存在', 404);
    }

    return successResponse(admin);
  } catch (e) {
    console.error('Get tenant admin error:', e);
    return errorResponse('获取管理员信息失败', 500, e);
  }
}

/**
 * PATCH /api/superadmin/tenants/[id]/admins/[adminId]
 * 更新租户管理员信息（邮箱、密码、状态）
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; adminId: string }> }
) {
  try {
    const { id: tenantId, adminId } = await params;
    const body = await req.json();

    const validationResult = adminUpdateSchema.safeParse(body);
    if (!validationResult.success) {
      return validationErrorResponse(validationResult.error);
    }

    const { email, password, disabled } = validationResult.data;

    // 验证管理员存在
    const admin = await prisma.user.findFirst({
      where: { id: adminId, tenantId, role: 'ADMIN', deletedAt: null },
    });

    if (!admin) {
      return errorResponse('管理员不存在', 404);
    }

    // 如果修改邮箱，检查是否重复
    if (email && email !== admin.email) {
      const existing = await prisma.user.findUnique({
        where: { tenantId_email: { tenantId, email } },
      });
      if (existing) {
        return errorResponse('该邮箱已被使用', 400);
      }
    }

    // 构建更新数据
    const updateData: any = {};
    if (email !== undefined) updateData.email = email;
    if (disabled !== undefined) updateData.disabled = disabled;
    if (password) {
      updateData.password = await bcrypt.hash(password, 12);
    }

    const updated = await prisma.user.update({
      where: { id: adminId },
      data: updateData,
      select: {
        id: true,
        email: true,
        role: true,
        disabled: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return successResponse(updated, '管理员信息更新成功');
  } catch (e) {
    console.error('Update tenant admin error:', e);
    return errorResponse('更新管理员信息失败', 500, e);
  }
}

/**
 * DELETE /api/superadmin/tenants/[id]/admins/[adminId]
 * 删除租户管理员（软删除）
 */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string; adminId: string }> }
) {
  try {
    const { id: tenantId, adminId } = await params;

    const admin = await prisma.user.findFirst({
      where: { id: adminId, tenantId, role: 'ADMIN', deletedAt: null },
    });

    if (!admin) {
      return errorResponse('管理员不存在', 404);
    }

    await prisma.user.update({
      where: { id: adminId },
      data: { deletedAt: new Date() },
    });

    return successResponse(null, '管理员删除成功');
  } catch (e) {
    console.error('Delete tenant admin error:', e);
    return errorResponse('删除管理员失败', 500, e);
  }
}

import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { db } from '@/lib/db';
import { getTenantIdFromRequest } from '@/lib/tenant-context';
import { errorResponse, successResponse } from '@/lib/api-response';
import { z } from 'zod';

const batchUserOperationSchema = z.object({
  action: z.enum(['delete', 'restore', 'enable', 'disable', 'updateRole']),
  userIds: z.array(z.string()).min(1, '至少选择一个用户').max(100, '最多选择100个用户'),
  role: z.enum(['USER', 'ADMIN', 'STUDENT']).optional(),
});

export async function POST(req: Request) {
  try {
    // 验证管理员权限
    const session = await getSession('admin');
    if (!session || session.role !== 'ADMIN') {
      return errorResponse('未授权访问', 401);
    }

    const tenantId = getTenantIdFromRequest(req);
    const body = await req.json();
    const validationResult = batchUserOperationSchema.safeParse(body);

    if (!validationResult.success) {
      return errorResponse('数据验证失败', 400, validationResult.error.issues);
    }

    const { action, userIds, role } = validationResult.data;

    // 防止操作当前管理员账号
    const currentUserId = session.id;
    if (userIds.includes(currentUserId)) {
      return errorResponse('不能对当前登录的管理员账号执行批量操作', 400);
    }

    let result;
    let message = '';

    switch (action) {
      case 'delete':
        // 软删除
        result = await prisma.user.updateMany({
          where: {
            id: { in: userIds },
            tenantId,
            role: { not: 'ADMIN' }, // 防止删除管理员
          },
          data: { deletedAt: new Date() },
        });
        message = `成功删除 ${result.count} 个用户`;
        await db.logs.create(
          'BATCH_DELETE_USERS',
          session.email,
          tenantId,
          `批量删除 ${result.count} 个用户`
        );
        break;

      case 'restore':
        // 恢复软删除
        result = await prisma.user.updateMany({
          where: { id: { in: userIds }, tenantId, deletedAt: { not: null } },
          data: { deletedAt: null },
        });
        message = `成功恢复 ${result.count} 个用户`;
        await db.logs.create(
          'BATCH_RESTORE_USERS',
          session.email,
          tenantId,
          `批量恢复 ${result.count} 个用户`
        );
        break;

      case 'enable':
        result = await prisma.user.updateMany({
          where: { id: { in: userIds }, tenantId },
          data: { disabled: false },
        });
        message = `成功启用 ${result.count} 个用户`;
        await db.logs.create(
          'BATCH_ENABLE_USERS',
          session.email,
          tenantId,
          `批量启用 ${result.count} 个用户`
        );
        break;

      case 'disable':
        result = await prisma.user.updateMany({
          where: {
            id: { in: userIds },
            tenantId,
            role: { not: 'ADMIN' }, // 防止禁用管理员
          },
          data: { disabled: true },
        });
        message = `成功禁用 ${result.count} 个用户`;
        await db.logs.create(
          'BATCH_DISABLE_USERS',
          session.email,
          tenantId,
          `批量禁用 ${result.count} 个用户`
        );
        break;

      case 'updateRole':
        if (!role) {
          return errorResponse('请指定角色', 400);
        }
        if (role === 'ADMIN') {
          return errorResponse('不能批量设置为管理员角色', 400);
        }
        result = await prisma.user.updateMany({
          where: {
            id: { in: userIds },
            tenantId,
            role: { not: 'ADMIN' }, // 防止修改管理员角色
          },
          data: { role },
        });
        message = `成功更新 ${result.count} 个用户的角色为 ${role}`;
        await db.logs.create(
          'BATCH_UPDATE_ROLE',
          session.email,
          tenantId,
          `批量更新 ${result.count} 个用户的角色为 ${role}`
        );
        break;

      default:
        return errorResponse('不支持的操作', 400);
    }

    return successResponse({ count: result.count }, message);
  } catch (error) {
    console.error('Batch user operation error:', error);
    return errorResponse('批量操作失败', 500, error);
  }
}

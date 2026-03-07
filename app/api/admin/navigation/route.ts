import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { getTenantIdFromRequest } from '@/lib/tenant-context';
import { navigationItemSchema } from '@/lib/validators';
import { z } from 'zod';
import { errorResponse, successResponse, validationErrorResponse } from '@/lib/api-response';

export async function POST(req: Request) {
  try {
    // 验证管理员权限
    const session = await getSession('admin');
    if (!session || session.role !== 'ADMIN') {
      return errorResponse('未授权访问', 401);
    }

    const tenantId = getTenantIdFromRequest(req);
    const body = await req.json();

    // 验证数据格式
    if (!Array.isArray(body)) {
      return errorResponse('导航数据格式错误，应为数组', 400);
    }

    // 使用 Zod 验证每个导航项
    const navigationArraySchema = z.array(navigationItemSchema);
    const validationResult = navigationArraySchema.safeParse(body);

    if (!validationResult.success) {
      return validationErrorResponse(validationResult.error);
    }

    // 更新导航配置
    await prisma.$transaction(async (tx) => {
      await tx.topNav.deleteMany({ where: { tenantId } });

      for (let i = 0; i < validationResult.data.length; i++) {
        const { ...navItem } = validationResult.data[i];
        await tx.topNav.create({
          data: {
            ...navItem,
            order: i,
            tenantId,
          },
        });
      }
    });

    // 记录操作日志
    await db.logs.create(
      'UPDATE_NAVIGATION',
      session.email,
      tenantId,
      `更新导航配置，共 ${body.length} 项`
    );

    return successResponse({ count: body.length }, '导航配置更新成功');
  } catch (error) {
    console.error('Failed to update navigation:', error);
    return errorResponse('保存导航失败', 500, error);
  }
}

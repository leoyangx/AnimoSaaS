import { db } from '@/lib/db';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { getTenantIdFromRequest } from '@/lib/tenant-context';
import { navigationItemSchema, navigationArraySchema } from '@/lib/validators';
import { errorResponse, successResponse, validationErrorResponse } from '@/lib/api-response';

export async function GET(req: Request) {
  try {
    const session = await getSession('admin');
    if (!session || session.role !== 'ADMIN') {
      return errorResponse('未授权访问', 401);
    }
    const tenantId = getTenantIdFromRequest(req);
    const items = await db.navigation.getAll(tenantId);
    return successResponse(items);
  } catch (error) {
    console.error('Get navigation error:', error);
    return errorResponse('获取导航失败', 500, error);
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession('admin');
    if (!session || session.role !== 'ADMIN') {
      return errorResponse('未授权访问', 401);
    }

    const tenantId = getTenantIdFromRequest(req);
    const body = await req.json();

    // 兼容两种模式：单条创建（对象）或批量替换（数组）
    if (Array.isArray(body)) {
      // 批量替换模式（保留向后兼容）
      const validationResult = navigationArraySchema.safeParse(body);
      if (!validationResult.success) {
        return validationErrorResponse(validationResult.error);
      }

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

      await db.logs.create(
        'UPDATE_NAVIGATION',
        session.email,
        tenantId,
        `批量更新导航配置，共 ${body.length} 项`
      );
      return successResponse({ count: body.length }, '导航配置更新成功');
    } else {
      // 单条创建模式
      const validationResult = navigationItemSchema.safeParse(body);
      if (!validationResult.success) {
        return validationErrorResponse(validationResult.error);
      }

      // 自动计算 order：取当前最大值 + 1
      const maxOrderItem = await prisma.topNav.findFirst({
        where: { tenantId },
        orderBy: { order: 'desc' },
        select: { order: true },
      });
      const nextOrder = (maxOrderItem?.order ?? -1) + 1;

      const item = await db.navigation.create(tenantId, {
        ...validationResult.data,
        order: nextOrder, // 始终使用计算出的 order，忽略用户传入的值
      });

      await db.logs.create(
        'CREATE_NAV',
        session.email,
        tenantId,
        `创建导航: ${validationResult.data.name}`
      );
      return successResponse(item, '导航创建成功');
    }
  } catch (error) {
    console.error('Failed to save navigation:', error);
    return errorResponse('保存导航失败', 500, error);
  }
}

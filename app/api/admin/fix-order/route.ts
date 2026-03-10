import { getSession } from '@/lib/auth';
import { getTenantIdFromRequest } from '@/lib/tenant-context';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/api-response';

export async function POST(req: Request) {
  try {
    const session = await getSession('admin');
    if (!session || session.role !== 'ADMIN') {
      return errorResponse('未授权访问', 401);
    }

    const tenantId = getTenantIdFromRequest(req);

    // 修复导航的 order 值
    const navItems = await prisma.topNav.findMany({
      where: { tenantId },
      orderBy: { order: 'asc' },
    });

    for (let i = 0; i < navItems.length; i++) {
      await prisma.topNav.update({
        where: { id: navItems[i].id },
        data: { order: i },
      });
    }

    // 修复分类的 order 值（按父分类分组）
    const categories = await prisma.assetCategory.findMany({
      where: { tenantId, deletedAt: null },
      orderBy: [{ parentId: 'asc' }, { order: 'asc' }],
    });

    // 按 parentId 分组
    const grouped = new Map<string | null, any[]>();
    for (const cat of categories) {
      const key = cat.parentId || 'root';
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(cat);
    }

    // 为每组重新分配连续的 order
    for (const [parentId, items] of grouped.entries()) {
      for (let i = 0; i < items.length; i++) {
        await prisma.assetCategory.update({
          where: { id: items[i].id },
          data: { order: i },
        });
      }
    }

    return successResponse(
      {
        navigationFixed: navItems.length,
        categoriesFixed: categories.length
      },
      'Order 值修复成功'
    );
  } catch (error) {
    console.error('Fix order error:', error);
    return errorResponse('修复失败', 500, error);
  }
}

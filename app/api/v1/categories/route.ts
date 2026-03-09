import { successResponse, errorResponse } from '@/lib/api-response';
import { checkApiKeyPermission } from '@/lib/api-keys';
import { authenticateApiKey } from '@/lib/api-v1-auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/v1/categories — 获取分类列表
 */
export async function GET(req: Request) {
  try {
    const auth = await authenticateApiKey(req);
    if ('error' in auth) return auth.error;

    const { tenantId, permissions } = auth.context;

    if (!checkApiKeyPermission(permissions, 'categories:read')) {
      return errorResponse('API Key 缺少 categories:read 权限', 403);
    }

    const categories = await prisma.assetCategory.findMany({
      where: { tenantId, deletedAt: null },
      orderBy: { order: 'asc' },
      select: {
        id: true,
        name: true,
        parentId: true,
        order: true,
        status: true,
        icon: true,
        _count: { select: { assets: true } },
      },
    });

    return successResponse(
      categories.map((c) => ({
        id: c.id,
        name: c.name,
        parentId: c.parentId,
        order: c.order,
        status: c.status,
        icon: c.icon,
        assetCount: c._count.assets,
      }))
    );
  } catch (e) {
    console.error('V1 list categories error:', e);
    return errorResponse('获取分类列表失败', 500, e);
  }
}

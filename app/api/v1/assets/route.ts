import { successResponse, errorResponse } from '@/lib/api-response';
import { checkApiKeyPermission } from '@/lib/api-keys';
import { authenticateApiKey } from '@/lib/api-v1-auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/v1/assets — 获取资产列表
 *
 * 查询参数：
 *   - page: 页码（默认 1）
 *   - limit: 每页数量（默认 20，最大 100）
 *   - category: 分类 ID
 *   - search: 搜索关键词
 *   - tag: 标签筛选
 */
export async function GET(req: Request) {
  try {
    const auth = await authenticateApiKey(req);
    if ('error' in auth) return auth.error;

    const { tenantId, permissions } = auth.context;

    if (!checkApiKeyPermission(permissions, 'assets:read')) {
      return errorResponse('API Key 缺少 assets:read 权限', 403);
    }

    const url = new URL(req.url);
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') || '20')));
    const category = url.searchParams.get('category') || undefined;
    const search = url.searchParams.get('search') || undefined;
    const tag = url.searchParams.get('tag') || undefined;

    const where: any = {
      tenantId,
      deletedAt: null,
    };

    if (category) where.categoryId = category;
    if (tag) where.tags = { has: tag };
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [total, assets] = await Promise.all([
      prisma.asset.count({ where }),
      prisma.asset.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          title: true,
          description: true,
          thumbnail: true,
          tags: true,
          downloadCount: true,
          fileSize: true,
          categoryId: true,
          createdAt: true,
          updatedAt: true,
          assetCategory: {
            select: { id: true, name: true },
          },
        },
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return successResponse({
      assets: assets.map((a) => ({
        ...a,
        fileSize: Number(a.fileSize),
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (e) {
    console.error('V1 list assets error:', e);
    return errorResponse('获取资产列表失败', 500, e);
  }
}

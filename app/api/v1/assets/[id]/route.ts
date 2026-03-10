import { successResponse, errorResponse } from '@/lib/api-response';
import { checkApiKeyPermission } from '@/lib/api-keys';
import { authenticateApiKey } from '@/lib/api-v1-auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/v1/assets/[id] — 获取单个资产详情
 */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await authenticateApiKey(req);
    if ('error' in auth) return auth.error;

    const { tenantId, permissions } = auth.context;
    const { id } = await params;

    if (!checkApiKeyPermission(permissions, 'assets:read')) {
      return errorResponse('API Key 缺少 assets:read 权限', 403);
    }

    const asset = await prisma.asset.findFirst({
      where: { id, tenantId, deletedAt: null },
      select: {
        id: true,
        title: true,
        description: true,
        thumbnail: true,
        tags: true,
        downloadCount: true,
        fileSize: true,
        categoryId: true,
        storageProvider: true,
        isDirectDownload: true,
        createdAt: true,
        updatedAt: true,
        assetCategory: {
          select: { id: true, name: true },
        },
      },
    });

    if (!asset) {
      return errorResponse('资产不存在', 404);
    }

    return successResponse({
      ...asset,
      fileSize: Number(asset.fileSize),
    });
  } catch (e) {
    console.error('V1 get asset error:', e);
    return errorResponse('获取资产详情失败', 500, e);
  }
}

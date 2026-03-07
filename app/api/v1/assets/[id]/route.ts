import { getTenantIdFromRequest } from '@/lib/tenant-context';
import { successResponse, errorResponse } from '@/lib/api-response';
import { checkApiKeyPermission } from '@/lib/api-keys';
import { prisma } from '@/lib/prisma';

function getPermissions(req: Request): string[] {
  const raw = req.headers.get('x-api-key-permissions');
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

/**
 * GET /api/v1/assets/[id] — 获取单个资产详情
 */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const tenantId = getTenantIdFromRequest(req);
    const permissions = getPermissions(req);
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

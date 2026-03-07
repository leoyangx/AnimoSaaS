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
 * GET /api/v1/assets/[id]/download — 获取资产下载链接
 */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const tenantId = getTenantIdFromRequest(req);
    const permissions = getPermissions(req);
    const { id } = await params;

    if (!checkApiKeyPermission(permissions, 'download:read')) {
      return errorResponse('API Key 缺少 download:read 权限', 403);
    }

    const asset = await prisma.asset.findFirst({
      where: { id, tenantId, deletedAt: null },
      select: {
        id: true,
        title: true,
        downloadUrl: true,
        storageProvider: true,
        isDirectDownload: true,
      },
    });

    if (!asset) {
      return errorResponse('资产不存在', 404);
    }

    // 记录下载
    await prisma.asset.update({
      where: { id },
      data: { downloadCount: { increment: 1 } },
    });

    const apiKeyId = req.headers.get('x-api-key-id') || 'api-key';
    await prisma.downloadLog.create({
      data: {
        assetId: id,
        userId: apiKeyId,
        tenantId,
      },
    });

    return successResponse({
      id: asset.id,
      title: asset.title,
      downloadUrl: asset.downloadUrl,
      storageProvider: asset.storageProvider,
      isDirectDownload: asset.isDirectDownload,
    });
  } catch (e) {
    console.error('V1 download asset error:', e);
    return errorResponse('获取下载链接失败', 500, e);
  }
}

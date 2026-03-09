import { successResponse, errorResponse } from '@/lib/api-response';
import { checkApiKeyPermission } from '@/lib/api-keys';
import { authenticateApiKey } from '@/lib/api-v1-auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/v1/assets/[id]/download — 获取资产下载链接
 */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await authenticateApiKey(req);
    if ('error' in auth) return auth.error;

    const { tenantId, apiKeyId, permissions } = auth.context;
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

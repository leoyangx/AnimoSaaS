import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { db } from '@/lib/db';
import { getTenantIdFromRequest } from '@/lib/tenant-context';
import { errorResponse, successResponse } from '@/lib/api-response';
import { z } from 'zod';

const batchOperationSchema = z.object({
  action: z.enum(['delete', 'restore', 'updateCategory', 'addTags', 'removeTags']),
  assetIds: z.array(z.string()).min(1, '至少选择一个资产').max(100, '最多选择100个资产'),
  categoryId: z.string().optional(),
  tags: z.array(z.string()).optional(),
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
    const validationResult = batchOperationSchema.safeParse(body);

    if (!validationResult.success) {
      return errorResponse('数据验证失败', 400, validationResult.error.issues);
    }

    const { action, assetIds, categoryId, tags } = validationResult.data;

    let result;
    let message = '';

    switch (action) {
      case 'delete':
        // 软删除
        result = await prisma.asset.updateMany({
          where: { id: { in: assetIds }, tenantId },
          data: { deletedAt: new Date() },
        });
        message = `成功删除 ${result.count} 个资产`;
        await db.logs.create(
          'BATCH_DELETE_ASSETS',
          session.email,
          tenantId,
          `批量删除 ${result.count} 个资产`
        );
        break;

      case 'restore':
        // 恢复软删除
        result = await prisma.asset.updateMany({
          where: { id: { in: assetIds }, tenantId, deletedAt: { not: null } },
          data: { deletedAt: null },
        });
        message = `成功恢复 ${result.count} 个资产`;
        await db.logs.create(
          'BATCH_RESTORE_ASSETS',
          session.email,
          tenantId,
          `批量恢复 ${result.count} 个资产`
        );
        break;

      case 'updateCategory':
        if (!categoryId) {
          return errorResponse('请指定分类ID', 400);
        }
        result = await prisma.asset.updateMany({
          where: { id: { in: assetIds }, tenantId },
          data: { categoryId },
        });
        message = `成功更新 ${result.count} 个资产的分类`;
        await db.logs.create(
          'BATCH_UPDATE_CATEGORY',
          session.email,
          tenantId,
          `批量更新 ${result.count} 个资产的分类`
        );
        break;

      case 'addTags':
        if (!tags || tags.length === 0) {
          return errorResponse('请指定要添加的标签', 400);
        }
        // 获取所有资产并添加标签
        const assetsToAddTags = await prisma.asset.findMany({
          where: { id: { in: assetIds }, tenantId },
          select: { id: true, tags: true },
        });

        await Promise.all(
          assetsToAddTags.map((asset) => {
            const newTags = Array.from(new Set([...asset.tags, ...tags]));
            return prisma.asset.update({
              where: { id: asset.id },
              data: { tags: newTags },
            });
          })
        );

        message = `成功为 ${assetsToAddTags.length} 个资产添加标签`;
        await db.logs.create(
          'BATCH_ADD_TAGS',
          session.email,
          tenantId,
          `批量添加标签: ${tags.join(', ')}`
        );
        result = { count: assetsToAddTags.length };
        break;

      case 'removeTags':
        if (!tags || tags.length === 0) {
          return errorResponse('请指定要移除的标签', 400);
        }
        // 获取所有资产并移除标签
        const assetsToRemoveTags = await prisma.asset.findMany({
          where: { id: { in: assetIds }, tenantId },
          select: { id: true, tags: true },
        });

        await Promise.all(
          assetsToRemoveTags.map((asset) => {
            const newTags = asset.tags.filter((tag) => !tags.includes(tag));
            return prisma.asset.update({
              where: { id: asset.id },
              data: { tags: newTags },
            });
          })
        );

        message = `成功为 ${assetsToRemoveTags.length} 个资产移除标签`;
        await db.logs.create(
          'BATCH_REMOVE_TAGS',
          session.email,
          tenantId,
          `批量移除标签: ${tags.join(', ')}`
        );
        result = { count: assetsToRemoveTags.length };
        break;

      default:
        return errorResponse('不支持的操作', 400);
    }

    return successResponse({ count: result.count }, message);
  } catch (error) {
    console.error('Batch operation error:', error);
    return errorResponse('批量操作失败', 500, error);
  }
}

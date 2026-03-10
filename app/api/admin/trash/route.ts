import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getTenantIdFromRequest } from '@/lib/tenant-context';
import { errorResponse, successResponse, paginatedResponse } from '@/lib/api-response';
import {
  getPaginationFromRequest,
  getPaginationSkipTake,
  createPaginatedResponse,
} from '@/lib/pagination';

// 获取回收站列表
export async function GET(req: Request) {
  try {
    const session = await getSession('admin');
    if (!session || session.role !== 'ADMIN') {
      return errorResponse('未授权访问', 401);
    }

    const tenantId = getTenantIdFromRequest(req);
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'assets'; // assets, users, categories
    const params = getPaginationFromRequest(req);
    const { skip, take } = getPaginationSkipTake(params);

    let data: any[] = [];
    let total = 0;

    switch (type) {
      case 'assets':
        [data, total] = await Promise.all([
          prisma.asset.findMany({
            where: { tenantId, deletedAt: { not: null } },
            include: { assetCategory: true },
            orderBy: { deletedAt: 'desc' },
            skip,
            take,
          }),
          prisma.asset.count({ where: { tenantId, deletedAt: { not: null } } }),
        ]);
        break;

      case 'users':
        [data, total] = await Promise.all([
          prisma.user.findMany({
            where: { tenantId, deletedAt: { not: null } },
            orderBy: { deletedAt: 'desc' },
            skip,
            take,
          }),
          prisma.user.count({ where: { tenantId, deletedAt: { not: null } } }),
        ]);
        break;

      case 'categories':
        [data, total] = await Promise.all([
          prisma.assetCategory.findMany({
            where: { tenantId, deletedAt: { not: null } },
            orderBy: { deletedAt: 'desc' },
            skip,
            take,
          }),
          prisma.assetCategory.count({ where: { tenantId, deletedAt: { not: null } } }),
        ]);
        break;

      default:
        return errorResponse('不支持的类型', 400);
    }

    const paginatedData = createPaginatedResponse(data, total, params);
    return paginatedResponse(paginatedData.data, paginatedData.pagination);
  } catch (error) {
    console.error('Trash list error:', error);
    return errorResponse('获取回收站列表失败', 500, error);
  }
}

// 清空回收站
export async function DELETE(req: Request) {
  try {
    const session = await getSession('admin');
    if (!session || session.role !== 'ADMIN') {
      return errorResponse('未授权访问', 401);
    }

    const tenantId = getTenantIdFromRequest(req);
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'assets';

    let result;

    switch (type) {
      case 'assets':
        result = await prisma.asset.deleteMany({
          where: { tenantId, deletedAt: { not: null } },
        });
        break;

      case 'users':
        result = await prisma.user.deleteMany({
          where: { tenantId, deletedAt: { not: null } },
        });
        break;

      case 'categories':
        result = await prisma.assetCategory.deleteMany({
          where: { tenantId, deletedAt: { not: null } },
        });
        break;

      default:
        return errorResponse('不支持的类型', 400);
    }

    return successResponse({ count: result.count }, `成功清空 ${result.count} 条记录`);
  } catch (error) {
    console.error('Empty trash error:', error);
    return errorResponse('清空回收站失败', 500, error);
  }
}

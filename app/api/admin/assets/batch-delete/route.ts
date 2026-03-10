import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { getTenantIdFromRequest } from '@/lib/tenant-context';
import { decrementQuota } from '@/lib/quota';
import { errorResponse, successResponse } from '@/lib/api-response';
import { z } from 'zod';

const batchDeleteSchema = z.object({
  ids: z.array(z.string()).optional(),
  deleteAll: z.boolean().optional().default(false),
});

export async function POST(req: Request) {
  try {
    const session = await getSession('admin');
    if (!session || session.role !== 'ADMIN') {
      return errorResponse('未授权访问', 401);
    }
    const tenantId = getTenantIdFromRequest(req);
    const body = await req.json();

    const validationResult = batchDeleteSchema.safeParse(body);
    if (!validationResult.success) {
      return errorResponse('请求参数格式错误', 400);
    }

    const { ids, deleteAll } = validationResult.data;

    if (!deleteAll && (!ids || ids.length === 0)) {
      return errorResponse('请指定要删除的素材ID或选择删除全部', 400);
    }

    const count = await db.assets.batchDelete(tenantId, deleteAll ? undefined : ids);

    // 批量递减配额
    for (let i = 0; i < count; i++) {
      await decrementQuota(tenantId, 'assets');
    }

    await db.logs.create(
      'BATCH_DELETE_ASSETS',
      session.email,
      tenantId,
      `批量删除素材 ${count} 个${deleteAll ? ' (全部)' : ''}`
    );
    return successResponse({ count }, `成功删除 ${count} 个素材`);
  } catch (error) {
    console.error('Batch delete assets error:', error);
    return errorResponse('批量删除素材失败', 500, error);
  }
}

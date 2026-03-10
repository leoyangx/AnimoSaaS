import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { getTenantIdFromRequest } from '@/lib/tenant-context';
import { siteConfigUpdateSchema } from '@/lib/validators';
import { errorResponse, successResponse, validationErrorResponse } from '@/lib/api-response';

export async function POST(req: Request) {
  try {
    const session = await getSession('admin');
    if (!session || session.role !== 'ADMIN') {
      return errorResponse('未授权访问', 401);
    }

    const tenantId = getTenantIdFromRequest(req);
    const body = await req.json();

    const validationResult = siteConfigUpdateSchema.safeParse(body);
    if (!validationResult.success) {
      return validationErrorResponse(validationResult.error);
    }

    await db.config.update(tenantId, validationResult.data);

    await db.logs.create('UPDATE_SETTINGS', session.email, tenantId, '更新系统配置');

    const config = await db.config.get(tenantId);
    return successResponse(config, '配置更新成功');
  } catch (error) {
    console.error('Update settings error:', error);
    return errorResponse('更新配置失败', 500, error);
  }
}

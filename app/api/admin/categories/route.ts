import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { getTenantIdFromRequest } from '@/lib/tenant-context';
import { categorySchema } from '@/lib/validators';
import { errorResponse, successResponse, validationErrorResponse } from '@/lib/api-response';

export async function GET(req: Request) {
  try {
    const session = await getSession('admin');
    if (!session || session.role !== 'ADMIN') {
      return errorResponse('未授权访问', 401);
    }
    const tenantId = getTenantIdFromRequest(req);
    const categories = await db.categories.getAll(tenantId);
    return successResponse(categories);
  } catch (error) {
    console.error('Get categories error:', error);
    return errorResponse('获取分类失败', 500, error);
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession('admin');
    if (!session || session.role !== 'ADMIN') {
      return errorResponse('未授权访问', 401);
    }
    const tenantId = getTenantIdFromRequest(req);
    const body = await req.json();

    const validationResult = categorySchema.safeParse(body);
    if (!validationResult.success) {
      return validationErrorResponse(validationResult.error);
    }

    const item = await db.categories.create(tenantId, validationResult.data);
    await db.logs.create(
      'CREATE_CATEGORY',
      session.email,
      tenantId,
      `创建分类: ${validationResult.data.name}`
    );
    return successResponse(item, '分类创建成功');
  } catch (error) {
    console.error('Create category error:', error);
    return errorResponse('创建分类失败', 500, error);
  }
}

import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { getTenantIdFromRequest } from '@/lib/tenant-context';
import { checkQuota, incrementQuota } from '@/lib/quota';
import { assetSchema } from '@/lib/validators';
import { errorResponse, successResponse, validationErrorResponse } from '@/lib/api-response';

export async function POST(req: Request) {
  const session = await getSession('admin');
  if (!session || session.role !== 'ADMIN') {
    return errorResponse('Unauthorized', 401);
  }

  const tenantId = getTenantIdFromRequest(req);

  // 配额检查
  const quotaCheck = await checkQuota(tenantId, 'assets');
  if (!quotaCheck.allowed) {
    return errorResponse(quotaCheck.message || '资产数已达上限', 403);
  }

  const body = await req.json();

  // Zod 输入验证
  const validationResult = assetSchema.safeParse(body);
  if (!validationResult.success) {
    return validationErrorResponse(validationResult.error);
  }

  const newAsset = await db.assets.create(tenantId, validationResult.data);

  // 更新配额
  await incrementQuota(tenantId, 'assets');

  // Log action
  await db.logs.create(
    'CREATE_ASSET',
    session.email,
    tenantId,
    `创建素材: ${validationResult.data.title}`
  );

  return successResponse(newAsset, '素材创建成功');
}

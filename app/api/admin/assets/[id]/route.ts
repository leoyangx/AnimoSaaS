import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { getTenantIdFromRequest } from '@/lib/tenant-context';
import { decrementQuota } from '@/lib/quota';
import { assetUpdateSchema } from '@/lib/validators';
import {
  errorResponse,
  successResponse,
  validationErrorResponse,
  notFoundResponse,
} from '@/lib/api-response';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession('admin');
  if (!session || session.role !== 'ADMIN') {
    return errorResponse('Unauthorized', 401);
  }

  const { id } = await params;
  const tenantId = getTenantIdFromRequest(req);

  // 验证资源归属当前租户
  const existing = await db.assets.getById(id, tenantId);
  if (!existing) {
    return notFoundResponse('素材不存在');
  }

  const body = await req.json();

  // Zod 输入验证
  const validationResult = assetUpdateSchema.safeParse(body);
  if (!validationResult.success) {
    return validationErrorResponse(validationResult.error);
  }

  await db.assets.update(id, tenantId, validationResult.data);

  // Log action
  await db.logs.create(
    'UPDATE_ASSET',
    session.email,
    tenantId,
    `编辑素材 ID: ${id}, 标题: ${validationResult.data.title || existing.title}`
  );

  return successResponse(null, '素材更新成功');
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession('admin');
  if (!session || session.role !== 'ADMIN') {
    return errorResponse('Unauthorized', 401);
  }

  const { id } = await params;
  const tenantId = getTenantIdFromRequest(req);

  // 验证资源归属当前租户
  const existing = await db.assets.getById(id, tenantId);
  if (!existing) {
    return notFoundResponse('素材不存在');
  }

  await db.assets.delete(id, tenantId);

  // 更新配额
  await decrementQuota(tenantId, 'assets');

  // Log action
  await db.logs.create('DELETE_ASSET', session.email, tenantId, `删除素材 ID: ${id}`);

  return successResponse(null, '素材删除成功');
}

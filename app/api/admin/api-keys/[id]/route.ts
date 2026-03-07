import { getTenantIdFromRequest } from '@/lib/tenant-context';
import { successResponse, errorResponse } from '@/lib/api-response';
import { getApiKey, updateApiKey, deleteApiKey } from '@/lib/api-keys';
import { db } from '@/lib/db';

/**
 * GET /api/admin/api-keys/[id] — 获取单个 API Key 详情
 */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const tenantId = getTenantIdFromRequest(req);
    const { id } = await params;

    const apiKey = await getApiKey(id, tenantId);
    if (!apiKey) {
      return errorResponse('API Key 不存在', 404);
    }

    return successResponse(apiKey);
  } catch (e) {
    console.error('Get API key error:', e);
    return errorResponse('获取 API Key 失败', 500, e);
  }
}

/**
 * PATCH /api/admin/api-keys/[id] — 更新 API Key（名称、权限、启用/禁用）
 */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const tenantId = getTenantIdFromRequest(req);
    const { id } = await params;
    const body = await req.json();

    // 确认密钥属于当前租户
    const existing = await getApiKey(id, tenantId);
    if (!existing) {
      return errorResponse('API Key 不存在', 404);
    }

    const updateData: any = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.permissions !== undefined) updateData.permissions = body.permissions;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;
    if (body.expiresAt !== undefined) {
      updateData.expiresAt = body.expiresAt ? new Date(body.expiresAt) : null;
    }

    await updateApiKey(id, tenantId, updateData);
    await db.logs.create('UPDATE_API_KEY', 'admin', tenantId, `更新 API Key: ${existing.name}`);

    return successResponse({ id }, 'API Key 更新成功');
  } catch (e) {
    console.error('Update API key error:', e);
    return errorResponse('更新 API Key 失败', 500, e);
  }
}

/**
 * DELETE /api/admin/api-keys/[id] — 删除 API Key
 */
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const tenantId = getTenantIdFromRequest(req);
    const { id } = await params;

    const existing = await getApiKey(id, tenantId);
    if (!existing) {
      return errorResponse('API Key 不存在', 404);
    }

    await deleteApiKey(id, tenantId);
    await db.logs.create('DELETE_API_KEY', 'admin', tenantId, `删除 API Key: ${existing.name}`);

    return successResponse({ id }, 'API Key 已删除');
  } catch (e) {
    console.error('Delete API key error:', e);
    return errorResponse('删除 API Key 失败', 500, e);
  }
}

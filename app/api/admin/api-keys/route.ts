import { NextResponse } from 'next/server';
import { getTenantIdFromRequest } from '@/lib/tenant-context';
import { successResponse, errorResponse } from '@/lib/api-response';
import { createApiKey, listApiKeys, API_PERMISSIONS } from '@/lib/api-keys';
import { db } from '@/lib/db';

/**
 * GET /api/admin/api-keys — 获取当前租户的 API Key 列表
 */
export async function GET(req: Request) {
  try {
    const tenantId = getTenantIdFromRequest(req);
    const keys = await listApiKeys(tenantId);

    return successResponse({
      keys,
      availablePermissions: Object.entries(API_PERMISSIONS).map(([key, desc]) => ({
        key,
        description: desc,
      })),
    });
  } catch (e) {
    console.error('List API keys error:', e);
    return errorResponse('获取 API Key 列表失败', 500, e);
  }
}

/**
 * POST /api/admin/api-keys — 创建新的 API Key
 */
export async function POST(req: Request) {
  try {
    const tenantId = getTenantIdFromRequest(req);
    const body = await req.json();

    const { name, permissions, expiresIn } = body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return errorResponse('名称不能为空', 400);
    }

    if (!permissions || !Array.isArray(permissions) || permissions.length === 0) {
      return errorResponse('至少需要选择一个权限', 400);
    }

    // 验证权限值有效
    const validPermissions = Object.keys(API_PERMISSIONS);
    for (const perm of permissions) {
      if (!validPermissions.includes(perm) && perm !== '*') {
        return errorResponse(`无效的权限: ${perm}`, 400);
      }
    }

    // 计算过期时间
    let expiresAt: Date | null = null;
    if (expiresIn) {
      const now = new Date();
      switch (expiresIn) {
        case '7d':
          expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
          break;
        case '90d':
          expiresAt = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
          break;
        case '365d':
          expiresAt = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
          break;
        case 'never':
        default:
          expiresAt = null;
          break;
      }
    }

    const apiKey = await createApiKey({
      tenantId,
      name: name.trim(),
      permissions,
      expiresAt,
    });

    // 记录操作日志
    await db.logs.create('CREATE_API_KEY', 'admin', tenantId, `创建 API Key: ${name}`);

    return successResponse(apiKey, 'API Key 创建成功');
  } catch (e) {
    console.error('Create API key error:', e);
    return errorResponse('创建 API Key 失败', 500, e);
  }
}

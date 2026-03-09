/**
 * 租户上下文管理
 *
 * middleware 注入 x-tenant-slug（始终）和 x-tenant-id（已认证的 admin/user 路由）。
 * 对于未认证路由（如 login），route handler 自行通过 slug 查询 DB。
 */

import { headers } from 'next/headers';

/**
 * 从当前请求的 headers 中获取租户 ID（用于 Server Component / RSC）
 * 优先使用 x-tenant-id，否则通过 x-tenant-slug 查询数据库
 */
export async function getTenantId(): Promise<string> {
  const headerStore = await headers();

  const tenantId = headerStore.get('x-tenant-id');
  if (tenantId) return tenantId;

  // 通过 slug 查询数据库
  const slug = headerStore.get('x-tenant-slug') || 'default';
  const { getTenantBySlug } = await import('./tenant');
  const tenant = await getTenantBySlug(slug);
  if (tenant) return tenant.id;

  // 回退到默认租户
  if (slug !== 'default') {
    const defaultTenant = await getTenantBySlug('default');
    if (defaultTenant) return defaultTenant.id;
  }

  throw new Error('租户上下文未初始化：无法解析租户');
}

/**
 * 从当前请求的 headers 中获取租户 slug
 */
export async function getTenantSlug(): Promise<string> {
  const headerStore = await headers();
  return headerStore.get('x-tenant-slug') || 'default';
}

/**
 * 从 Request 对象中提取租户 ID（用于 API 路由）
 * middleware 对已认证的 admin/user 路由注入了 x-tenant-id
 */
export function getTenantIdFromRequest(request: Request): string {
  const tenantId = request.headers.get('x-tenant-id');
  if (!tenantId) {
    throw new Error('租户上下文未初始化：缺少 X-Tenant-Id 请求头');
  }
  return tenantId;
}

/**
 * 安全地获取租户 ID，如果不存在返回 null 而不是抛异常
 */
export async function getTenantIdSafe(): Promise<string | null> {
  try {
    return await getTenantId();
  } catch {
    return null;
  }
}

/**
 * 从 Request 对象中安全提取租户 ID
 */
export function getTenantIdFromRequestSafe(request: Request): string | null {
  return request.headers.get('x-tenant-id');
}

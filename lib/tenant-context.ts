/**
 * 租户上下文管理
 *
 * 提供从 Next.js 请求中获取租户信息的便捷方法。
 * 租户信息由 middleware 在请求头中注入：
 *   - X-Tenant-Id: 租户数据库 ID
 *   - X-Tenant-Slug: 租户标识符
 */

import { headers } from 'next/headers';

/**
 * 从当前请求的 headers 中获取租户 ID
 * 用于 Server Components 和 Route Handlers
 */
export async function getTenantId(): Promise<string> {
  const headerStore = await headers();
  const tenantId = headerStore.get('x-tenant-id');
  if (!tenantId) {
    throw new Error('租户上下文未初始化：缺少 X-Tenant-Id 请求头');
  }
  return tenantId;
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
    const headerStore = await headers();
    return headerStore.get('x-tenant-id');
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

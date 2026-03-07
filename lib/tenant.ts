/**
 * 租户识别工具
 *
 * 支持三种租户识别模式：
 * 1. subdomain: tenant1.animosaas.com
 * 2. path: /t/tenant1/...
 * 3. header: X-Tenant-Slug 请求头
 *
 * 在 middleware 中识别后，通过 X-Tenant-Id 和 X-Tenant-Slug 请求头传递。
 */

import { prisma } from './prisma';

export interface TenantInfo {
  id: string;
  slug: string;
  name: string;
  plan: string;
  status: string;
}

// 内存缓存：slug -> TenantInfo，带过期时间
const tenantCache = new Map<string, { data: TenantInfo; expiresAt: number }>();
const CACHE_TTL = 60 * 1000; // 1 分钟

/**
 * 根据 slug 查询租户信息（带缓存）
 */
export async function getTenantBySlug(slug: string): Promise<TenantInfo | null> {
  // 检查缓存
  const cached = tenantCache.get(slug);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  // 查询数据库
  const tenant = await prisma.tenant.findUnique({
    where: { slug },
    select: { id: true, slug: true, name: true, plan: true, status: true },
  });

  if (!tenant) return null;

  const info: TenantInfo = {
    id: tenant.id,
    slug: tenant.slug,
    name: tenant.name,
    plan: tenant.plan,
    status: tenant.status,
  };

  // 写入缓存
  tenantCache.set(slug, { data: info, expiresAt: Date.now() + CACHE_TTL });

  return info;
}

/**
 * 根据 ID 查询租户信息
 */
export async function getTenantById(id: string): Promise<TenantInfo | null> {
  const tenant = await prisma.tenant.findUnique({
    where: { id },
    select: { id: true, slug: true, name: true, plan: true, status: true },
  });

  if (!tenant) return null;

  return {
    id: tenant.id,
    slug: tenant.slug,
    name: tenant.name,
    plan: tenant.plan,
    status: tenant.status,
  };
}

/**
 * 根据自定义域名查询租户
 */
export async function getTenantByDomain(domain: string): Promise<TenantInfo | null> {
  const tenant = await prisma.tenant.findUnique({
    where: { domain },
    select: { id: true, slug: true, name: true, plan: true, status: true },
  });

  if (!tenant) return null;

  return {
    id: tenant.id,
    slug: tenant.slug,
    name: tenant.name,
    plan: tenant.plan,
    status: tenant.status,
  };
}

/**
 * 从请求中识别租户 slug
 *
 * 优先级：Header > Path > Subdomain
 */
export function resolveTenantSlug(request: {
  headers: { get(name: string): string | null };
  url: string;
}): string {
  const mode = process.env.TENANT_MODE || 'path';

  // 1. 始终优先检查 Header（API 调用和测试用）
  const headerSlug = request.headers.get('x-tenant-slug');
  if (headerSlug) {
    return headerSlug;
  }

  // 2. 路径模式：/t/tenant-slug/...
  if (mode === 'path') {
    try {
      const url = new URL(request.url);
      const pathMatch = url.pathname.match(/^\/t\/([^/]+)/);
      if (pathMatch) {
        return pathMatch[1];
      }
    } catch {
      // URL 解析失败，回退到默认
    }
  }

  // 3. 子域名模式：tenant-slug.example.com
  if (mode === 'subdomain') {
    const host = request.headers.get('host') || '';
    const parts = host.split('.');
    // 至少三段（tenant.example.com），且不是 www
    if (parts.length >= 3 && parts[0] !== 'www') {
      return parts[0];
    }
  }

  // 4. 默认租户
  return 'default';
}

/**
 * 清除租户缓存（在租户信息更新后调用）
 */
export function clearTenantCache(slug?: string) {
  if (slug) {
    tenantCache.delete(slug);
  } else {
    tenantCache.clear();
  }
}

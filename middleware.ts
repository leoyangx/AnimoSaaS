import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { resolveTenantSlug, getTenantBySlug } from '@/lib/tenant';
import { verifyApiKey } from '@/lib/api-keys';
import { validateCsrfDouble, CSRF_COOKIE_NAME, CSRF_HEADER_NAME } from '@/lib/csrf';

/**
 * 强制使用 Node.js Runtime（jsonwebtoken 不支持 Edge Runtime）
 */
export const runtime = 'nodejs';

/**
 * Next.js 中间件 - 统一租户识别、认证和授权
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ========== 租户识别 ==========
  // 超级管理员路由不需要租户上下文
  const isSuperAdminRoute =
    pathname.startsWith('/api/superadmin') || pathname.startsWith('/superadmin');
  const isHealthRoute = pathname.startsWith('/api/health');
  const isV1Route = pathname.startsWith('/api/v1');

  let tenantId = '';
  let tenantSlug = '';

  // ========== API Key 认证（/api/v1/*）==========
  if (isV1Route) {
    const authHeader = request.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        {
          success: false,
          error: '缺少 Authorization 头部，格式：Bearer ak_xxx',
          timestamp: new Date().toISOString(),
        },
        { status: 401 }
      );
    }

    const apiKeyStr = authHeader.substring(7); // 去掉 "Bearer "

    if (!apiKeyStr.startsWith('ak_')) {
      return NextResponse.json(
        { success: false, error: '无效的 API Key 格式', timestamp: new Date().toISOString() },
        { status: 401 }
      );
    }

    const apiKey = await verifyApiKey(apiKeyStr);

    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          error: 'API Key 无效、已禁用或已过期',
          timestamp: new Date().toISOString(),
        },
        { status: 401 }
      );
    }

    // 检查租户状态
    const { prisma } = await import('@/lib/prisma');
    const tenantRecord = await prisma.tenant.findUnique({
      where: { id: apiKey.tenantId },
      select: { id: true, slug: true, status: true },
    });

    if (!tenantRecord || tenantRecord.status !== 'active') {
      return NextResponse.json(
        { success: false, error: '租户已被停用', timestamp: new Date().toISOString() },
        { status: 403 }
      );
    }

    // 注入租户 ID 和权限信息到请求头
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-tenant-id', apiKey.tenantId);
    requestHeaders.set('x-tenant-slug', tenantRecord.slug);
    requestHeaders.set('x-api-key-id', apiKey.id);
    requestHeaders.set('x-api-key-permissions', JSON.stringify(apiKey.permissions));

    return NextResponse.next({
      request: { headers: requestHeaders },
    });
  }

  if (!isSuperAdminRoute && !isHealthRoute) {
    // 解析租户 slug
    tenantSlug = resolveTenantSlug(request);

    // 查询租户信息
    const tenant = await getTenantBySlug(tenantSlug);

    if (!tenant) {
      // 如果是 API 请求，返回 JSON 错误
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          { success: false, error: '租户不存在', timestamp: new Date().toISOString() },
          { status: 404 }
        );
      }
      // 页面请求，重定向到错误页（或回退到默认租户）
      const defaultTenant = await getTenantBySlug('default');
      if (defaultTenant) {
        tenantId = defaultTenant.id;
        tenantSlug = defaultTenant.slug;
      } else {
        return NextResponse.json(
          { success: false, error: '系统未初始化', timestamp: new Date().toISOString() },
          { status: 503 }
        );
      }
    } else if (tenant.status !== 'active') {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          { success: false, error: '租户已被停用', timestamp: new Date().toISOString() },
          { status: 403 }
        );
      }
      return NextResponse.redirect(new URL('/suspended', request.url));
    } else {
      tenantId = tenant.id;
      tenantSlug = tenant.slug;
    }
  }

  // ========== CSRF 防护 ==========
  // 对非 API Key 的写操作进行 CSRF 验证（GET/HEAD/OPTIONS 跳过）
  const method = request.method.toUpperCase();
  if (!isV1Route && !['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    // 登录/注册路由豁免 CSRF（用户还没有 token，无法获取 CSRF cookie）
    const isCsrfExempt =
      pathname.startsWith('/api/auth/login') ||
      pathname.startsWith('/api/auth/register') ||
      pathname.startsWith('/api/superadmin/login') ||
      pathname.startsWith('/api/csrf') ||
      pathname.startsWith('/api/init');

    if (!isCsrfExempt) {
      const cookieToken = request.cookies.get(CSRF_COOKIE_NAME)?.value;
      const headerToken = request.headers.get(CSRF_HEADER_NAME);

      if (!validateCsrfDouble(cookieToken, headerToken)) {
        return NextResponse.json(
          { success: false, error: 'CSRF 验证失败', timestamp: new Date().toISOString() },
          { status: 403 }
        );
      }
    }
  }

  // ========== 超级管理员路由保护 ==========
  if (pathname.startsWith('/api/superadmin') && !pathname.includes('/login')) {
    const token = request.cookies.get('superadmin_token')?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, error: '未授权访问', timestamp: new Date().toISOString() },
        { status: 401 }
      );
    }

    try {
      const session = await verifyToken(token);
      if (!session || session.role !== 'superadmin') {
        return NextResponse.json(
          { success: false, error: '权限不足', timestamp: new Date().toISOString() },
          { status: 403 }
        );
      }
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Token 无效或已过期', timestamp: new Date().toISOString() },
        { status: 401 }
      );
    }

    // Superadmin routes don't need tenant headers, pass through
    const saHeaders = new Headers(request.headers);
    return NextResponse.next({ request: { headers: saHeaders } });
  }

  // ========== 管理员路由保护 ==========
  if (pathname.startsWith('/api/admin')) {
    const token = request.cookies.get('admin_token')?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, error: '未授权访问', timestamp: new Date().toISOString() },
        { status: 401 }
      );
    }

    try {
      const session = await verifyToken(token);
      if (!session || session.role !== 'ADMIN') {
        return NextResponse.json(
          { success: false, error: '权限不足', timestamp: new Date().toISOString() },
          { status: 403 }
        );
      }
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Token 无效或已过期', timestamp: new Date().toISOString() },
        { status: 401 }
      );
    }
  }

  // ========== 用户路由保护 ==========
  if (pathname.startsWith('/api/user')) {
    const token = request.cookies.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, error: '请先登录', timestamp: new Date().toISOString() },
        { status: 401 }
      );
    }

    try {
      const session = await verifyToken(token);
      if (!session) {
        return NextResponse.json(
          { success: false, error: 'Token 无效或已过期', timestamp: new Date().toISOString() },
          { status: 401 }
        );
      }
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Token 无效或已过期', timestamp: new Date().toISOString() },
        { status: 401 }
      );
    }
  }

  // ========== 下载路由保护 ==========
  if (pathname.startsWith('/api/download') || pathname.startsWith('/api/fetch')) {
    const token =
      request.cookies.get('auth_token')?.value || request.cookies.get('admin_token')?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, error: '请先登录后下载', timestamp: new Date().toISOString() },
        { status: 401 }
      );
    }

    try {
      const session = await verifyToken(token);
      if (!session) {
        return NextResponse.json(
          { success: false, error: 'Token 无效或已过期', timestamp: new Date().toISOString() },
          { status: 401 }
        );
      }
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Token 无效或已过期', timestamp: new Date().toISOString() },
        { status: 401 }
      );
    }
  }

  // ========== 注入租户请求头 ==========
  const response = NextResponse.next();

  if (tenantId) {
    // 通过 request headers 注入租户信息，供下游 API 路由使用
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-tenant-id', tenantId);
    requestHeaders.set('x-tenant-slug', tenantSlug);

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  return response;
}

/**
 * 中间件配置 - 指定需要拦截的路由
 */
export const config = {
  matcher: [
    '/api/admin/:path*',
    '/api/user/:path*',
    '/api/download/:path*',
    '/api/fetch/:path*',
    '/api/superadmin/:path*',
    '/api/auth/:path*',
    '/api/settings/:path*',
    '/api/init/:path*',
    '/api/assets/:path*',
    '/api/v1/:path*',
  ],
};

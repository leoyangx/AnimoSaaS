import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { resolveTenantSlug } from '@/lib/tenant';
import { validateCsrfDouble, CSRF_COOKIE_NAME, CSRF_HEADER_NAME } from '@/lib/csrf';

/**
 * Next.js 中间件 - 认证、CSRF 防护、租户 slug 透传
 *
 * 重要：Next.js middleware 始终运行在 Edge Runtime，不能使用 Prisma。
 * 租户 DB 查询由下游 route handler 完成（通过 getTenantId() / getTenantIdFromRequest()）。
 * middleware 只负责：解析 slug → 注入 header → 认证 → CSRF 校验。
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ========== 路由分类 ==========
  const isSuperAdminRoute =
    pathname.startsWith('/api/superadmin') || pathname.startsWith('/superadmin');
  const isV1Route = pathname.startsWith('/api/v1');

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

    const apiKeyStr = authHeader.substring(7);

    if (!apiKeyStr.startsWith('ak_')) {
      return NextResponse.json(
        { success: false, error: '无效的 API Key 格式', timestamp: new Date().toISOString() },
        { status: 401 }
      );
    }

    // API Key 验证和租户查询交给 route handler 处理
    // middleware 只做格式校验，避免在 Edge Runtime 调用 Prisma
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-api-key-raw', apiKeyStr);

    return NextResponse.next({
      request: { headers: requestHeaders },
    });
  }

  // ========== 租户 slug 解析（不调用 Prisma）==========
  let tenantSlug = '';
  if (!isSuperAdminRoute) {
    tenantSlug = resolveTenantSlug(request);
  }

  // ========== CSRF 防护 ==========
  const method = request.method.toUpperCase();
  if (!isV1Route && !['GET', 'HEAD', 'OPTIONS'].includes(method)) {
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
        { success: false, error: '请先登录' },
        { status: 401 }
      );
    }

    try {
      const session = await verifyToken(token);

      if (!session) {
        return NextResponse.json(
          { success: false, error: '会话已过期' },
          { status: 401 }
        );
      }

      if (session.role !== 'superadmin') {
        return NextResponse.json(
          { success: false, error: '权限不足' },
          { status: 403 }
        );
      }
    } catch (error) {
      return NextResponse.json(
        { success: false, error: '身份验证失败' },
        { status: 401 }
      );
    }

    return NextResponse.next();
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
      // 从 JWT 中提取 tenantId 注入请求头
      if (session.tenantId) {
        tenantSlug = tenantSlug || 'default';
        const requestHeaders = new Headers(request.headers);
        requestHeaders.set('x-tenant-id', session.tenantId);
        requestHeaders.set('x-tenant-slug', tenantSlug);
        return NextResponse.next({ request: { headers: requestHeaders } });
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
      // 从 JWT 中提取 tenantId 注入请求头
      if (session.tenantId) {
        tenantSlug = tenantSlug || 'default';
        const requestHeaders = new Headers(request.headers);
        requestHeaders.set('x-tenant-id', session.tenantId);
        requestHeaders.set('x-tenant-slug', tenantSlug);
        return NextResponse.next({ request: { headers: requestHeaders } });
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
      if (session.tenantId) {
        tenantSlug = tenantSlug || 'default';
        const requestHeaders = new Headers(request.headers);
        requestHeaders.set('x-tenant-id', session.tenantId);
        requestHeaders.set('x-tenant-slug', tenantSlug);
        return NextResponse.next({ request: { headers: requestHeaders } });
      }
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Token 无效或已过期', timestamp: new Date().toISOString() },
        { status: 401 }
      );
    }
  }

  // ========== 注入租户 slug 请求头 ==========
  if (tenantSlug) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-tenant-slug', tenantSlug);

    return NextResponse.next({
      request: { headers: requestHeaders },
    });
  }

  return NextResponse.next();
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

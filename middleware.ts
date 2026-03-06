import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth';

/**
 * Next.js 中间件 - 统一认证和授权
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 管理员路由保护
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
      if (!session || (session as any).role !== 'admin') {
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

  // 用户路由保护（需要登录但不需要管理员权限）
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

  // 下载路由保护（需要登录）
  if (pathname.startsWith('/api/download') || pathname.startsWith('/api/fetch')) {
    const token = request.cookies.get('auth_token')?.value || request.cookies.get('admin_token')?.value;

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
  ],
};

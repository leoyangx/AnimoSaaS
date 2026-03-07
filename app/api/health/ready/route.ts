import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * GET /api/health/ready — 就绪检查
 * 验证数据库连接 + 默认租户存在 + 超级管理员存在
 */
export async function GET() {
  const checks: Record<string, { ok: boolean; message: string }> = {};

  // 1. 数据库连接
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = { ok: true, message: 'connected' };
  } catch (e) {
    checks.database = { ok: false, message: e instanceof Error ? e.message : 'connection failed' };
  }

  // 2. 默认租户
  try {
    const defaultTenant = await prisma.tenant.findUnique({ where: { slug: 'default' } });
    checks.defaultTenant = defaultTenant
      ? { ok: true, message: `id: ${defaultTenant.id}` }
      : { ok: false, message: 'default tenant not found — run db:seed:multitenant' };
  } catch (e) {
    checks.defaultTenant = { ok: false, message: 'query failed' };
  }

  // 3. 超级管理员
  try {
    const adminCount = await prisma.superAdmin.count();
    checks.superAdmin = adminCount > 0
      ? { ok: true, message: `${adminCount} super admin(s)` }
      : { ok: false, message: 'no super admin — run db:seed:multitenant' };
  } catch (e) {
    checks.superAdmin = { ok: false, message: 'query failed' };
  }

  // 4. 数据库表检查（迁移是否完成）
  try {
    await prisma.tenant.count();
    checks.migrations = { ok: true, message: 'schema up to date' };
  } catch (e) {
    checks.migrations = { ok: false, message: 'tables missing — run prisma migrate deploy' };
  }

  const allOk = Object.values(checks).every((c) => c.ok);

  return NextResponse.json(
    {
      ready: allOk,
      timestamp: new Date().toISOString(),
      checks,
    },
    { status: allOk ? 200 : 503 }
  );
}

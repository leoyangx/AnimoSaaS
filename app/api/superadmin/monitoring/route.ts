import { successResponse, errorResponse } from '@/lib/api-response';
import { getRequestStats, getSystemInfo } from '@/lib/logger';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * GET /api/superadmin/monitoring — 获取系统监控数据
 */
export async function GET() {
  try {
    const [sysInfo, reqStats, tenantStats, dbStats] = await Promise.all([
      Promise.resolve(getSystemInfo()),
      Promise.resolve(getRequestStats()),
      getTenantStats(),
      getDatabaseStats(),
    ]);

    return successResponse({
      system: sysInfo,
      requests: reqStats,
      tenants: tenantStats,
      database: dbStats,
    });
  } catch (e) {
    console.error('Monitoring error:', e);
    return errorResponse('获取监控数据失败', 500, e);
  }
}

async function getTenantStats() {
  try {
    const [total, active, suspended, deleted] = await Promise.all([
      prisma.tenant.count(),
      prisma.tenant.count({ where: { status: 'active' } }),
      prisma.tenant.count({ where: { status: 'suspended' } }),
      prisma.tenant.count({ where: { status: 'deleted' } }),
    ]);

    // 租户活跃度排行（按用户数）
    const topTenants = await prisma.tenant.findMany({
      where: { status: 'active' },
      select: {
        name: true,
        slug: true,
        plan: true,
        _count: { select: { users: true, assets: true } },
      },
      orderBy: { users: { _count: 'desc' } },
      take: 10,
    });

    return {
      total,
      active,
      suspended,
      deleted,
      topTenants: topTenants.map((t) => ({
        name: t.name,
        slug: t.slug,
        plan: t.plan,
        users: t._count.users,
        assets: t._count.assets,
      })),
    };
  } catch {
    return { total: 0, active: 0, suspended: 0, deleted: 0, topTenants: [] };
  }
}

async function getDatabaseStats() {
  try {
    const start = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const latency = Date.now() - start;

    const [userCount, assetCount, logCount] = await Promise.all([
      prisma.user.count(),
      prisma.asset.count({ where: { deletedAt: null } }),
      prisma.adminLog.count(),
    ]);

    return {
      status: 'connected',
      latencyMs: latency,
      records: {
        users: userCount,
        assets: assetCount,
        logs: logCount,
      },
    };
  } catch (e) {
    return {
      status: 'disconnected',
      latencyMs: -1,
      error: e instanceof Error ? e.message : 'unknown',
      records: { users: 0, assets: 0, logs: 0 },
    };
  }
}

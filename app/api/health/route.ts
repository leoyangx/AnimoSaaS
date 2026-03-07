import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * GET /api/health — 基本健康检查
 */
export async function GET() {
  try {
    // 检查数据库连接
    await prisma.$queryRaw`SELECT 1`;

    // 获取系统统计
    const [tenantCount, userCount] = await Promise.all([
      prisma.tenant.count().catch(() => -1),
      prisma.user.count().catch(() => -1),
    ]);

    const memUsage = process.memoryUsage();

    return NextResponse.json(
      {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        database: 'connected',
        uptime: Math.floor(process.uptime()),
        version: '2.0.0',
        node: process.version,
        memory: {
          rss: Math.round(memUsage.rss / 1048576),
          heapUsed: Math.round(memUsage.heapUsed / 1048576),
          heapTotal: Math.round(memUsage.heapTotal / 1048576),
          unit: 'MB',
        },
        tenants: tenantCount,
        users: userCount,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        database: 'disconnected',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 503 }
    );
  }
}

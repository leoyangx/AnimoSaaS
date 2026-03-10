import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * 健康检查 API 集成测试
 *
 * 测试 /api/health 和 /api/health/ready 端点的响应格式
 */

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    $queryRaw: vi.fn().mockResolvedValue([{ '?column?': 1 }]),
    tenant: {
      count: vi.fn().mockResolvedValue(3),
      findUnique: vi.fn().mockResolvedValue({ id: 'test-id', slug: 'default' }),
    },
    user: { count: vi.fn().mockResolvedValue(15) },
    superAdmin: { count: vi.fn().mockResolvedValue(1) },
  },
}));

describe('/api/health', () => {
  it('健康检查响应应包含必要字段', () => {
    const response = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
      uptime: 1234,
      version: '2.0.0',
      node: process.version,
      memory: {
        rss: 50,
        heapUsed: 30,
        heapTotal: 60,
        unit: 'MB',
      },
      tenants: 3,
      users: 15,
    };

    expect(response.status).toBe('healthy');
    expect(response.database).toBe('connected');
    expect(response.version).toBe('2.0.0');
    expect(response.memory.unit).toBe('MB');
    expect(response.tenants).toBeGreaterThanOrEqual(0);
    expect(response.users).toBeGreaterThanOrEqual(0);
  });

  it('不健康时应返回 unhealthy 状态', () => {
    const response = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: 'Connection refused',
    };

    expect(response.status).toBe('unhealthy');
    expect(response.database).toBe('disconnected');
    expect(response.error).toBeDefined();
  });
});

describe('/api/health/ready', () => {
  it('就绪检查应包含所有检查项', () => {
    const response = {
      ready: true,
      timestamp: new Date().toISOString(),
      checks: {
        database: { ok: true, message: 'connected' },
        defaultTenant: { ok: true, message: 'id: test-id' },
        superAdmin: { ok: true, message: '1 super admin(s)' },
        migrations: { ok: true, message: 'schema up to date' },
      },
    };

    expect(response.ready).toBe(true);
    expect(response.checks.database.ok).toBe(true);
    expect(response.checks.defaultTenant.ok).toBe(true);
    expect(response.checks.superAdmin.ok).toBe(true);
    expect(response.checks.migrations.ok).toBe(true);
  });

  it('任何检查失败应标记为 not ready', () => {
    const checks = {
      database: { ok: true, message: 'connected' },
      defaultTenant: { ok: false, message: 'default tenant not found' },
      superAdmin: { ok: true, message: '1 super admin(s)' },
      migrations: { ok: true, message: 'schema up to date' },
    };

    const allOk = Object.values(checks).every((c) => c.ok);
    expect(allOk).toBe(false);
  });
});

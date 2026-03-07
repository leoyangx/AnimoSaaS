import { test, expect } from '@playwright/test';

/**
 * 健康检查 E2E 测试
 */
test.describe('健康检查端点', () => {
  test('GET /api/health 应返回 200', async ({ request }) => {
    const response = await request.get('/api/health');
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.status).toBe('healthy');
    expect(body.database).toBe('connected');
    expect(body.version).toBeDefined();
    expect(body.uptime).toBeGreaterThanOrEqual(0);
    expect(body.memory).toBeDefined();
    expect(body.memory.unit).toBe('MB');
  });

  test('GET /api/health/ready 应返回就绪状态', async ({ request }) => {
    const response = await request.get('/api/health/ready');
    const body = await response.json();

    expect(body.timestamp).toBeDefined();
    expect(body.checks).toBeDefined();
    expect(body.checks.database).toBeDefined();
    expect(body.checks.database.ok).toBe(true);
  });
});

import { test, expect } from '@playwright/test';

/**
 * 管理员登录 E2E 测试
 */
test.describe('管理员登录', () => {
  test('应显示登录页面', async ({ page }) => {
    await page.goto('/admin/login');

    // 检查登录表单存在
    await expect(page.locator('input[type="email"]').or(page.locator('input[name="email"]').or(page.locator('input[placeholder*="邮箱"]')))).toBeVisible({ timeout: 5000 });
  });

  test('未登录访问 /admin 应重定向到登录页', async ({ page }) => {
    await page.goto('/admin');

    // 应被重定向到登录页
    await page.waitForURL('**/admin/login', { timeout: 5000 });
    expect(page.url()).toContain('/admin/login');
  });

  test('API 未授权应返回 401', async ({ request }) => {
    const response = await request.get('/api/admin/assets');
    expect(response.status()).toBe(401);

    const body = await response.json();
    expect(body.success).toBe(false);
  });
});

test.describe('V1 API 认证', () => {
  test('无 Authorization 头应返回 401', async ({ request }) => {
    const response = await request.get('/api/v1/assets');
    expect(response.status()).toBe(401);

    const body = await response.json();
    expect(body.success).toBe(false);
  });

  test('无效 API Key 应返回 401', async ({ request }) => {
    const response = await request.get('/api/v1/assets', {
      headers: { Authorization: 'Bearer ak_invalid_key_12345' },
    });
    expect(response.status()).toBe(401);
  });

  test('非 ak_ 前缀应返回 401', async ({ request }) => {
    const response = await request.get('/api/v1/assets', {
      headers: { Authorization: 'Bearer sk_not_api_key' },
    });
    expect(response.status()).toBe(401);
  });
});

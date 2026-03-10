import { test, expect } from '@playwright/test';

/**
 * 超级管理员登录 E2E 测试
 */
test.describe('超级管理员登录', () => {
  test('应显示登录页面', async ({ page }) => {
    await page.goto('/superadmin/login');

    // 检查页面元素
    await expect(page.locator('text=超级管理员')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('空表单提交应提示必填', async ({ page }) => {
    await page.goto('/superadmin/login');

    // 直接点击登录按钮
    await page.click('button[type="submit"]');

    // HTML5 required 验证应阻止提交
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toHaveAttribute('required', '');
  });

  test('错误密码应显示错误信息', async ({ page }) => {
    await page.goto('/superadmin/login');

    await page.fill('input[type="email"]', 'wrong@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    // 等待错误消息出现
    await expect(
      page.locator('text=邮箱或密码错误').or(page.locator('[class*="red"]'))
    ).toBeVisible({
      timeout: 5000,
    });
  });

  test('未登录访问 /superadmin 应重定向到登录页', async ({ page }) => {
    await page.goto('/superadmin');

    // 应被重定向到登录页
    await page.waitForURL('**/superadmin/login', { timeout: 5000 });
    expect(page.url()).toContain('/superadmin/login');
  });
});

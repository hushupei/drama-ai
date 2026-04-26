import { test, expect } from '@playwright/test'

test.describe('认证功能', () => {
  test('应该显示登录页面', async ({ page }) => {
    await page.goto('/login')

    await expect(page.locator('.ant-card-head-title')).toContainText('登录')
    await expect(page.locator('input[placeholder="用户名"]')).toBeVisible()
    await expect(page.locator('input[placeholder="密码"]')).toBeVisible()
  })

  test('应该显示注册页面', async ({ page }) => {
    await page.goto('/register')

    await expect(page.locator('.ant-card-head-title')).toContainText('注册')
    await expect(page.locator('input[placeholder="用户名"]')).toBeVisible()
    await expect(page.locator('input[placeholder="邮箱"]')).toBeVisible()
  })

  test('未登录用户应该被重定向到登录页', async ({ page }) => {
    await page.goto('/novels')

    await page.waitForURL('/login')
    await expect(page).toHaveURL('/login')
  })
})

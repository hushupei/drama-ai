import { test, expect } from '@playwright/test'

test.describe('小说管理功能', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[placeholder="用户名"]', 'admin')
    await page.fill('input[placeholder="密码"]', 'admin123')
    await page.click('button:has-text("登录")')
    await page.waitForURL('/novels')
  })

  test('应该显示小说列表页面', async ({ page }) => {
    await page.goto('/novels')
    await expect(page.locator('h2')).toContainText('小说管理')
    await expect(page.locator('button:has-text("上传小说")')).toBeVisible()
  })

  test('应该能查看小说详情', async ({ page }) => {
    await page.goto('/novels')
    await page.click('text=查看')
    await expect(page).toHaveURL(/\/novels\/\w+/)
    await expect(page.locator('.ant-descriptions')).toBeVisible()
  })

  test('应该能从详情页返回列表', async ({ page }) => {
    await page.goto('/novels/test-id')
    await page.click('text=返回列表')
    await expect(page).toHaveURL('/novels')
  })
})

test.describe('角色管理功能', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[name="username"]', 'admin')
    await page.fill('input[name="password"]', 'admin123')
    await page.click('button[type="submit"]')
  })

  test('应该显示角色管理页面', async ({ page }) => {
    await page.goto('/novels/test-novel-id/characters')
    await expect(page.locator('.ant-card-head-title')).toContainText('角色管理')
    await expect(page.locator('button:has-text("新增角色")')).toBeVisible()
  })
})

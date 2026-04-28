import { test, expect } from '@playwright/test'

test.describe('AI Novel Parsing Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[placeholder="用户名"]', 'admin')
    await page.fill('input[placeholder="密码"]', 'admin123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/novels')
  })

  test('should upload novel and trigger parsing task', async ({ page }) => {
    await page.goto('/novels')

    const testContent = '第一章 开始\n\n张三走在漫长的古道上，夕阳将他的影子拉得很长。\n\n第二章 远方\n\n前方的路看不到尽头，但张三知道，他必须走下去。'

    await page.setInputFiles('.ant-upload input[type="file"]', {
      name: `test_novel_${Date.now()}.txt`,
      mimeType: 'text/plain',
      buffer: Buffer.from(testContent)
    })

    await page.waitForTimeout(5000)

    const rows = page.locator('.ant-table-row')
    const rowCount = await rows.count()
    expect(rowCount).toBeGreaterThan(0)

    await rows.first().locator('a:has-text("查看")').click()
    await page.waitForTimeout(2000)

    await expect(page).toHaveURL(/\/novels\/\w+/)

    const statusTag = page.locator('.ant-tag')
    const statusText = await statusTag.first().textContent()
    expect(['parsed', 'parsing', 'uploaded']).toContain(statusText)
  })

  test('should display parsing task in task history', async ({ page }) => {
    await page.goto('/tasks')

    await page.waitForTimeout(2000)

    await expect(page.locator('.ant-table')).toBeVisible()

    const statsCards = page.locator('.ant-statistic')
    expect(await statsCards.count()).toBeGreaterThanOrEqual(4)
  })

  test('should handle GBK-encoded novel upload', async ({ page }) => {
    await page.goto('/novels')

    const gbkContent = Buffer.from('第一章 开端\r\n\r\n这是一个关于勇气的故事。\r\n\r\n第二章 转折\r\n\r\n命运的车轮开始转动。', 'gbk')

    await page.setInputFiles('.ant-upload input[type="file"]', {
      name: `gbk_novel_${Date.now()}.txt`,
      mimeType: 'text/plain',
      buffer: gbkContent
    })

    await page.waitForTimeout(5000)

    const successMsg = page.locator('.ant-message-success')
    const isVisible = await successMsg.isVisible().catch(() => false)
    expect(isVisible).toBeTruthy()
  })
})

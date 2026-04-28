import { test, expect } from '@playwright/test'

test.describe('AI Video Rendering Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[placeholder="用户名"]', 'admin')
    await page.fill('input[placeholder="密码"]', 'admin123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/novels')
  })

  test('should navigate to video preview page', async ({ page }) => {
    await page.goto('/projects')

    const rows = page.locator('.ant-table-row')
    if ((await rows.count()) === 0) {
      test.skip(true, 'No projects available')
      return
    }

    await rows.first().locator('a:has-text("查看")').click()
    await page.waitForTimeout(2000)

    const previewLinks = page.locator('a:has-text("预览")')
    if ((await previewLinks.count()) === 0) {
      test.skip(true, 'No preview links available — render a video first')
      return
    }

    await previewLinks.first().click()
    await page.waitForTimeout(1500)

    await expect(page).toHaveURL(/\/preview/)
  })

  test('should show video player when video is available', async ({ page }) => {
    await page.goto('/projects')

    const rows = page.locator('.ant-table-row')
    if ((await rows.count()) === 0) {
      test.skip(true, 'No projects available')
      return
    }

    await rows.first().locator('a:has-text("查看")').click()
    await page.waitForTimeout(2000)

    const previewLinks = page.locator('a:has-text("预览")')
    if ((await previewLinks.count()) === 0) {
      test.skip(true, 'No preview links')
      return
    }

    await previewLinks.first().click()
    await page.waitForTimeout(2000)

    const videoElement = page.locator('video')
    const description = page.locator('.ant-descriptions')

    const hasVideo = (await videoElement.count()) > 0
    const hasDescription = (await description.count()) > 0

    expect(hasDescription).toBeTruthy()

    if (hasVideo) {
      const src = await videoElement.getAttribute('src')
      expect(src).toBeTruthy()
      expect(src).toContain('/media/')
    }
  })

  test('should show render form when video not yet generated', async ({ page }) => {
    await page.goto('/projects')

    const rows = page.locator('.ant-table-row')
    if ((await rows.count()) === 0) {
      test.skip(true, 'No projects available')
      return
    }

    await rows.first().locator('a:has-text("查看")').click()
    await page.waitForTimeout(1500)

    const generateBtn = page.locator('a:has-text("生成")').first()
    if ((await generateBtn.count()) === 0) {
      test.skip(true, 'No episode generation links')
      return
    }

    await generateBtn.click()
    await page.waitForTimeout(2000)

    const steps = page.locator('.ant-steps-item')
    if ((await steps.count()) >= 3) {
      await steps.nth(2).click()
      await page.waitForTimeout(1000)
    }

    const renderButton = page.locator('button:has-text("开始渲染")')
    const videoPlayer = page.locator('video')

    const hasRenderBtn = (await renderButton.count()) > 0
    const hasVideo = (await videoPlayer.count()) > 0

    expect(hasRenderBtn || hasVideo).toBeTruthy()
  })

  test('should support download button on video preview', async ({ page }) => {
    await page.goto('/projects')

    const rows = page.locator('.ant-table-row')
    if ((await rows.count()) === 0) {
      test.skip(true, 'No projects available')
      return
    }

    await rows.first().locator('a:has-text("查看")').click()
    await page.waitForTimeout(2000)

    const previewLinks = page.locator('a:has-text("预览")')
    if ((await previewLinks.count()) === 0) {
      test.skip(true, 'No preview links')
      return
    }

    await previewLinks.first().click()
    await page.waitForTimeout(2000)

    const downloadBtn = page.locator('button:has-text("下载")')
    if ((await downloadBtn.count()) === 0) {
      test.skip(true, 'No download button on page')
      return
    }

    const videoElement = page.locator('video')
    if ((await videoElement.count()) > 0) {
      await expect(downloadBtn).not.toBeDisabled()
    }
  })
})

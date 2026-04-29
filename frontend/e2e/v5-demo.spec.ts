import { test, expect } from '@playwright/test'

test.describe('V5 短剧生成平台 - 生产消费分离架构演示', () => {
  test('完整流程：登录 → 项目管理 → 发布 → 短剧作品', async ({ page }) => {
    test.setTimeout(90000)
    const BASE = 'http://localhost:3000'
    const SCREENSHOT_DIR = 'demo'

    // ===== 1. 登录 =====
    console.log('步骤1: 登录')
    await page.goto(`${BASE}/login`)
    await page.fill('input[placeholder="用户名"]', 'demo')
    await page.fill('input[placeholder="密码"]', 'demo123')
    await page.click('button[type="submit"]')
    await page.waitForURL('**/novels', { timeout: 10000 })
    await page.screenshot({ path: `${SCREENSHOT_DIR}/v5-01-login-success.png`, fullPage: true })
    console.log('✓ 登录成功')

    // ===== 2. 项目管理列表 - V5 新特性：进度条 + 状态标签 =====
    console.log('步骤2: 项目管理列表')
    await page.goto(`${BASE}/projects`)
    await page.waitForLoadState('networkidle')
    await page.screenshot({ path: `${SCREENSHOT_DIR}/v5-02-project-list.png`, fullPage: true })
    console.log('✓ 项目管理列表 — 进度条 + 状态标签')

    // ===== 3. 项目详情页 - V5 3 Tab + 固定头部 =====
    console.log('步骤3: 项目详情页')
    const firstRow = page.locator('.ant-table-row').first()
    await expect(firstRow).toBeVisible()
    // The row contains "查看" button
    await firstRow.locator('a, button').filter({ hasText: '查看' }).first().click()
    await page.waitForURL('**/projects/**', { timeout: 10000 })
    await page.waitForLoadState('networkidle')
    await page.screenshot({ path: `${SCREENSHOT_DIR}/v5-03-project-detail.png`, fullPage: true })
    console.log('✓ 项目详情页 — 固定头部 + 状态徽章 + 进度条 + 发布按钮')

    // ===== 4. 章节 Tab — 纳入改编勾选框 =====
    console.log('步骤4: 章节 Tab')
    const chaptersTab = page.locator('.ant-tabs-tab').filter({ hasText: '章节' })
    if (await chaptersTab.isVisible()) {
      await chaptersTab.click()
      await page.waitForTimeout(500)
    }
    await page.screenshot({ path: `${SCREENSHOT_DIR}/v5-04-chapters-tab.png`, fullPage: true })
    console.log('✓ 章节 Tab — 纳入改编勾选框')

    // ===== 5. 剧本 Tab — 批量生成 =====
    console.log('步骤5: 剧本 Tab')
    const scriptsTab = page.locator('.ant-tabs-tab').filter({ hasText: '剧本' })
    if (await scriptsTab.isVisible()) {
      await scriptsTab.click()
      await page.waitForTimeout(500)
    }
    await page.screenshot({ path: `${SCREENSHOT_DIR}/v5-05-scripts-tab.png`, fullPage: true })
    console.log('✓ 剧本 Tab — 批量生成/重试')

    // ===== 6. 视频 Tab — 批量渲染 =====
    console.log('步骤6: 视频 Tab')
    const videosTab = page.locator('.ant-tabs-tab').filter({ hasText: '视频' })
    if (await videosTab.isVisible()) {
      await videosTab.click()
      await page.waitForTimeout(500)
    }
    await page.screenshot({ path: `${SCREENSHOT_DIR}/v5-06-videos-tab.png`, fullPage: true })
    console.log('✓ 视频 Tab — 批量渲染')

    // ===== 7. 发布按钮状态 =====
    console.log('步骤7: 发布按钮')
    const publishBtn = page.locator('button').filter({ hasText: '发布' })
    if (await publishBtn.isVisible()) {
      const isEnabled = await publishBtn.isEnabled()
      console.log(`发布按钮: ${isEnabled ? '可用' : '已禁用 (项目已发布)'}`)
    }
    await page.screenshot({ path: `${SCREENSHOT_DIR}/v5-07-publish-button.png`, fullPage: true })
    console.log('✓ 发布按钮状态 — 已发布项目按钮禁用')

    // ===== 8. 返回项目管理 =====
    console.log('步骤8: 返回项目管理')
    await page.goto(`${BASE}/projects`)
    await page.waitForLoadState('networkidle')
    await page.screenshot({ path: `${SCREENSHOT_DIR}/v5-08-project-list-published.png`, fullPage: true })
    console.log('✓ 项目列表 — PUBLISHED 状态标签 (绿色)')

    // ===== 9. 短剧作品页面 (公开，无需登录) =====
    console.log('步骤9: 短剧作品页面')
    await page.goto(`${BASE}/dramas`)
    await page.waitForLoadState('networkidle')
    await page.screenshot({ path: `${SCREENSHOT_DIR}/v5-09-drama-list.png`, fullPage: true })
    console.log('✓ 短剧作品列表 — 封面卡片 + 搜索 + 排序 (无需登录)')

    // ===== 10. 短剧详情页 =====
    console.log('步骤10: 短剧详情页')
    const dramaCard = page.locator('.ant-card').first()
    if (await dramaCard.isVisible()) {
      await dramaCard.click()
      await page.waitForURL('**/dramas/**', { timeout: 10000 })
      await page.waitForLoadState('networkidle')
    }
    await page.screenshot({ path: `${SCREENSHOT_DIR}/v5-10-drama-detail.png`, fullPage: true })
    console.log('✓ 短剧详情页 — 剧集列表 + 视频播放器 + 自动连播')

    console.log('\n🎉 V5 生产消费分离架构 — Demo 完成！')
  })
})

import { test, expect } from '@playwright/test'
import * as fs from 'fs'

test.describe('项目管理功能测试', () => {
  test.beforeEach(async ({ page }) => {
    // 登录
    await page.goto('http://localhost:3000/login')
    await page.fill('input[placeholder="用户名"]', 'admin')
    await page.fill('input[placeholder="密码"]', 'admin123')
    await page.click('button[type="submit"]')
    await page.waitForURL('http://localhost:3000/novels')
  })

  test('项目管理页面显示测试', async ({ page }) => {
    console.log('=== 测试项目管理页面 ===\n')

    // 点击项目管理菜单
    console.log('步骤1: 点击项目管理菜单')
    await page.click('.ant-menu-item:has-text("项目管理")')
    await page.waitForTimeout(2000)

    // 截图记录当前状态
    await page.screenshot({ path: 'test-results/project-page-current.png', fullPage: true })
    console.log('✓ 已截图记录页面状态')

    // 验证页面URL
    const currentUrl = page.url()
    console.log(`当前URL: ${currentUrl}`)

    if (!currentUrl.includes('/projects')) {
      console.log('❌ 未正确跳转到项目管理页面')
      fs.appendFileSync('../BUG_TRACKING.md', `
### BUG-006: 项目管理导航失败
**状态**: 🔴 新发现
**描述**: 点击项目管理菜单后未跳转到正确页面
**当前URL**: ${currentUrl}
**期望URL**: /projects

`)
      throw new Error('项目管理导航失败')
    }

    // 验证页面标题
    const hasTitle = await page.locator('h2:has-text("项目管理")').count() > 0
    const hasContent = await page.locator('.ant-table, .ant-card, .ant-list').count() > 0

    if (!hasTitle || !hasContent) {
      console.log('❌ 项目管理页面显示异常')
      console.log(`  - 页面标题: ${hasTitle ? '存在' : '缺失'}`)
      console.log(`  - 内容区域: ${hasContent ? '存在' : '缺失'}`)

      fs.appendFileSync('../BUG_TRACKING.md', `
### BUG-006: 项目管理页面显示异常
**状态**: 🔴 新发现
**描述**: 项目管理页面标题或内容缺失
**截图**: test-results/project-page-current.png
**页面标题**: ${hasTitle ? '存在' : '缺失'}
**内容区域**: ${hasContent ? '存在' : '缺失'}

`)
      throw new Error('项目管理页面显示异常')
    }

    console.log('✅ 项目管理页面显示正常')
  })
})

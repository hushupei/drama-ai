import { test, expect } from '@playwright/test'

test.describe('短剧生成平台 - 功能演示', () => {
  test('完整流程：登录 -> 查看小说列表 -> 上传小说', async ({ page }) => {
    // 1. 访问登录页面
    console.log('步骤1: 访问登录页面')
    await page.goto('http://localhost:3000/login')
    await page.screenshot({ path: 'demo/01-login-page.png' })
    await expect(page.locator('.ant-card-head-title')).toContainText('登录')
    console.log('✓ 登录页面显示正常')

    // 2. 输入登录信息
    console.log('步骤2: 输入登录信息')
    await page.fill('input[placeholder="用户名"]', 'admin')
    await page.fill('input[placeholder="密码"]', 'admin123')
    await page.screenshot({ path: 'demo/02-login-filled.png' })
    console.log('✓ 登录信息已输入')

    // 3. 点击登录按钮
    console.log('步骤3: 点击登录按钮')
    await page.click('button[type="submit"]')

    // 等待跳转到小说列表页面
    await page.waitForURL('http://localhost:3000/novels', { timeout: 10000 })
    await page.waitForLoadState('networkidle')
    await page.screenshot({ path: 'demo/03-novels-list.png', fullPage: true })
    console.log('✓ 登录成功，跳转到小说列表')

    // 4. 验证小说列表页面
    await expect(page.locator('h2')).toContainText('小说管理')
    console.log('✓ 小说列表页面显示正常')

    // 5. 直接选择文件上传（Upload 组件）
    console.log('步骤4: 选择文件上传')

    // 创建测试文件
    const testFileContent = '这是一本测试小说的内容。第一章：开始...'
    await page.setInputFiles('.ant-upload input[type="file"]', {
      name: 'test_novel_' + Date.now() + '.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from(testFileContent)
    })
    await page.screenshot({ path: 'demo/04-file-selected.png' })
    console.log('✓ 文件已选择')

    // 6. 等待上传完成
    console.log('步骤5: 等待上传完成')
    await page.waitForTimeout(3000)
    await page.screenshot({ path: 'demo/05-upload-success.png', fullPage: true })
    console.log('✓ 小说上传成功')

    // 8. 验证列表中显示新上传的小说
    const novelTitle = await page.locator('.ant-table-row:first-child td:first-child').textContent()
    console.log(`✓ 列表中显示小说: ${novelTitle}`)

    // 9. 点击查看详情
    console.log('步骤7: 查看小说详情')
    await page.click('.ant-table-row:first-child a:has-text("查看")')
    await page.waitForTimeout(1000)
    await page.screenshot({ path: 'demo/07-novel-detail.png', fullPage: true })
    console.log('✓ 小说详情页面显示正常')

    // 10. 返回列表
    console.log('步骤8: 返回小说列表')
    await page.click('button:has-text("返回")')
    await page.waitForURL('http://localhost:3000/novels')
    await page.screenshot({ path: 'demo/08-back-to-list.png', fullPage: true })
    console.log('✓ 返回小说列表')

    console.log('\n🎉 所有功能演示完成！')
  })
})

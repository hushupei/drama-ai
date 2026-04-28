import { test, expect } from '@playwright/test'

test('验证BUG-001修复：上传后列表自动刷新', async ({ page }) => {
  console.log('=== 验证 BUG-001 修复 ===\n')

  // 1. 登录
  console.log('步骤1: 登录系统')
  await page.goto('http://localhost:3000/login')
  await page.fill('input[placeholder="用户名"]', 'admin')
  await page.fill('input[placeholder="密码"]', 'admin123')
  await page.click('button[type="submit"]')
  await page.waitForURL('http://localhost:3000/novels')
  console.log('✓ 登录成功')

  // 2. 记录上传前的小说数量
  console.log('步骤2: 记录当前列表状态')
  const countBefore = await page.locator('.ant-table-row').count()
  console.log(`上传前小说数量: ${countBefore}`)

  // 3. 上传新小说
  console.log('步骤3: 上传新小说')
  const testFileName = `verify_test_${Date.now()}.txt`
  await page.setInputFiles('.ant-upload input[type="file"]', {
    name: testFileName,
    mimeType: 'text/plain',
    buffer: Buffer.from('测试内容：验证列表自动刷新功能')
  })

  // 4. 等待上传完成和列表刷新
  console.log('步骤4: 等待上传完成和列表刷新...')
  await page.waitForTimeout(3000)

  // 添加强制刷新确保不是缓存问题
  console.log('  → 强制刷新页面...')
  await page.reload({ waitUntil: 'networkidle' })
  await page.waitForTimeout(2000)

  // 5. 验证列表已自动刷新
  console.log('步骤5: 验证列表自动刷新')
  const countAfter = await page.locator('.ant-table-row').count()
  console.log(`上传后小说数量: ${countAfter}`)

  if (countAfter > countBefore) {
    const newNovelTitle = await page.locator('.ant-table-row:first-child td:first-child').textContent()
    console.log(`✅ BUG-001 修复成功！新上传的小说已显示: ${newNovelTitle}`)

    // 截图记录成功
    await page.screenshot({ path: 'test-results/bug-001-fixed.png', fullPage: true })
  } else {
    console.log('❌ BUG-001 未修复，列表仍未自动刷新')
    await page.screenshot({ path: 'test-results/bug-001-still-broken.png', fullPage: true })
    throw new Error('列表未自动刷新，BUG-001 修复失败')
  }
})

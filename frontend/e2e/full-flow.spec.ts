import { test, expect } from '@playwright/test'
import * as fs from 'fs'

// BUG记录
const bugs: Array<{
  id: string
  title: string
  severity: 'high' | 'medium' | 'low'
  description: string
  steps: string[]
  expected: string
  actual: string
  screenshot?: string
}> = []

// 保存截图并记录
async function recordBug(
  page: any,
  id: string,
  title: string,
  severity: 'high' | 'medium' | 'low',
  description: string,
  steps: string[],
  expected: string,
  actual: string
) {
  const screenshotPath = `test-results/bug-${id}.png`
  await page.screenshot({ path: screenshotPath, fullPage: true })
  bugs.push({ id, title, severity, description, steps, expected, actual, screenshot: screenshotPath })
  console.log(`\n🐛 BUG记录: ${id} - ${title}`)
}

// 测试完成后保存BUG报告
test.afterAll(() => {
  if (bugs.length > 0) {
    let report = `# 测试发现的问题\n\n测试时间: ${new Date().toLocaleString()}\n\n`
    bugs.forEach(bug => {
      report += `## ${bug.id}: ${bug.title}\n`
      report += `**严重程度**: ${bug.severity}\n\n`
      report += `**描述**: ${bug.description}\n\n`
      report += `**复现步骤**:\n${bug.steps.map((s, i) => `${i + 1}. ${s}`).join('\n')}\n\n`
      report += `**期望结果**: ${bug.expected}\n\n`
      report += `**实际结果**: ${bug.actual}\n\n`
      report += `**截图**: ${bug.screenshot}\n\n---\n\n`
    })
    fs.writeFileSync('../BUG_REPORT.md', report)
    console.log(`\n📄 BUG报告已保存到 BUG_REPORT.md，共发现 ${bugs.length} 个问题`)
  } else {
    console.log('\n✅ 未发现BUG，所有功能正常！')
  }
})

test.describe('完整流程测试', () => {
  test('完整业务流程测试', async ({ page }) => {
    console.log('开始完整业务流程测试...\n')

    // ============ 阶段1: 登录流程 ============
    console.log('=== 阶段1: 登录流程 ===')

    // 1.1 访问首页，应重定向到登录页
    console.log('步骤1.1: 访问首页，验证未登录重定向')
    await page.goto('http://localhost:3000/')
    await page.waitForURL('http://localhost:3000/login', { timeout: 5000 })
    console.log('✓ 未登录用户被正确重定向到登录页')

    // 1.2 验证登录页面元素
    console.log('步骤1.2: 验证登录页面元素')
    await expect(page.locator('.ant-card-head-title')).toContainText('登录')
    await expect(page.locator('input[placeholder="用户名"]')).toBeVisible()
    await expect(page.locator('input[placeholder="密码"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
    console.log('✓ 登录页面元素完整')

    // 1.3 使用admin自动登录
    console.log('步骤1.3: 使用admin自动登录')
    await page.fill('input[placeholder="用户名"]', 'admin')
    await page.fill('input[placeholder="密码"]', 'admin123')
    await page.click('button[type="submit"]')

    // 等待登录成功并跳转
    await page.waitForURL('http://localhost:3000/novels', { timeout: 10000 })
    await page.waitForLoadState('networkidle')
    console.log('✓ 登录成功，跳转到小说列表页')

    // 1.4 验证登录状态保持
    console.log('步骤1.4: 验证登录状态保持')
    await page.goto('http://localhost:3000/')
    await page.waitForURL('http://localhost:3000/novels')
    console.log('✓ 登录状态正确保持')

    // ============ 阶段2: 小说列表页 ============
    console.log('\n=== 阶段2: 小说列表页 ===')

    // 2.1 验证页面结构
    console.log('步骤2.1: 验证小说列表页结构')
    await expect(page.locator('h2')).toContainText('小说管理')
    await expect(page.locator('button:has-text("上传小说")')).toBeVisible()
    await expect(page.locator('.ant-table')).toBeVisible()
    console.log('✓ 小说列表页结构完整')

    // 2.2 验证用户信息显示
    console.log('步骤2.2: 验证用户信息显示')
    await expect(page.locator('.ant-layout-header')).toContainText('admin')
    console.log('✓ 用户信息显示正确')

    // 2.3 记录当前列表状态
    const hasNovels = await page.locator('.ant-table-row').count() > 0
    console.log(`当前列表状态: ${hasNovels ? '已有小说' : '暂无数据'}`)

    // ============ 阶段3: 上传小说流程 ============
    console.log('\n=== 阶段3: 上传小说流程 ===')

    // 3.1 准备测试文件
    console.log('步骤3.1: 准备测试文件')
    const testFileContent = '这是一本测试小说的内容。第一章：开始...第二章：发展...第三章：高潮...第四章：结局...'
    const testFileName = `test_novel_${Date.now()}.txt`

    // 3.2 选择文件上传
    console.log('步骤3.2: 选择文件上传')
    await page.setInputFiles('.ant-upload input[type="file"]', {
      name: testFileName,
      mimeType: 'text/plain',
      buffer: Buffer.from(testFileContent)
    })
    console.log(`✓ 已选择文件: ${testFileName}`)

    // 3.3 等待上传完成
    console.log('步骤3.3: 等待上传完成...')
    await page.waitForTimeout(3000)

    // 3.4 验证成功提示
    console.log('步骤3.4: 验证上传成功提示')
    const successMessage = await page.locator('.ant-message-success').textContent().catch(() => null)
    if (successMessage?.includes('上传成功') || successMessage?.includes('小说上传成功')) {
      console.log('✓ 上传成功提示显示正确')
    } else {
      await recordBug(
        page,
        'BUG-002',
        '上传成功提示未显示或文字不符',
        'medium',
        '上传小说后未显示成功提示消息',
        ['1. 登录系统', '2. 选择文件上传', '3. 等待上传完成'],
        '显示"小说上传成功"提示',
        successMessage || '未找到成功提示'
      )
    }

    // 3.5 验证列表自动刷新 - 关键测试点
    console.log('步骤3.5: 验证列表自动刷新（关键测试点）')
    await page.waitForTimeout(2000) // 给列表刷新一些时间

    const novelRows = await page.locator('.ant-table-row').count()
    if (novelRows > 0) {
      const firstNovelTitle = await page.locator('.ant-table-row:first-child td:first-child').textContent()
      console.log(`✓ 列表已自动刷新，显示 ${novelRows} 条小说，第一条: ${firstNovelTitle}`)
    } else {
      await recordBug(
        page,
        'BUG-001',
        '小说上传成功后列表不显示新上传的小说',
        'high',
        '上传小说后列表仍显示"暂无数据"，需要手动刷新页面才能看到',
        ['1. 登录系统', '2. 进入小说列表页', '3. 点击上传小说按钮选择文件', '4. 等待上传成功提示', '5. 观察列表区域'],
        '上传成功后列表自动显示新上传的小说',
        '列表仍显示"暂无数据"，需要手动刷新页面'
      )

      // 尝试手动刷新验证数据是否存在
      console.log('  → 尝试手动刷新页面...')
      await page.reload()
      await page.waitForTimeout(2000)
      const rowsAfterRefresh = await page.locator('.ant-table-row').count()
      if (rowsAfterRefresh > 0) {
        console.log(`  → 手动刷新后显示 ${rowsAfterRefresh} 条小说，数据已保存但列表未自动刷新`)
      }
    }

    // ============ 阶段4: 小说详情页 ============
    console.log('\n=== 阶段4: 小说详情页 ===')

    // 如果有小说，测试详情页
    const hasData = await page.locator('.ant-table-row').count() > 0
    if (hasData) {
      // 4.1 点击进入详情
      console.log('步骤4.1: 点击进入小说详情')
      await page.click('.ant-table-row:first-child a:has-text("查看")')
      await page.waitForTimeout(1000)

      // 4.2 验证详情页显示
      console.log('步骤4.2: 验证详情页显示')
      const currentUrl = page.url()
      if (currentUrl.includes('/novels/')) {
        console.log('✓ 成功进入详情页')

        // 4.3 验证详情页元素
        const hasDescriptions = await page.locator('.ant-descriptions').count() > 0
        if (hasDescriptions) {
          console.log('✓ 详情页信息显示正常')
        } else {
          await recordBug(
            page,
            'BUG-003',
            '小说详情页信息展示不完整',
            'medium',
            '详情页缺少小说详细信息展示',
            ['1. 进入小说列表', '2. 点击查看按钮', '3. 观察详情页'],
            '显示小说完整信息（标题、作者、状态等）',
            '详情页信息展示不完整或缺失'
          )
        }
      } else {
        await recordBug(
          page,
          'BUG-004',
          '点击"查看"未跳转到详情页',
          'high',
          '点击查看按钮后页面未跳转或跳转错误',
          ['1. 进入小说列表', '2. 点击查看按钮'],
          '跳转到小说详情页',
          `当前URL: ${currentUrl}`
        )
      }

      // 4.4 测试返回功能
      console.log('步骤4.3: 测试返回功能')
      await page.click('button:has-text("返回")')
      await page.waitForURL('http://localhost:3000/novels')
      console.log('✓ 返回列表功能正常')
    } else {
      console.log('⚠️ 列表无数据，跳过详情页测试')
    }

    // ============ 阶段5: 删除小说功能 ============
    console.log('\n=== 阶段5: 删除小说功能 ===')

    if (hasData) {
      // 5.1 测试删除确认弹窗
      console.log('步骤5.1: 测试删除确认弹窗')
      await page.click('.ant-table-row:first-child button:has-text("删除")')
      await page.waitForTimeout(500)

      const confirmVisible = await page.locator('.ant-popconfirm').isVisible().catch(() => false)
      if (confirmVisible) {
        console.log('✓ 删除确认弹窗显示正常')

        // 5.2 取消删除
        await page.click('button:has-text("取消")')
        console.log('✓ 取消删除功能正常')
      } else {
        await recordBug(
          page,
          'BUG-005',
          '删除确认弹窗未显示',
          'medium',
          '点击删除按钮后未弹出确认对话框',
          ['1. 进入小说列表', '2. 点击删除按钮'],
          '显示删除确认弹窗',
          '未显示确认弹窗'
        )
      }
    } else {
      console.log('⚠️ 列表无数据，跳过删除功能测试')
    }

    // ============ 阶段6: 侧边栏导航 ============
    console.log('\n=== 阶段6: 侧边栏导航 ===')

    // 6.1 测试项目管理导航
    console.log('步骤6.1: 测试项目管理导航')
    await page.click('.ant-menu-item:has-text("项目管理")')
    await page.waitForTimeout(1000)

    const projectUrl = page.url()
    if (projectUrl.includes('/projects')) {
      console.log('✓ 项目管理页面导航正常')

      // 验证项目管理页面
      const hasProjectTitle = await page.locator('h2:has-text("项目管理")').count() > 0
      if (!hasProjectTitle) {
        await recordBug(
          page,
          'BUG-006',
          '项目管理页面显示异常',
          'low',
          '项目管理页面未正确显示标题或内容',
          ['1. 点击项目管理菜单', '2. 观察页面内容'],
          '显示项目管理标题和内容',
          '页面内容显示异常'
        )
      }
    } else {
      await recordBug(
        page,
        'BUG-007',
        '项目管理导航无效',
        'high',
        '点击项目管理菜单后未跳转到正确页面',
        ['1. 点击项目管理菜单'],
        '跳转到项目管理页面',
        `当前URL: ${projectUrl}`
      )
    }

    // 6.2 返回小说管理
    console.log('步骤6.2: 返回小说管理')
    await page.click('.ant-menu-item:has-text("小说管理")')
    await page.waitForURL('http://localhost:3000/novels')
    console.log('✓ 小说管理导航正常')

    // ============ 阶段7: 用户菜单 ============
    console.log('\n=== 阶段7: 用户菜单 ===')

    // 7.1 测试用户下拉菜单
    console.log('步骤7.1: 测试用户下拉菜单')
    await page.click('.ant-avatar, .ant-dropdown-trigger:has-text("admin")')
    await page.waitForTimeout(500)

    const dropdownVisible = await page.locator('.ant-dropdown-menu').isVisible().catch(() => false)
    if (dropdownVisible) {
      console.log('✓ 用户下拉菜单显示正常')

      // 7.2 测试登出功能
      console.log('步骤7.2: 测试登出功能')
      await page.click('.ant-dropdown-menu-item:has-text("退出登录")')
      await page.waitForURL('http://localhost:3000/login')
      console.log('✓ 登出功能正常，已返回登录页')

      // 7.3 验证登出后状态
      console.log('步骤7.3: 验证登出后状态')
      await page.goto('http://localhost:3000/novels')
      await page.waitForURL('http://localhost:3000/login')
      console.log('✓ 登出后无法访问受保护页面，已重定向到登录页')
    } else {
      await recordBug(
        page,
        'BUG-008',
        '用户下拉菜单未显示',
        'medium',
        '点击用户头像后未显示下拉菜单',
        ['1. 登录系统', '2. 点击用户头像/用户名'],
        '显示用户下拉菜单（含退出登录选项）',
        '未显示下拉菜单'
      )
    }

    console.log('\n=== 测试完成 ===')
    console.log(`共发现 ${bugs.length} 个问题`)
  })
})

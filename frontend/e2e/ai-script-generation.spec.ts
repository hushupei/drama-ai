import { test, expect } from '@playwright/test'

test.describe('AI Script Generation Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[placeholder="用户名"]', 'admin')
    await page.fill('input[placeholder="密码"]', 'admin123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/novels')
  })

  test('should navigate to episode generate page', async ({ page }) => {
    await page.goto('/projects')

    const rows = page.locator('.ant-table-row')
    const rowCount = await rows.count()
    if (rowCount === 0) {
      test.skip(true, 'No projects available for script generation test')
      return
    }

    await rows.first().locator('a:has-text("查看")').click()
    await page.waitForTimeout(2000)

    await expect(page).toHaveURL(/\/projects\/\w+/)
  })

  test('should show generate script form with chapters and settings', async ({ page }) => {
    await page.goto('/projects')

    const rows = page.locator('.ant-table-row')
    if ((await rows.count()) === 0) {
      test.skip(true, 'No projects available — upload a novel and create a project first')
      return
    }

    await rows.first().locator('a:has-text("查看")').click()
    await page.waitForTimeout(1500)

    const generateBtn = page.locator('a:has-text("生成")').first()
    if (await generateBtn.count() === 0) {
      test.skip(true, 'No generate button found for any episode')
      return
    }

    await generateBtn.click()
    await page.waitForTimeout(2000)

    await expect(page).toHaveURL(/\/generate/)

    const chapterSelect = page.locator('.ant-select').first()
    await expect(chapterSelect).toBeVisible()

    const styleSelects = page.locator('.ant-select')
    expect(await styleSelects.count()).toBeGreaterThanOrEqual(2)

    const submitBtn = page.locator('button:has-text("生成剧本")')
    await expect(submitBtn).toBeVisible()
  })

  test('should submit script generation task and poll for completion', async ({ page }) => {
    await page.goto('/projects')

    const rows = page.locator('.ant-table-row')
    if ((await rows.count()) === 0) {
      test.skip(true, 'No projects available')
      return
    }

    await rows.first().locator('a:has-text("查看")').click()
    await page.waitForTimeout(1500)

    const generateBtn = page.locator('a:has-text("生成")').first()
    if (await generateBtn.count() === 0) {
      test.skip(true, 'No generate button found')
      return
    }

    await generateBtn.click()
    await page.waitForTimeout(2000)

    const chapterSelect = page.locator('.ant-select').first()
    await chapterSelect.click()
    await page.waitForTimeout(500)

    const firstOption = page.locator('.ant-select-dropdown .ant-select-item').first()
    if (await firstOption.count() > 0) {
      await firstOption.click()
      await page.waitForTimeout(500)
    }

    const submitBtn = page.locator('button:has-text("生成剧本")')
    const isDisabled = await submitBtn.isDisabled()
    expect(isDisabled).toBeFalsy()

    await submitBtn.click()

    const successMsg = page.locator('.ant-message-success')
    await expect(successMsg).toBeVisible({ timeout: 10000 })

    const generatingSpinner = page.locator('.ant-spin')
    const hasSpinner = await generatingSpinner.isVisible().catch(() => false)
    if (hasSpinner) {
      await page.waitForTimeout(30000)

      const stepTwo = page.locator('.ant-steps-item-active')
      const activeStepText = await stepTwo.textContent()
      expect(activeStepText).toContain('查看')
    }
  })

  test('should verify task appears in task history after submission', async ({ page }) => {
    await page.goto('/tasks')

    await page.waitForTimeout(2000)

    const filterSelect = page.locator('.ant-select').first()
    await filterSelect.click()
    await page.waitForTimeout(500)

    const generateOption = page.locator('.ant-select-dropdown .ant-select-item')
      .filter({ hasText: '生成剧本' })
    if (await generateOption.count() > 0) {
      await generateOption.click()
      await page.waitForTimeout(1000)

      const tableRows = page.locator('.ant-table-row')
      const count = await tableRows.count()

      if (count > 0) {
        const firstTaskName = await tableRows.first()
          .locator('td').nth(1).textContent()
        expect(firstTaskName).toContain('生成')
      }
    }
  })
})

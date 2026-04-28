import { chromium } from 'playwright';
import path from 'path';

const BASE_URL = 'http://localhost:3000';
const V3_DIR = path.resolve(__dirname);

async function main() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    locale: 'zh-CN',
    recordVideo: {
      dir: V3_DIR,
      size: { width: 1440, height: 900 },
    },
  });

  const page = await context.newPage();

  try {
    // 1. Login
    console.log('1. Logging in...');
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    await page.fill('input[placeholder="用户名"]', 'admin');
    await page.fill('input[placeholder="密码"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    // Check if we landed on novels page or got an error
    const currentUrl = page.url();
    console.log('   Current URL:', currentUrl);
    if (currentUrl.includes('login')) {
      const errorMsg = await page.locator('.ant-message-error').textContent().catch(() => '');
      console.log('   Login error message:', errorMsg);
      // Try with different credentials
      await page.fill('input[placeholder="用户名"]', 'testuser');
      await page.fill('input[placeholder="密码"]', 'test123');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(3000);
    }
    console.log('   Login step completed, URL:', page.url());

    // 2. Novel list page — show display_id
    console.log('2. Novel list page...');
    await page.waitForSelector('.ant-table', { timeout: 10000 });
    await page.waitForTimeout(1000);
    console.log('   Novel list loaded');

    // 3. Novel detail page
    console.log('3. Novel detail page...');
    const firstNovelLink = page.locator('.ant-table-row a').first();
    if (await firstNovelLink.isVisible()) {
      await firstNovelLink.click();
      await page.waitForTimeout(2000);
      console.log('   Novel detail loaded');
    }

    // 4. Navigate to task history
    console.log('4. Task history page...');
    await page.goto(`${BASE_URL}/tasks/history`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    await page.waitForSelector('.ant-table', { timeout: 10000 }).catch(() => {});
    console.log('   Task history loaded');

    // 5. Show type filter
    console.log('5. Testing type filter...');
    const typeSelect = page.locator('.ant-select').first();
    if (await typeSelect.isVisible()) {
      await typeSelect.click();
      await page.waitForTimeout(500);
      await page.locator('.ant-select-item-option').filter({ hasText: '解析小说' }).click();
      await page.waitForTimeout(1500);
      console.log('   Type filter applied: 解析小说');
    }

    // Reset filter
    await typeSelect.click();
    await page.waitForTimeout(300);
    await page.locator('.ant-select-item-option').filter({ hasText: '全部类型' }).first().click();
    await page.waitForTimeout(1000);

    // 6. Show status filter
    console.log('6. Testing status filter...');
    const statusSelect = page.locator('.ant-select').nth(1);
    if (await statusSelect.isVisible()) {
      await statusSelect.click();
      await page.waitForTimeout(300);
      await page.locator('.ant-select-item-option').filter({ hasText: '失败' }).click();
      await page.waitForTimeout(1000);
      console.log('   Status filter applied: 失败');
    }

    // Reset
    await statusSelect.click();
    await page.waitForTimeout(300);
    await page.locator('.ant-select-item-option').filter({ hasText: '全部状态' }).first().click();
    await page.waitForTimeout(1000);

    // 7. Show sorting by start time
    console.log('7. Testing sort by start time...');
    const timeHeader = page.locator('.ant-table-column-title').filter({ hasText: '开始时间' });
    if (await timeHeader.isVisible()) {
      await timeHeader.click();
      await page.waitForTimeout(1000);
      console.log('   Sorted by start time');
    }

    // 8. Expand error detail
    console.log('8. Expanding error detail...');
    const expandLink = page.locator('text=展开').first();
    if (await expandLink.isVisible()) {
      await expandLink.click();
      await page.waitForTimeout(1000);
      console.log('   Error detail expanded');
    }

    // 9. Test system tasks filter
    console.log('9. Testing type filter: system tasks...');
    await typeSelect.click();
    await page.waitForTimeout(300);
    await page.locator('.ant-select-item-option').filter({ hasText: '清理日志' }).click();
    await page.waitForTimeout(1000);
    console.log('   System tasks filtered');

    // 10. Back to all tasks
    await typeSelect.click();
    await page.waitForTimeout(300);
    await page.locator('.ant-select-item-option').filter({ hasText: '全部类型' }).first().click();
    await page.waitForTimeout(1500);

    // 11. Show statistics cards
    console.log('10. Showing statistics and running tasks...');
    await page.waitForTimeout(2000);

    console.log('\nDemo recording completed!');

  } catch (error) {
    console.error('Demo recording error:', error);
  } finally {
    await page.waitForTimeout(1000);
    await context.close();
    await browser.close();
    console.log('Browser closed. Video saved to V3/ directory.');
  }
}

main();

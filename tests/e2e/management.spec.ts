import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

test('R11–R15 import the full story, advance choices and replay a selected version without randomUUID', async ({ page }, testInfo) => {
  // HTTP LAN browsers expose getRandomValues but do not expose randomUUID.
  await page.addInitScript(() => Object.defineProperty(crypto, 'randomUUID', { value: undefined, configurable: true }));
  await page.goto('/');
  await page.getByRole('button', { name: /新建空白故事/ }).click();
  await expect(page.getByLabel('Ink 剧本')).toHaveValue(/-> END/);
  await expect(page.getByLabel('角色 1 名称')).toHaveCount(0);
  const source = readFileSync(resolve('content/stories/erha-youfu/story.ink'), 'utf8');
  await page.getByLabel('导入 Ink 文件').setInputFiles({ name: '二哈有福.ink', mimeType: 'text/plain', buffer: Buffer.from(source) });
  await expect(page.getByLabel('剧本名称')).toHaveValue('二哈有福');
  await expect(page.getByLabel('Ink 剧本')).toHaveValue(source);
  await page.getByRole('button', { name: /添加角色/ }).click();
  await page.getByLabel('角色 1 标识').fill('narrator');
  await page.getByLabel('角色 1 名称').fill('旁白');
  await page.getByRole('button', { name: '保存并发布' }).click();
  await expect(page.getByText('版本 v1 已发布。可以前往对话模拟器开始验证。')).toBeVisible();
  await page.getByRole('button', { name: '从 v1 开始模拟' }).click();
  for (const choice of ['沉默不语', '立界，硬挡这一击', '把旧校徽交给何敏', '接受道歉，要求以后停手']) {
    await page.getByRole('button', { name: new RegExp(choice) }).click();
  }
  await expect(page.getByRole('button', { name: /先查李家的名字/ })).toBeVisible();
  await page.reload();
  await page.getByRole('tab', { name: '02 对话模拟器' }).click();
  await expect(page.getByRole('button', { name: /先查李家的名字/ })).toBeVisible();
  await page.getByRole('tab', { name: '01 剧本工作室' }).click();
  await page.getByLabel('Ink 剧本').fill('新版测试结局\n-> END');
  await page.getByRole('button', { name: '保存并发布' }).click();
  await expect(page.getByRole('button', { name: '从 v2 开始模拟' })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('management-desktop.png'), fullPage: true });
  await page.getByRole('button', { name: '从 v1 开始模拟' }).click();
  await expect(page.getByText('固定版本 v1')).toBeVisible();
  await expect(page.getByRole('button', { name: /沉默不语/ })).toBeVisible();
  await expect(page.getByText('新版测试结局', { exact: true })).toHaveCount(0);
  await page.getByRole('tab', { name: '01 剧本工作室' }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('management-mobile.png'), fullPage: true });
  await page.getByRole('button', { name: '从 v2 开始模拟' }).click();
  await expect(page.getByText('新版测试结局', { exact: true })).toBeVisible();
});

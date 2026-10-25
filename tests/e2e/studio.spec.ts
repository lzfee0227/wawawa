import { expect, test } from '@playwright/test';

test('R01–R09 author, publish, compare branches and restore pinned sessions', async ({ page }, testInfo) => {
  await page.goto('/');
  await page.getByRole('button', { name: '＋ 新建示例故事' }).click();
  const title = `雨夜验收 ${Date.now()}`;
  await page.getByLabel('剧本名称').fill(title);
  await page.getByRole('button', { name: '编译检查', exact: true }).click();
  await expect(page.getByText('编译通过', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: '保存并发布' }).click();
  await expect(page.getByText('版本 v1 已发布。可以前往对话模拟器开始验证。')).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('desktop-author.png'), fullPage: true });
  await page.getByRole('tab', { name: '02 对话模拟器' }).click();
  await page.getByRole('button', { name: '开始模拟', exact: true }).click();
  await expect(page.getByText('模拟模式 · 可试听台词或录入语音，识别文字经确认提交后才推进剧情。')).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('desktop-simulator.png'), fullPage: true });
  await page.getByLabel('语音识别后的文字').fill('第一个');
  await page.getByRole('button', { name: '提交选择', exact: true }).click();
  await expect(page.getByRole('button', { name: /把伞借给她/ })).toBeVisible();
  await page.reload();
  await page.getByRole('tab', { name: '02 对话模拟器' }).click();
  await expect(page.getByRole('button', { name: /把伞借给她/ })).toBeVisible();
  await page.getByRole('button', { name: /把伞借给她/ }).click();
  await expect(page.getByRole('button', { name: /提起保密的约定/ })).toBeVisible();
  await page.getByLabel('语音识别后的文字').fill('飞向月球');
  await page.getByRole('button', { name: '提交选择', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('请说当前选项');
  await expect(page.getByRole('button', { name: /请求她留下/ })).toBeVisible();

  // A new publication must not change the active session's pinned version.
  await page.getByRole('tab', { name: '01 剧本工作室' }).click();
  const source = await page.getByLabel('Ink 剧本').inputValue();
  await page.getByLabel('Ink 剧本').fill(source.replace('雨敲打着末班车站。', '新版开场：雨停了。').replace('结局：雨后的约定。', '结局：新版的约定。'));
  await page.getByRole('button', { name: '保存并发布' }).click();
  await expect(page.getByText('版本 v2 已发布。可以前往对话模拟器开始验证。')).toBeVisible();
  await page.getByRole('tab', { name: '02 对话模拟器' }).click();
  await expect(page.getByText('固定版本 v1')).toBeVisible();
  await page.getByRole('button', { name: /请求她留下/ }).click();
  await expect(page.getByText('结局：雨后的约定。', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: '重新开始', exact: true }).click();
  await expect(page.getByText('固定版本 v2')).toBeVisible();
  await expect(page.getByText('新版开场：雨停了。林小姐递给你一封没有署名的信。', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: /拒绝保密/ }).click();
  await page.getByRole('button', { name: /提醒她等雨停/ }).click();
  await expect(page.getByRole('button', { name: /提起保密的约定/ })).toHaveCount(0);
  await page.getByRole('button', { name: /请求她留下/ }).click();
  await expect(page.getByText('结局：未寄出的信。', { exact: true })).toBeVisible();
});

test('R02/R09 compile failure, keyboard controls and narrow layout', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.getByRole('button', { name: '＋ 新建示例故事' }).click();
  const editor = page.getByLabel('Ink 剧本');
  await editor.fill('-> missing_target');
  const compile = page.getByRole('button', { name: '编译检查', exact: true });
  await compile.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByText('编译失败，尚未发布', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: '保存并发布' }).click();
  await expect(page.getByRole('alert')).toBeVisible();
  await expect(page.getByText('还没有发布版本。')).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  expect(overflow).toBe(false);
  await page.screenshot({ path: testInfo.outputPath('mobile-author.png'), fullPage: true });
});

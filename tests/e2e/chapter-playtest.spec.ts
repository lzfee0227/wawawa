import { expect, test } from '@playwright/test';

const preset = { id: 'chapter2', chapter: '第二章', label: '保守秘密', description: '作者预设：已答应保密，好感度为 2。', path: 'test_chapter2' };
const source = `// @playtest ${JSON.stringify(preset)}
VAR trust = 0
第一章开场
+ [答应保密]
    ~ trust = 2
    -> chapter2
=== chapter2 ===
第二章开场，好感度 {trust}
+ {trust == 2} [兑现承诺]
    第二章结束
    -> END
=== test_chapter2 ===
~ trust = 2
-> chapter2
`;

test('CP01–CP05 chapter playtest preserves normal progress, pins version and restores independently', async ({ page }, testInfo) => {
  await page.goto('/');
  await page.getByRole('button', { name: /新建空白故事/ }).click();
  await page.getByLabel('剧本名称').fill(`章节试跑验收 ${Date.now()}`);
  await page.getByLabel('Ink 剧本').fill(source);
  await page.getByRole('button', { name: '保存并发布' }).click();
  await page.getByRole('button', { name: '从 v1 开始模拟' }).click();
  await expect(page.getByRole('button', { name: /答应保密/ })).toBeVisible();
  await expect(page.getByLabel('起始章节')).toHaveValue('第二章');
  await page.getByLabel('前情预设').focus();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: '从此章节试跑' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByText('章节试跑 · 第二章', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: /兑现承诺/ })).toBeVisible();
  await expect(page.getByText('第一章开场', { exact: true })).toHaveCount(0);
  await page.screenshot({ path: testInfo.outputPath('chapter-desktop.png'), fullPage: true });
  await page.getByRole('button', { name: /兑现承诺/ }).click();
  await page.reload();
  await page.getByRole('tab', { name: '02 对话模拟器' }).click();
  await expect(page.getByText('第二章结束', { exact: true })).toBeVisible();
  await page.getByRole('tab', { name: '01 剧本工作室' }).click();
  await page.getByLabel('Ink 剧本').fill('新版本开场\n-> END');
  await page.getByRole('button', { name: '保存并发布' }).click();
  await expect(page.getByRole('button', { name: '从 v2 开始模拟' })).toBeVisible();
  await page.getByRole('tab', { name: '02 对话模拟器' }).click();
  await page.getByRole('button', { name: '重新开始', exact: true }).click();
  await expect(page.getByText('固定版本 v1', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: /兑现承诺/ })).toBeVisible();
  await page.getByLabel('试跑版本').selectOption({ label: 'v2 · 最新发布' });
  await expect(page.getByText(/此版本未配置章节入口/)).toBeVisible();
  await page.getByLabel('试跑版本').selectOption({ label: 'v1' });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('chapter-mobile.png'), fullPage: true });
  await page.getByRole('button', { name: '返回正常进度' }).click();
  await expect(page.getByRole('button', { name: /答应保密/ })).toBeVisible();
  await expect(page.getByText('章节试跑 · 第二章', { exact: true })).toHaveCount(0);
  await page.reload();
  await page.getByRole('tab', { name: '02 对话模拟器' }).click();
  await page.getByRole('button', { name: /答应保密/ }).click();
  await expect(page.getByText('第二章开场，好感度 2', { exact: true })).toBeVisible();
});

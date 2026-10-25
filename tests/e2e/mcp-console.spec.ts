import { expect, test } from '@playwright/test';

test('C01–C05 and C07 play a published story through the MCP console', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: '＋ 新建示例故事' }).click();
  const title = `MCP 验收 ${Date.now()}`;
  await page.getByLabel('剧本名称').fill(title);
  await page.getByRole('button', { name: '保存并发布' }).click();
  await expect(page.getByText(/版本 v1 已发布/)).toBeVisible();

  await page.getByRole('tab', { name: '03 MCP 测试' }).click();
  await expect(page.getByText('不是语言模型在游玩。音色、音频和音乐只是演出元数据，这里不会播放。')).toBeVisible();
  for (const name of ['list_stories', 'start_session', 'get_session', 'choose_option']) {
    await expect(page.getByRole('list', { name: 'MCP 工具' }).getByText(name, { exact: true })).toBeVisible();
  }
  const prompt = page.getByLabel('play_turn 提示');
  await expect(prompt).toContainText('照读工具返回的台词');
  await expect(prompt).toContainText('不要总结');
  await expect(prompt).toContainText('逐字按照返回的剧本和台词');
  await expect(prompt).toContainText('禁止编造选项');
  await expect(prompt).toContainText('禁止声称已播放声音');

  await page.getByRole('button', { name: `开始「${title}」` }).click();
  await expect(page.getByText('雨敲打着末班车站。林小姐递给你一封没有署名的信。', { exact: true })).toBeVisible();
  await expect(page.getByText('演出元数据 · 音乐 rain')).toBeVisible();
  await page.getByLabel('发给工具的原话').fill('飞向月球');
  await page.getByRole('button', { name: '提交原话' }).click();
  await expect(page.getByRole('alert')).toContainText('请说当前选项');
  await expect(page.getByRole('button', { name: /答应保密/ })).toBeVisible();
  await page.getByRole('button', { name: /答应保密/ }).click();
  await expect(page.getByRole('button', { name: /把伞借给她/ })).toBeVisible();
  const turn = await page.getByText(/^回合 /).textContent();
  await page.getByRole('button', { name: '读取当前回合' }).click();
  await expect(page.getByText(/^回合 /)).toHaveText(turn ?? '');
  await expect(page.getByRole('button', { name: /把伞借给她/ })).toBeVisible();

  await page.setViewportSize({ width: 390, height: 844 });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  expect(overflow).toBe(false);
});

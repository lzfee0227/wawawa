import { expect, test } from '@playwright/test';

function toneWav() {
  const rate = 8000;
  const frames = rate * 3;
  const bytes = Buffer.alloc(44 + frames * 2);
  bytes.write('RIFF'); bytes.writeUInt32LE(bytes.length - 8, 4); bytes.write('WAVEfmt ', 8);
  bytes.writeUInt32LE(16, 16); bytes.writeUInt16LE(1, 20); bytes.writeUInt16LE(1, 22);
  bytes.writeUInt32LE(rate, 24); bytes.writeUInt32LE(rate * 2, 28);
  bytes.writeUInt16LE(2, 32); bytes.writeUInt16LE(16, 34); bytes.write('data', 36);
  bytes.writeUInt32LE(frames * 2, 40);
  for (let n = 0; n < frames; n++) bytes.writeInt16LE(Math.round(Math.sin(n * 2 * Math.PI * 440 / rate) * 1000), 44 + n * 2);
  return bytes;
}

test('A01/A03–A05/A08 audio playback, confirmed recognition and turn cleanup', async ({ page }, testInfo) => {
  // Browser ASR service is intentionally mocked; the game service and native WAV decoder are real.
  await page.addInitScript(() => {
    class Recognition {
      lang = ''; continuous = false; interimResults = false;
      onresult: ((event: unknown) => void) | null = null;
      onerror = null; onend = null;
      start() { queueMicrotask(() => this.onresult?.({ results: [[{ transcript: '第一个' }]] })); }
      abort() {}
    }
    Object.defineProperty(window, 'SpeechRecognition', { configurable: true, value: Recognition });
  });
  await page.goto('/');
  await page.getByRole('button', { name: '＋ 新建示例故事' }).click();
  await page.getByRole('button', { name: '保存并发布' }).click();
  await expect(page.getByText('版本 v1 已发布。可以前往对话模拟器开始验证。')).toBeVisible();
  await page.getByRole('tab', { name: '02 对话模拟器' }).click();
  await page.getByRole('button', { name: '开始模拟', exact: true }).click();
  const panel = page.getByRole('region', { name: '语音与音频' });
  await expect(panel.getByLabel('朗读来源（TTS）')).toHaveValue('browser');
  await expect(panel.getByLabel('识别来源（ASR）')).toHaveValue('browser');
  await expect(panel.getByLabel('朗读来源（TTS）').locator('option[value="cloud"]')).toHaveJSProperty('disabled', true);
  await panel.getByText('播放一段音频', { exact: true }).click();
  await panel.getByLabel('本地音频文件').setInputFiles({ name: 'test-tone.wav', mimeType: 'audio/wav', buffer: toneWav() });
  const audio = panel.getByLabel('音频播放器');
  // Exercise the actual HTMLMediaElement playback/decoder with a generated non-private fixture.
  await audio.scrollIntoViewIfNeeded();
  await expect(audio).toHaveAttribute('src', /^blob:/);
  await audio.evaluate(element => { const player = element as HTMLAudioElement; player.muted = true; void player.play(); });
  await expect.poll(() => audio.evaluate(element => (element as HTMLAudioElement).currentTime)).toBeGreaterThan(0);
  await panel.getByRole('button', { name: '停止语音与播放' }).click();
  await expect.poll(() => audio.evaluate(element => (element as HTMLAudioElement).paused)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('desktop-audio.png'), fullPage: true });

  const originalChoice = page.getByRole('button', { name: /答应保密/ });
  await panel.getByRole('button', { name: '语音输入', exact: true }).click();
  await expect(page.getByLabel('语音识别后的文字')).toHaveValue('第一个');
  await expect(originalChoice).toBeVisible(); // ASR must not submit automatically.
  await page.getByRole('button', { name: '提交选择', exact: true }).click();
  await expect(page.getByRole('button', { name: /把伞借给她/ })).toBeVisible();
  await expect(page.getByLabel('语音识别后的文字')).toHaveValue('');

  await page.setViewportSize({ width: 390, height: 844 });
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('mobile-audio.png'), fullPage: true });
  await audio.evaluate(element => { const player = element as HTMLAudioElement; player.currentTime = 0; void player.play(); });
  await page.getByRole('tab', { name: '01 剧本工作室' }).click();
  await expect(page.getByLabel('音频播放器')).toHaveCount(0);
});

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  timeout: 45_000,
  expect: { timeout: 10_000 },
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://127.0.0.1:5173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      command: 'npm run dev -w @wawawa/server',
      url: 'http://127.0.0.1:3001/api/health',
      reuseExistingServer: false,
      env: {
        MONGODB_URI: process.env.E2E_MONGODB_URI ?? 'mongodb://127.0.0.1:27017/wawawa_e2e',
        PORT: '3001',
        HOST: '127.0.0.1',
      },
    },
    {
      command: 'npm run dev -w @wawawa/web',
      url: 'http://127.0.0.1:5173',
      reuseExistingServer: false,
    },
  ],
});

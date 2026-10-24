import { defineConfig } from 'vitest/config';
export default defineConfig({ test: {
  include: ['test/**/*.test.ts'], exclude: ['test/**/*.integration.test.ts'],
  coverage: { provider: 'v8', include: ['src/{engine,service,app,validation,mcp}.ts'], reporter: ['text', 'html', 'json-summary'], thresholds: { lines: 85, functions: 85, statements: 85, branches: 75 } }
} });

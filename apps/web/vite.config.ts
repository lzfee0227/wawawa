import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

const apiProxy = process.env.VITE_API_PROXY ?? 'http://127.0.0.1:3001';

export default defineConfig({
  plugins: [react()],
  server: { proxy: { '/api': apiProxy, '/mcp': apiProxy } },
  test: {
    environment: 'jsdom', setupFiles: ['./src/test-setup.ts'],
    coverage: {
      provider: 'v8', include: ['src/api.ts', 'src/App.tsx', 'src/mcp-client.ts', 'src/McpConsole.tsx'],
      reporter: ['text', 'lcov', 'html'],
      thresholds: { lines: 80, statements: 80, functions: 75, branches: 70 }
    }
  }
});

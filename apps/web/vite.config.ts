import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: { proxy: { '/api': 'http://127.0.0.1:3001' } },
  test: {
    environment: 'jsdom', setupFiles: ['./src/test-setup.ts'],
    coverage: {
      provider: 'v8', include: ['src/api.ts', 'src/App.tsx'],
      reporter: ['text', 'lcov', 'html'],
      thresholds: { lines: 80, statements: 80, functions: 75, branches: 70 }
    }
  }
});

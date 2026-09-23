import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@noctalis/shared': fileURLToPath(new URL('./shared/src/index.ts', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    include: ['tests/unit/**/*.test.{ts,tsx}'],
    environmentMatchGlobs: [['tests/unit/**/*.dom.test.tsx', 'jsdom']],
    globals: true,
    setupFiles: ['./tests/unit/setup.ts'],
  },
});

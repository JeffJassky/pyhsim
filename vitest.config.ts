import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@physim/core': fileURLToPath(new URL('./packages/core/src/index.ts', import.meta.url)),
      '@physim/physiology': fileURLToPath(new URL('./packages/physiology/src/index.ts', import.meta.url)),
      '@physim/registry': fileURLToPath(new URL('./packages/registry/src/index.ts', import.meta.url)),
    },
  },
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'jsdom',
    coverage: {
      provider: 'v8',
    },
    exclude: ['tests/e2e/**', 'playwright.config.ts'],
  },
});

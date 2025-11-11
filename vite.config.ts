import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

const base =
  process.env.GITHUB_ACTIONS && process.env.GITHUB_REPOSITORY?.includes('pyhsim')
    ? '/pyhsim/'
    : '/';

export default defineConfig({
  base,
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
  },
});

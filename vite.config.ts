import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  base: "/",
  plugins: [vue()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "@physim/core": fileURLToPath(new URL("./packages/core/src/index.ts", import.meta.url)),
      "@physim/physiology": fileURLToPath(new URL("./packages/physiology/src/index.ts", import.meta.url)),
      "@physim/registry": fileURLToPath(new URL("./packages/registry/src/index.ts", import.meta.url)),
    },
  },
  server: {
    port: 5173,
  },
  build: {
    minify: false, // keep output readable instead of obfuscated/minified
  },
});

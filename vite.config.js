/// <reference types="vitest" />
import { cloudflare } from "@cloudflare/vite-plugin";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: (process.env.TEST_MODE || process.env.VITEST) ? [] : [cloudflare()],
  test: {
    environment: "jsdom",
    globals: true,
    exclude: ["**/node_modules/**", "**/dist/**", "**/tests/e2e/**"]
  }
});

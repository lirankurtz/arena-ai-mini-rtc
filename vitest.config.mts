import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    setupFiles: [],
    environmentMatchGlobs: [
      ["client/**/*.test.tsx", "jsdom"],
    ],
  },
  resolve: {
    alias: {
      "@mini-rtc/shared": path.resolve(__dirname, "./shared/src"),
    },
  },
});

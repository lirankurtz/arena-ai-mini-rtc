import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "happy-dom",
  },
  resolve: {
    alias: {
      "@mini-rtc/shared": path.resolve(__dirname, "./shared/src"),
    },
  },
});

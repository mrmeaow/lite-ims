import { defineConfig } from "vitest/config";
import { resolve } from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@ims/shared": resolve(__dirname, "../../packages/shared/src"),
      "@ims/types": resolve(__dirname, "../../packages/types/src"),
      "@ims/database": resolve(__dirname, "../../packages/database/src"),
    },
  },
  test: {
    globals: false,
    environment: "node",
    include: ["tests/**/*.test.ts"],
    timeout: 30000,
    hookTimeout: 30000,
  },
});

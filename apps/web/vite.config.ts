import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5171,
    proxy: {
      "/api": {
        target: "http://localhost:3030",
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: path.resolve(__dirname, "../api/dist/client"),
    sourcemap: true,
    emptyOutDir: true,
  },
  // @ts-ignore
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/tests/setup.ts",
    include: ["src/**/*.test.tsx", "src/**/*.test.ts"],
  },
});
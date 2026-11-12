import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import fs from "node:fs";
import path from "node:path";

const fallbackNodeModules = process.env.LOCALAPPDATA
  ? path.join(process.env.LOCALAPPDATA, "saas-web-deps", "node_modules")
  : null;
const useFallback =
  !fs.existsSync(path.resolve(__dirname, "node_modules")) &&
  Boolean(fallbackNodeModules && fs.existsSync(fallbackNodeModules));

const fallbackAlias: Record<string, string> =
  useFallback && fallbackNodeModules
    ? {
        react: path.join(fallbackNodeModules, "react"),
        "react-dom": path.join(fallbackNodeModules, "react-dom"),
        "@tanstack/react-query": path.join(fallbackNodeModules, "@tanstack/react-query"),
        "@testing-library/react": path.join(fallbackNodeModules, "@testing-library/react"),
        "@testing-library/user-event": path.join(fallbackNodeModules, "@testing-library/user-event"),
        "@testing-library/jest-dom/vitest": path.join(
          fallbackNodeModules,
          "@testing-library/jest-dom/vitest.js",
        ),
      }
    : {};

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      ...fallbackAlias,
    },
  },
});

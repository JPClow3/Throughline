import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: ["packages/**/*.test.ts", "apps/**/*.test.{ts,tsx}"],
    coverage: {
      provider: "v8",
      reportsDirectory: "./coverage",
      reporter: ["text", "html", "lcov", "json-summary"],
      all: true,
      include: ["apps/**/*.{ts,tsx}", "packages/**/*.{ts,tsx}"],
      exclude: [
        "**/*.config.{ts,js}",
        "**/*.d.ts",
        "**/*.test.{ts,tsx}",
        "**/test-helpers.ts",
        "apps/web/src/vite-env.d.ts",
        "apps/web/tests/**",
        "apps/**/dist/**",
        "packages/**/dist/**"
      ],
      thresholds: {
        branches: 50,
        functions: 50,
        lines: 58,
        statements: 58
      }
    }
  }
});

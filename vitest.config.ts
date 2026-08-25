import { defineConfig } from "vitest/config";

// Tests must always load React's development build: the production build has
// no act(), which breaks every component test when NODE_ENV is inherited as
// "production" from the host machine.
process.env.NODE_ENV = "test";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    testTimeout: 15000,
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
        lines: 50,
        statements: 50
      }
    }
  }
});

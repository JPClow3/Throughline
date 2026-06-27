import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "apps/web/tests",
  timeout: 30_000,
  fullyParallel: true,
  use: {
    baseURL: "http://127.0.0.1:4173",
    trace: "on-first-retry"
  },
  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.05
    }
  },
  webServer: {
    command: "npm run preview -w apps/web -- --host 127.0.0.1 --port 4173",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: true,
    timeout: 120_000
  },
  projects: [
    { name: "desktop", testMatch: "**/*.e2e.spec.ts", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", testMatch: "**/*.e2e.spec.ts", use: { ...devices["Pixel 7"] } },
    { name: "performance", testMatch: "**/*.perf.spec.ts", use: { ...devices["Desktop Chrome"] } },
    { name: "stress", testMatch: "**/*.stress.spec.ts", timeout: 60_000, use: { ...devices["Desktop Chrome"] } }
  ]
});

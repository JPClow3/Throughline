import { expect, test } from "@playwright/test";
import { completeOnboarding } from "./helpers/completeOnboarding";

const budgets = {
  dashboardReadyMs: 4_500,
  kanbanSwitchMs: 1_500,
  domContentLoadedMs: 3_500
};

test("keeps core dashboard and Kanban interactions inside smoke budgets", async ({ page }) => {
  await page.route("**/auth/me", route => route.fulfill({ status: 200 }));
  await page.route("**/sync/pull*", route => route.fulfill({ status: 200, json: { tasks: [], goals: [], notes: [], courses: [] } }));
  await page.addInitScript(() => {
    localStorage.setItem("tl_email", "tester@example.com");
    localStorage.setItem("tl_dek", btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(32)))));
  });
  await page.goto("/app");
  await completeOnboarding(page);

  const dashboardStart = Date.now();
  await expect(page.getByRole("heading", { name: "Today" })).toBeVisible();
  const dashboardReadyMs = Date.now() - dashboardStart;

  const metrics = await page.evaluate(() => {
    const navigation = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;

    return {
      domContentLoadedMs: navigation ? navigation.domContentLoadedEventEnd - navigation.startTime : 0,
      loadEventMs: navigation ? navigation.loadEventEnd - navigation.startTime : 0
    };
  });

  const kanbanStart = Date.now();
  await page.locator('a[aria-label="Board"]:visible').click();
  await expect(page.getByRole("heading", { name: "Backlog" })).toBeVisible();
  const kanbanSwitchMs = Date.now() - kanbanStart;

  expect(dashboardReadyMs).toBeLessThan(budgets.dashboardReadyMs);
  expect(kanbanSwitchMs).toBeLessThan(budgets.kanbanSwitchMs);
  expect(metrics.domContentLoadedMs).toBeLessThan(budgets.domContentLoadedMs);
});

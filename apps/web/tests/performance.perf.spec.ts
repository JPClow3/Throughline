import { expect, test } from "@playwright/test";

const budgets = {
  dashboardReadyMs: 4_500,
  kanbanSwitchMs: 1_500,
  domContentLoadedMs: 3_500
};

test("keeps core dashboard and Kanban interactions inside smoke budgets", async ({ page }) => {
  const dashboardStart = Date.now();
  await page.goto("/app");
  await expect(page.getByRole("heading", { name: /Good (morning|afternoon|evening)/ })).toBeVisible();
  const dashboardReadyMs = Date.now() - dashboardStart;

  const metrics = await page.evaluate(() => {
    const navigation = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;

    return {
      domContentLoadedMs: navigation ? navigation.domContentLoadedEventEnd - navigation.startTime : 0,
      loadEventMs: navigation ? navigation.loadEventEnd - navigation.startTime : 0
    };
  });

  const kanbanStart = Date.now();
  await page.getByLabel("Board").click();
  await expect(page.getByRole("heading", { name: "Backlog" })).toBeVisible();
  const kanbanSwitchMs = Date.now() - kanbanStart;

  expect(dashboardReadyMs).toBeLessThan(budgets.dashboardReadyMs);
  expect(kanbanSwitchMs).toBeLessThan(budgets.kanbanSwitchMs);
  expect(metrics.domContentLoadedMs).toBeLessThan(budgets.domContentLoadedMs);
});

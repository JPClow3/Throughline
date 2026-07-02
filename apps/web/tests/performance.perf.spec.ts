import { expect, test } from "@playwright/test";

const budgets = {
  dashboardReadyMs: 4_500,
  kanbanSwitchMs: 1_500,
  domContentLoadedMs: 3_500
};

async function completeOnboarding(page: import("@playwright/test").Page) {
  const heading = page.getByRole("heading", { name: "Make Today useful" });
  if (!(await heading.waitFor({ state: "visible", timeout: 10000 }).then(() => true).catch(() => false))) {
    return;
  }

  await page.getByRole("button", { name: "Next" }).click();
  await page.getByLabel("Course 1").fill("Biology");
  await page.getByRole("button", { name: "Next" }).click();
  await page.getByLabel("First task").fill("Review biology notes");
  await page.getByRole("button", { name: "Next" }).click();
  await page.getByRole("button", { name: /Finish setup/i }).click();
  await heading.waitFor({ state: "hidden", timeout: 5000 });
}

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

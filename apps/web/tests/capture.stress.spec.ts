import { expect, test } from "@playwright/test";
import { completeOnboarding } from "./helpers/completeOnboarding";

test("handles repeated task capture and board rendering", async ({ page }) => {
  await page.route("**/auth/me", route => route.fulfill({ status: 200 }));
  await page.route("**/sync/pull*", route => route.fulfill({ status: 200, json: { tasks: [], goals: [], notes: [], courses: [] } }));
  await page.addInitScript(() => {
    localStorage.setItem("tl_email", "tester@example.com");
    localStorage.setItem("tl_dek", btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(32)))));
  });
  await page.goto("/app");
  await completeOnboarding(page);

  await expect(page.getByRole("heading", { name: "Today" })).toBeVisible();

  for (let index = 1; index <= 20; index += 1) {
    await page.locator(".today-primary-action").click();
    await page.getByLabel("Title").fill(`Stress task ${index}`);
    await page.getByRole("button", { name: "Add task", exact: true }).click();
    await expect(page.getByLabel("Title")).toHaveCount(0);
  }

  await page.locator('a[aria-label="Board"]:visible').click();
  await expect(page.getByRole("heading", { name: "Backlog" })).toBeVisible();
  await expect(page.getByText("Stress task 20")).toBeVisible();
  // 1 setup task + 20 captured here.
  await expect(page.locator("article.task-card")).toHaveCount(21);
});

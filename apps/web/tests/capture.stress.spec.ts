import { expect, test } from "@playwright/test";

test("handles repeated task capture and board rendering", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("tl_email", "tester@example.com");
    localStorage.setItem("tl_dek", btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(32)))));
  });
  await page.goto("/app");
  
  // Bypass onboarding overlay
  const skipBtn = page.getByRole("button", { name: "Skip" });
  await skipBtn.waitFor({ state: "visible", timeout: 10000 });
  await skipBtn.click();
  await skipBtn.waitFor({ state: "hidden", timeout: 5000 });

  await expect(page.getByRole("heading", { name: /Good (morning|afternoon|evening)/ })).toBeVisible();

  for (let index = 1; index <= 20; index += 1) {
    await page.getByRole("button", { name: /New task/i }).click();
    await page.getByLabel("Title").fill(`Stress task ${index}`);
    await page.getByRole("button", { name: "Add task", exact: true }).click();
    await expect(page.getByLabel("Title")).toHaveCount(0);
  }

  await page.locator('a[aria-label="Board"]:visible').click();
  await expect(page.getByRole("heading", { name: "Backlog" })).toBeVisible();
  await expect(page.getByText("Stress task 20")).toBeVisible();
  // 14 seeded tasks (incl. 4 goal steps and 6 daily quests) + 20 captured here.
  await expect(page.locator("article.task-card")).toHaveCount(34);
});

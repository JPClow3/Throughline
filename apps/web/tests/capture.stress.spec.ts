import { expect, test } from "@playwright/test";

test("handles repeated task capture and board rendering", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("tl_email", "tester@example.com");
    localStorage.setItem("tl_dek", btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(32)))));
  });
  await page.goto("/app");
  await expect(page.getByRole("heading", { name: /Good (morning|afternoon|evening)/ })).toBeVisible();

  for (let index = 1; index <= 20; index += 1) {
    await page.getByRole("button", { name: "New task" }).click();
    await page.getByLabel("Title").fill(`Stress task ${index}`);
    await page.getByRole("button", { name: "Add task" }).click();
    await expect(page.getByLabel("Title")).toHaveCount(0);
  }

  await page.getByLabel("Board").click();
  await expect(page.getByRole("heading", { name: "Backlog" })).toBeVisible();
  await expect(page.getByText("Stress task 20")).toBeVisible();
  // 8 seeded tasks (incl. 4 goal steps) + 20 captured here.
  await expect(page.locator("article.task-card")).toHaveCount(28);
});

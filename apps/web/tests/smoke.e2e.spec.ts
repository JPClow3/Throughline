import { expect, test } from "@playwright/test";

// The /app routes are auth-gated. Seed a local session marker so the guard
// admits us without a running backend (background /auth/me just fails offline).
test.beforeEach(async ({ page }) => {
  await page.route("**/auth/me", route => route.fulfill({ status: 200 }));
  await page.route("**/sync/pull*", route => route.fulfill({ status: 200, json: { tasks: [], goals: [], notes: [], courses: [] } }));
  await page.addInitScript(() => {
    localStorage.setItem("tl_email", "tester@example.com");
    localStorage.setItem("tl_dek", btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(32)))));
  });
});

test("renders today and board", async ({ page }) => {
  await page.goto("/app");
  
  // Bypass onboarding overlay
  const skipBtn = page.getByRole("button", { name: "Skip" });
  await skipBtn.waitFor({ state: "visible", timeout: 10000 });
  await skipBtn.click();
  await skipBtn.waitFor({ state: "hidden", timeout: 5000 });
  
  await expect(page.getByRole("heading", { name: /Good (morning|afternoon|evening)/ })).toBeVisible();
  await page.locator('a[aria-label="Board"]:visible').click();
  await expect(page.getByRole("heading", { name: "Backlog" })).toBeVisible();
});

test("captures, moves, and completes a task", async ({ page }) => {
  const title = `UX flow task ${Date.now()}`;
  await page.goto("/app");

  // Bypass onboarding overlay
  const skipBtn = page.getByRole("button", { name: "Skip" });
  await skipBtn.waitFor({ state: "visible", timeout: 10000 });
  await skipBtn.click();
  await skipBtn.waitFor({ state: "hidden", timeout: 5000 });

  await page.getByRole("button", { name: /New task/i }).click();
  await page.getByLabel("Title").fill(title);
  await page.getByLabel("Due").fill("2026-12-04T14:30");
  await page.getByRole("button", { name: "Add task", exact: true }).click();
  // The quick-add sheet closes after capture.
  await expect(page.getByLabel("Title")).toHaveCount(0);

  await page.locator('a[aria-label="Board"]:visible').click();
  await expect(page.getByRole("heading", { name: title })).toBeVisible();
  await page.getByLabel(`Move ${title}`).selectOption("doing");
  await expect(page.getByLabel(`Move ${title}`)).toHaveValue("doing");
  await page.getByRole("button", { name: `Complete ${title}` }).click();
  await expect(page.getByLabel(`Move ${title}`)).toHaveValue("done");
});

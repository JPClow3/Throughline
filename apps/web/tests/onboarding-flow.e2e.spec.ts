import { expect, test } from "@playwright/test";

test.describe("onboarding first-run flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      indexedDB.deleteDatabase("liquidglass-study-quests");
      sessionStorage.clear();
      localStorage.clear();
    });
  });

  test("advances with real mouse clicks and unlocks Today", async ({ page, baseURL }) => {
    // Prefer live Vite when present so we exercise the same build computer-use hits.
    const target = process.env.E2E_BASE_URL ?? baseURL ?? "http://127.0.0.1:4173";
    await page.goto(`${target.replace(/\/$/, "")}/app`, { waitUntil: "networkidle" });

    await expect(page.getByRole("heading", { name: /What are you planning for/i })).toBeVisible({
      timeout: 20_000
    });

    const next = page.getByTestId("onboarding-next");
    await expect(next).toBeEnabled();
    await next.click();
    await expect(page.getByRole("heading", { name: /Add your courses|Name your projects/i })).toBeVisible();

    await next.click();
    await expect(page.getByRole("heading", { name: /Capture one real task/i })).toBeVisible();

    await next.click();
    await expect(page.getByRole("heading", { name: /Optional finishing touches/i })).toBeVisible();

    await page.getByTestId("onboarding-finish").click();
    await expect(page.getByRole("dialog", { name: /What are you planning for/i })).toHaveCount(0);
    await expect(page.getByText(/Schedule shape/i)).toBeVisible();
  });

  test("pressure row opens Board with filters after setup", async ({ page, baseURL }) => {
    const target = process.env.E2E_BASE_URL ?? baseURL ?? "http://127.0.0.1:4173";
    await page.goto(`${target.replace(/\/$/, "")}/app`, { waitUntil: "networkidle" });

    for (let step = 0; step < 3; step += 1) {
      await page.getByTestId("onboarding-next").click();
    }
    await page.getByTestId("onboarding-finish").click();
    await expect(page.getByText(/Schedule shape/i)).toBeVisible();

    await page.getByRole("button", { name: /Open Board filtered to Due today/i }).click();
    await expect(page).toHaveURL(/view=kanban|view=board/i);
  });

  test("mobile More sheet and custom weekday chips", async ({ page, baseURL }, testInfo) => {
    test.skip(testInfo.project.name !== "mobile", "Dock More is a coarse/mobile surface");
    const target = process.env.E2E_BASE_URL ?? baseURL ?? "http://127.0.0.1:4173";
    await page.goto(`${target.replace(/\/$/, "")}/app`, { waitUntil: "networkidle" });

    for (let step = 0; step < 3; step += 1) {
      await page.getByTestId("onboarding-next").click();
    }
    await page.getByTestId("onboarding-finish").click();

    await page.getByRole("button", { name: "More", exact: true }).click();
    await expect(page.getByRole("menu", { name: /More views/i })).toBeVisible();
    await expect(page.getByRole("menuitem", { name: /Settings/i })).toBeVisible();
    await page.keyboard.press("Escape");

    await page.getByRole("button", { name: /Capture a task|New task/i }).first().click();
    await page.getByRole("button", { name: "Details" }).click();
    await page.getByLabel("Recurrence").selectOption("custom");
    await expect(page.getByRole("group", { name: /Repeat on weekdays/i })).toBeVisible();
    await expect(page.getByRole("button", { name: "Monday" })).toBeVisible();
  });
});

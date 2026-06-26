import { test, expect } from "@playwright/test";

test.describe("Visual Regression", () => {
  // Use a fixed viewport for consistent screenshots
  test.use({ viewport: { width: 1280, height: 800 } });

  test.beforeEach(async ({ page }) => {
    // Reset data or ensure sample data is loaded
    await page.goto("/");
    // Wait for the app to settle and sample data to appear
    await page.waitForSelector(".task-card");
    
    // To ensure consistency, we might want to hide dynamic elements like clocks or animations,
    // but for now we'll accept the baseline as-is.
  });

  test("Today view", async ({ page }) => {
    // Navigate to Dashboard (Today)
    await page.click('nav a[href="/"]');
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveScreenshot("today-view.png", { fullPage: true });
  });

  test("Kanban board", async ({ page }) => {
    await page.click('nav a[href="/tasks"]');
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveScreenshot("kanban-board.png", { fullPage: true });
  });

  test("Goal detail with progress ring", async ({ page }) => {
    await page.click('nav a[href="/goals"]');
    await page.waitForLoadState("networkidle");
    
    // Click the first goal to open detail
    const firstGoal = page.locator(".goal-card").first();
    await firstGoal.click();
    
    // Wait for the detail view to animate in
    await page.waitForSelector(".goal-detail");
    // Small delay to allow animations to finish
    await page.waitForTimeout(500); 
    
    await expect(page).toHaveScreenshot("goal-detail.png", { fullPage: true });
  });

  test("TaskComposer sheet open", async ({ page }) => {
    // Click the FAB or new task button
    // The button might have a different selector, let's use the layout button
    const fab = page.locator('.fab').first();
    if (await fab.isVisible()) {
      await fab.click();
    } else {
      await page.keyboard.press("c"); // Assuming 'c' is the shortcut for compose
    }
    
    // Wait for the sheet to appear
    await page.waitForSelector(".composer-form");
    await page.waitForTimeout(500);
    
    await expect(page).toHaveScreenshot("task-composer-sheet.png", { fullPage: true });
  });

  test("Command palette open", async ({ page }) => {
    // Press Cmd+K or Ctrl+K to open command palette
    await page.keyboard.press("Control+k");
    await page.keyboard.press("Meta+k");
    
    await page.waitForSelector("[cmdk-dialog]");
    await page.waitForTimeout(500);
    
    await expect(page).toHaveScreenshot("command-palette.png", { fullPage: true });
  });
});

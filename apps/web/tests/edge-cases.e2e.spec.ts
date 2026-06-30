import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.route("**/auth/me", route => route.fulfill({ status: 200 }));
  await page.route("**/sync/pull*", route => route.fulfill({ status: 200, json: { tasks: [], goals: [], notes: [], courses: [] } }));
  await page.addInitScript(() => {
    localStorage.setItem("tl_email", "tester@example.com");
    localStorage.setItem("tl_dek", btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(32)))));
  });
});

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

test.describe("Edge Cases & Boundaries", () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto("/app");
    await completeOnboarding(page);
  });

  test("Empty form submission for New Task", async ({ page }) => {
    // Attempting to add a task with an empty title should fail validation or have the button disabled
    await page.getByRole("button", { name: /New task/i }).click();
    
    const addTaskBtn = page.getByRole("button", { name: "Add task", exact: true });
    
    // We expect the button to be disabled if the form is empty, or if we click it, it should not close the dialog
    if (await addTaskBtn.isDisabled()) {
        expect(await addTaskBtn.isDisabled()).toBeTruthy();
    } else {
        await addTaskBtn.click();
        // The dialog should still be visible because validation failed
        await expect(page.getByLabel("Title")).toBeVisible();
    }

    // Cancel creation
    // Assuming clicking outside or a cancel button
    await page.keyboard.press("Escape");
    await expect(page.getByLabel("Title")).toBeHidden();
  });

  test("Extremely long text in Task Title", async ({ page }) => {
    const longTitle = "A".repeat(140); // 140 characters long, max allowed
    
    await page.getByRole("button", { name: /New task/i }).click();
    await page.getByLabel("Title").fill(longTitle);
    await page.getByRole("button", { name: "Add task", exact: true }).click();
    
    await page.locator('a[aria-label="Board"]:visible').click();
    
    // Verify it renders correctly without breaking layout, up to max length of 140 chars
    const truncatedTitle = longTitle.substring(0, 140);
    const taskCard = page.locator(".task-card", { hasText: truncatedTitle });
    await expect(taskCard).toBeVisible();

    // Verify CSS truncation or visibility, maybe just check if card exists and is visible
    // Playwright `toBeVisible` checks if the element is actually rendered on screen
  });

  test("Past due dates display as overdue", async ({ page }) => {
    const title = `Overdue task ${Date.now()}`;
    
    await page.getByRole("button", { name: /New task/i }).click();
    await page.getByLabel("Title").fill(title);
    
    // Set a date in the past
    // The format in the composer is typically datetime-local: YYYY-MM-DDTHH:MM
    await page.getByLabel("Due").fill("2020-01-01T10:00");
    await page.getByRole("button", { name: "Add task", exact: true }).click();
    
    await page.locator('a[aria-label="Board"]:visible').click();
    
    const taskCard = page.locator(".task-card", { hasText: title });
    await expect(taskCard).toBeVisible();

    // The overdue pill should be present and visible
    const overdueChip = taskCard.locator(".meta-due-overdue");
    await expect(overdueChip).toBeVisible();
    await expect(overdueChip).toHaveText(/Overdue|Yesterday/);
  });

  test("Rapid repeated button clicks (Double submission protection)", async ({ page }) => {
    const title = `Rapid click task ${Date.now()}`;
    
    await page.getByRole("button", { name: /New task/i }).click();
    await page.getByLabel("Title").fill(title);
    
    const addTaskBtn = page.getByRole("button", { name: "Add task", exact: true });
    
    // Click multiple times rapidly
    await addTaskBtn.click();
    try {
      await addTaskBtn.click({ timeout: 500 });
      await addTaskBtn.click({ timeout: 500 });
    } catch {
      // It's fine if it fails because it's no longer visible
    }
    
    await page.locator('a[aria-label="Board"]:visible').click();
    
    // Ensure only ONE task was created
    const taskCards = page.locator(".task-card", { hasText: title });
    await expect(taskCards).toHaveCount(1);
  });
});

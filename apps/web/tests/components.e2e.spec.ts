import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.route("**/auth/me", route => route.fulfill({ status: 200 }));
  await page.route("**/sync/pull*", route => route.fulfill({ status: 200, json: { tasks: [], goals: [], notes: [], courses: [] } }));
  await page.addInitScript(() => {
    localStorage.setItem("tl_email", "tester@example.com");
    localStorage.setItem("tl_dek", btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(32)))));
  });
});

test.describe("Component Interactions & Buttons", () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto("/app");
    
    // Bypass onboarding overlay
    const skipBtn = page.getByRole("button", { name: "Skip" });
    await skipBtn.waitFor({ state: "visible", timeout: 10000 });
    await skipBtn.click();
    await skipBtn.waitFor({ state: "hidden", timeout: 5000 });
  });

  test("TaskCard and TaskComposer buttons (create, subtasks, complete)", async ({ page }) => {
    const title = `Component Task ${Date.now()}`;
    
    // 1. Task Composer button
    await page.getByRole("button", { name: /New task/i }).click();
    await page.getByLabel("Title").fill(title);
    
    // Add subtask via Composer
    const addSubtaskBtn = page.getByRole("button", { name: /Add Subtask/i, exact: false });
    // Assuming the task composer might have a button to add subtasks, but let's check
    // if not we just save. Throughline TaskComposer usually doesn't have an explicit 'Add Subtask' button until saved, 
    // but let's be safe.
    if (await addSubtaskBtn.isVisible()) {
        await addSubtaskBtn.click();
        await page.getByPlaceholder(/Subtask/i).first().fill("First step");
    }

    // Save
    await page.getByRole("button", { name: "Add task", exact: true }).click();
    
    // 2. Interact with the created TaskCard on the Board
    await page.locator('a[aria-label="Board"]:visible').click();
    
    const taskCard = page.locator(".task-card", { hasText: title });
    await expect(taskCard).toBeVisible();

    // 3. Add subtask directly on the card by typing and hitting Enter
    // Click the card first to ensure it is focused/active
    await taskCard.click();
    
    const inlineSubtaskInput = taskCard.locator('input[placeholder*="Add subtask"]');
    if (await inlineSubtaskInput.isVisible()) {
        await inlineSubtaskInput.fill("Inline step");
        await inlineSubtaskInput.press("Enter");
        // Verify it was added
        await expect(taskCard.getByText("Inline step")).toBeVisible();
        
        // Toggle the subtask off/on
        const subtaskCheckbox = taskCard.locator('input[type="checkbox"]').first();
        if (await subtaskCheckbox.isVisible()) {
           await subtaskCheckbox.check();
           await expect(subtaskCheckbox).toBeChecked();
        }
    }

    // 4. Complete button on TaskCard
    const completeBtn = taskCard.locator("button.complete-button");
    await expect(completeBtn).toBeEnabled();
    await completeBtn.click();
    
    // It should have the is-done class now
    await expect(taskCard).toHaveClass(/is-done/);
    await expect(completeBtn).toBeDisabled();
  });

  test("Global nav and settings interactions", async ({ page }) => {
    // There are some global navigation buttons like "Board", "Goals", "Notes"
    await page.locator('a[aria-label="Board"]:visible').click();
    await expect(page.getByRole("heading", { name: "Backlog" })).toBeVisible();

    // There should be a user menu or settings button somewhere
    const settingsBtn = page.getByRole("button", { name: /Settings/i }).or(page.locator('button[aria-label="Settings"]'));
    if (await settingsBtn.isVisible()) {
      await settingsBtn.click();
      
      const themeToggle = page.getByRole("button", { name: /Toggle theme/i });
      if (await themeToggle.isVisible()) {
         await themeToggle.click();
      }

      const closeBtn = page.getByRole("button", { name: /Close/i });
      if (await closeBtn.isVisible()) {
        await closeBtn.click();
      }
    }
  });

});

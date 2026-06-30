import { test, expect } from "@playwright/test";

async function seedVisualGoal(page: import("@playwright/test").Page) {
  await page.evaluate(async () => {
    const request = indexedDB.open("liquidglass-study-quests");
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
    const readTx = db.transaction("courses", "readonly");
    const courseRequest = readTx.objectStore("courses").getAll();
    const courses = await new Promise<Array<{ id: string }>>((resolve, reject) => {
      courseRequest.onerror = () => reject(courseRequest.error);
      courseRequest.onsuccess = () => resolve(courseRequest.result as Array<{ id: string }>);
    });
    const projectId = courses[0]?.id;
    const now = new Date().toISOString();
    const tx = db.transaction(["goals", "tasks"], "readwrite");
    tx.objectStore("goals").put({
      id: "goal_visual_exam",
      title: "Prepare for biology exam",
      summary: "Review notes and complete a practice block.",
      status: "active",
      targetDate: "2026-12-04T18:00:00.000Z",
      projectId,
      color: "#5b73f0",
      icon: "B",
      priority: "high",
      createdAt: now,
      updatedAt: now
    });
    tx.objectStore("tasks").put({
      id: "task_visual_exam",
      title: "Practice cell division questions",
      description: "",
      status: "done",
      courseId: projectId,
      goalId: "goal_visual_exam",
      order: 0,
      dueAt: "2026-12-04T18:00:00.000Z",
      reminderAt: "2026-12-04T18:00:00.000Z",
      priority: "high",
      energy: 2,
      difficulty: 2,
      estimatedMinutes: 50,
      xp: 90,
      attributes: ["focus"],
      tags: ["study"],
      subtasks: [],
      visualSeed: 7,
      createdAt: now,
      updatedAt: now,
      completedAt: now
    });
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
    db.close();
  });
}

test.describe("Visual Regression", () => {
  // Use a fixed viewport for consistent screenshots
  test.use({ viewport: { width: 1280, height: 800 } });

  test.beforeEach(async ({ page }) => {
    // Prevent vite proxy ECONNREFUSED logs by mocking API routes
    await page.route("**/auth/me", route => route.fulfill({ status: 200 }));
    await page.route("**/sync/pull*", route => route.fulfill({ status: 200, json: { tasks: [], goals: [], notes: [], courses: [] } }));

    // Seed local session marker so the guard admits us without a running backend
    await page.addInitScript(() => {
      localStorage.setItem("tl_email", "tester@example.com");
      localStorage.setItem("tl_dek", btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(32)))));

      // Deterministic Math.random for visual tests
      let seed = 1;
      Math.random = () => {
        const x = Math.sin(seed++) * 10000;
        return x - Math.floor(x);
      };

      // Inject strict test mode styles to disable animations globally
      const style = document.createElement('style');
      style.innerHTML = `
        *, *::before, *::after {
          animation-duration: 0s !important;
          animation-delay: 0s !important;
          transition-duration: 0s !important;
          transition-delay: 0s !important;
        }
        svg * {
          animation: none !important;
        }
      `;
      if (document.documentElement) {
        document.documentElement.appendChild(style);
      } else {
        document.addEventListener('DOMContentLoaded', () => {
          document.documentElement.appendChild(style);
        });
      }
    });

    await page.goto("/app");

    const setupHeading = page.getByRole("heading", { name: "Make Today useful" });
    await setupHeading.waitFor({ state: "visible", timeout: 10000 });
    await page.getByRole("button", { name: "Next" }).click();
    await page.getByLabel("Course 1").fill("Biology");
    await page.getByRole("button", { name: "Next" }).click();
    await page.getByLabel("First task").fill("Review biology notes");
    await page.getByRole("button", { name: "Next" }).click();
    await page.getByRole("button", { name: /Finish setup/i }).click();
    await setupHeading.waitFor({ state: "hidden", timeout: 5000 });
    await seedVisualGoal(page);
    await page.reload();

    await page.waitForSelector("nav");
  });

  test("Today view", async ({ page }) => {
    // Navigate to Dashboard (Today)
    await page.locator('a[aria-label="Today"]:visible').click();
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveScreenshot("today-view.png", { fullPage: true });
  });

  test("Kanban board", async ({ page }) => {
    await page.locator('a[aria-label="Board"]:visible').click();
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveScreenshot("kanban-board.png", { fullPage: true });
  });

  test("Goal detail with progress ring", async ({ page }) => {
    await page.locator('a[aria-label="Goals"]:visible').click();
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
    const fab = page.getByRole("button", { name: /New task/i }).first();
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
    
    await page.waitForSelector("input[placeholder='Type a command or search...']");
    await page.waitForTimeout(500);
    
    await expect(page).toHaveScreenshot("command-palette.png", { fullPage: true });
  });
});

test.describe("Landing Page Visuals", () => {
test.use({ viewport: { width: 1280, height: 800 } });

  test("Landing page", async ({ page }) => {
    // Clear any auth to ensure we stay on the landing page
    await page.addInitScript(() => {
      localStorage.clear();
    });
    
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    // Wait for the Framer Motion float animation to settle slightly
    await page.waitForTimeout(1000);
    await expect(page).toHaveScreenshot("landing-page.png", { fullPage: true, maxDiffPixelRatio: 0.05, animations: "disabled" });
  });
});

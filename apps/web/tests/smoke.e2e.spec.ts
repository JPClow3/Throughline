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

async function completeOnboarding(page: import("@playwright/test").Page, options: { project?: string; task?: string } = {}) {
  const heading = page.getByRole("heading", { name: "Make Today useful" });
  if (!(await heading.waitFor({ state: "visible", timeout: 10000 }).then(() => true).catch(() => false))) {
    return;
  }

  await page.getByRole("button", { name: "Next" }).click();
  await page.getByLabel("Course 1").fill(options.project ?? "Biology");
  await page.getByRole("button", { name: "Next" }).click();
  await page.getByLabel("First task").fill(options.task ?? "Review biology notes");
  await page.getByRole("button", { name: "Next" }).click();
  await page.getByRole("button", { name: /Finish setup/i }).click();
  await heading.waitFor({ state: "hidden", timeout: 5000 });
}

async function readTaskTitles(page: import("@playwright/test").Page) {
  return page.evaluate(async () => {
    const request = indexedDB.open("liquidglass-study-quests");
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
    if (!db.objectStoreNames.contains("tasks")) {
      db.close();
      return [];
    }
    const transaction = db.transaction("tasks", "readonly");
    const getAll = transaction.objectStore("tasks").getAll();
    const tasks = await new Promise<Array<{ title: string; tags?: string[] }>>((resolve, reject) => {
      getAll.onerror = () => reject(getAll.error);
      getAll.onsuccess = () => resolve(getAll.result as Array<{ title: string; tags?: string[] }>);
    });
    db.close();
    return tasks.map((task) => ({ title: task.title, tags: task.tags ?? [] }));
  });
}

async function seedSearchRecords(page: import("@playwright/test").Page) {
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
    const now = new Date().toISOString();
    const projectId = courses[0]?.id;
    const writeTx = db.transaction(["goals", "notes"], "readwrite");
    writeTx.objectStore("goals").put({
      id: "goal_search_exam",
      title: "Pass biology exam",
      summary: "Use spaced review for the final.",
      status: "active",
      projectId,
      priority: "high",
      color: "#5b73f0",
      icon: "B",
      createdAt: now,
      updatedAt: now
    });
    writeTx.objectStore("notes").put({
      id: "note_search_mitosis",
      title: "Mitosis note",
      body: "Remember prophase, metaphase, anaphase, telophase.",
      taskIds: [],
      goalIds: ["goal_search_exam"],
      projectId,
      pinned: false,
      createdAt: now,
      updatedAt: now
    });
    await new Promise<void>((resolve, reject) => {
      writeTx.oncomplete = () => resolve();
      writeTx.onerror = () => reject(writeTx.error);
      writeTx.onabort = () => reject(writeTx.error);
    });
    db.close();
  });
}

async function openSearchResult(page: import("@playwright/test").Page, query: string, resultText: string) {
  await page.keyboard.press("Control+k");
  await page.getByPlaceholder("Type a command or search...").fill(query);
  await page.locator("[cmdk-item]", { hasText: resultText }).first().click();
}

async function expectToday(page: import("@playwright/test").Page) {
  await expect(page.getByRole("heading", { name: "Today" })).toBeVisible();
}

async function openBacklogStatus(page: import("@playwright/test").Page) {
  const backlogTab = page.getByRole("tab", { name: /Backlog/ });
  if (await backlogTab.waitFor({ state: "visible", timeout: 2000 }).then(() => true).catch(() => false)) {
    await backlogTab.click();
  }
}

test("renders today and board", async ({ page }) => {
  await page.goto("/app");
  
  await completeOnboarding(page);
  
  await expectToday(page);
  await page.locator('a[aria-label="Board"]:visible').click();
  await openBacklogStatus(page);
  await expect(page.getByRole("heading", { name: "Backlog" })).toBeVisible();
});

test("captures, moves, and completes a task", async ({ page }) => {
  const title = `UX flow task ${Date.now()}`;
  await page.goto("/app");

  await completeOnboarding(page);

  await page.locator(".today-primary-action").click();
  await page.getByLabel("Title").fill(title);
  await page.getByLabel("Due").fill("2026-12-04T14:30");
  await page.getByRole("button", { name: "Add task", exact: true }).click();
  // The quick-add sheet closes after capture.
  await expect(page.getByLabel("Title")).toHaveCount(0);

  await page.locator('a[aria-label="Board"]:visible').click();
  await openBacklogStatus(page);
  await expect(page.getByRole("heading", { name: title })).toBeVisible();
  await page.getByLabel(`Move ${title}`).selectOption("doing");
  const doingTab = page.getByRole("tab", { name: /Doing/ });
  if (await doingTab.waitFor({ state: "visible", timeout: 2000 }).then(() => true).catch(() => false)) {
    await doingTab.click();
  }
  await expect(page.getByLabel(`Move ${title}`)).toHaveValue("doing");
  await page.getByRole("button", { name: `Complete ${title}` }).click();
  const doneTab = page.getByRole("tab", { name: /Done/ });
  if (await doneTab.waitFor({ state: "visible", timeout: 2000 }).then(() => true).catch(() => false)) {
    await doneTab.click();
  }
  await expect(page.getByLabel(`Move ${title}`)).toHaveValue("done");
});

test("first-run onboarding creates a useful Today setup", async ({ page }) => {
  await page.goto("/app");

  await completeOnboarding(page, { project: "Chemistry", task: "Read lab handout" });

  await expectToday(page);
  await expect(page.getByRole("button", { name: "Read lab handout", exact: true })).toBeVisible();
  await expect.poll(async () => readTaskTitles(page)).toEqual([{ title: "Read lab handout", tags: ["study"] }]);
});

test("Ctrl+K jumps to task, note, goal, and project results", async ({ page }) => {
  await page.goto("/app");
  await completeOnboarding(page, { project: "Chemistry", task: "Read lab handout" });
  await seedSearchRecords(page);
  await page.reload();
  await expectToday(page);

  await openSearchResult(page, "Mitosis", "Mitosis note");
  await expect(page).toHaveURL(/view=notes/);

  await openSearchResult(page, "Pass biology", "Pass biology exam");
  await expect(page).toHaveURL(/view=goals/);

  await openSearchResult(page, "Chemistry", "Chemistry");
  await expect(page).toHaveURL(/view=courses/);

  await openSearchResult(page, "Read lab", "Read lab handout");
  await expect(page).toHaveURL(/view=kanban/);
  await expect(page.getByText("Edit task")).toBeVisible();
});

test("logged focus sessions update Today", async ({ page }) => {
  await page.goto("/app");
  await completeOnboarding(page, { task: "Practice flashcards" });

  const isMobile = (page.viewportSize()?.width ?? 1024) < 768;
  if (isMobile) {
    await page.getByRole("button", { name: "Start focus mode for Practice flashcards" }).click();
  } else {
    await page.getByRole("button", { name: "Start focus session" }).click();
  }
  await page.getByRole("button", { name: "Log focus session" }).click();
  await expect(page.getByText("Logged", { exact: true })).toBeVisible();
  await expect(page.locator("section", { hasText: "Schedule shape" }).getByText("1m", { exact: true })).toBeVisible();
});

test("dark theme keeps Today and Board headings readable", async ({ page }) => {
  await page.goto("/app?view=settings");
  await completeOnboarding(page);

  await page.goto("/app?view=settings");
  await page.getByRole("button", { name: "Dark" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");

  await page.goto("/app?view=dashboard");
  await expectToday(page);

  await page.goto("/app?view=kanban");
  await openBacklogStatus(page);
  await expect(page.getByRole("heading", { name: "Backlog" })).toBeVisible();

  const headingColor = await page.getByRole("heading", { name: "Backlog" }).evaluate((element) => {
    return getComputedStyle(element).color;
  });
  expect(headingColor).not.toBe("rgb(19, 27, 46)");
});

test("does not seed bundled sample tasks after setup", async ({ page }) => {
  await page.goto("/app");
  await completeOnboarding(page, { task: "Plan real week" });
  await expect.poll(async () => readTaskTitles(page)).toEqual([{ title: "Plan real week", tags: ["study"] }]);

  await page.reload();
  await expectToday(page);

  await expect.poll(async () => readTaskTitles(page)).toEqual([{ title: "Plan real week", tags: ["study"] }]);
});

import fs from "node:fs/promises";
import path from "node:path";
import { tmpdir } from "node:os";
import { chromium } from "playwright";

const outDir = path.join(tmpdir(), "throughline-layout-audit");
await fs.rm(outDir, { recursive: true, force: true });
await fs.mkdir(outDir, { recursive: true });

const appViews = ["dashboard", "goals", "kanban", "timeline", "notes", "courses", "insights", "settings"];
const publicRoutes = [
  { name: "landing", url: "/" },
  { name: "login", url: "/login" },
  { name: "signup", url: "/signup" },
  { name: "forgot-password", url: "/forgot-password" },
  { name: "privacy", url: "/privacy" },
  { name: "terms", url: "/terms" }
];
const viewports = [
  { name: "mobile", width: 430, height: 932 },
  { name: "tablet", width: 900, height: 1000 },
  { name: "desktop", width: 1366, height: 900 }
];

const browser = await chromium.launch({ channel: "chrome", headless: true });

async function setupPage(viewport) {
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    deviceScaleFactor: 1
  });
  await context.addInitScript(() => {
    const raw = new Uint8Array(32).fill(7);
    let binary = "";
    for (const byte of raw) binary += String.fromCharCode(byte);
    localStorage.setItem("tl_email", "layout@example.com");
    localStorage.setItem("tl_dek", btoa(binary));
    localStorage.setItem("pwa_banner_dismissed", "true");
  });

  const page = await context.newPage();
  await page.route("**/api/auth/me", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ email: "layout@example.com" }) })
  );
  await page.route("**/api/sync/pull", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ changes: [], serverTime: new Date().toISOString() }) })
  );
  await page.route("**/api/sync/push", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true }) })
  );
  await page.route("**/api/notifications/**", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true }) })
  );
  return { context, page };
}

async function seedApp(page) {
  await page.goto("http://127.0.0.1:5173/app?view=dashboard", { waitUntil: "networkidle", timeout: 20000 });
  await page.waitForSelector(".view-frame", { timeout: 15000 });
  await page.evaluate(async () => {
    const now = new Date("2026-06-30T12:00:00.000Z").toISOString();
    const open = indexedDB.open("liquidglass-study-quests");
    const db = await new Promise((resolve, reject) => {
      open.onsuccess = () => resolve(open.result);
      open.onerror = () => reject(open.error);
    });
    const stores = Array.from(db.objectStoreNames);
    const tx = db.transaction(stores, "readwrite");
    const clear = (store) =>
      new Promise((resolve, reject) => {
        const r = tx.objectStore(store).clear();
        r.onsuccess = resolve;
        r.onerror = () => reject(r.error);
      });
    const put = (store, value) =>
      new Promise((resolve, reject) => {
        const r = tx.objectStore(store).put(value);
        r.onsuccess = resolve;
        r.onerror = () => reject(r.error);
      });

    for (const store of stores.filter((item) => item !== "settings")) await clear(store);
    await put("settings", { id: "appearance-settings", lowPower3d: false, theme: "light", hasCompletedOnboarding: true, showGameLayer: false, updatedAt: now });
    for (const c of [
      { id: "bio", name: "BIO", color: "#5b73f0", icon: "B", createdAt: now, updatedAt: now },
      { id: "calc", name: "Calculus", color: "#2fa980", icon: "C", createdAt: now, updatedAt: now },
      { id: "hist", name: "History", color: "#f3b95f", icon: "H", createdAt: now, updatedAt: now }
    ]) await put("courses", c);
    for (const t of [
      { id: "t1", title: "Review cell division notes", description: "Turn lecture notes into a one-page active recall sheet and mark gaps for office hours.", courseId: "bio", goalId: "g1", dueAt: "2026-07-01T19:00:00.000Z", priority: "high", energy: 2, difficulty: 2, status: "todo", attributes: ["focus"], tags: ["study"], subtasks: [], recurrence: { pattern: "none" }, createdAt: now, updatedAt: now },
      { id: "t2", title: "Finish derivative problem set", description: "Problems 14-22, then check odd-numbered answers.", courseId: "calc", goalId: "g2", dueAt: "2026-07-02T22:00:00.000Z", priority: "medium", energy: 2, difficulty: 3, status: "doing", attributes: ["deep-work"], tags: ["math"], subtasks: [], recurrence: { pattern: "none" }, createdAt: now, updatedAt: now },
      { id: "t3", title: "Outline essay introduction", description: "Draft thesis, evidence bullets, and transition into first body paragraph.", courseId: "hist", dueAt: "2026-07-05T16:00:00.000Z", priority: "medium", energy: 1, difficulty: 2, status: "todo", attributes: ["writing"], tags: ["essay"], subtasks: [], recurrence: { pattern: "none" }, createdAt: now, updatedAt: now },
      { id: "t4", title: "Submit lab report", description: "Export PDF and verify rubric checklist before upload.", courseId: "bio", dueAt: "2026-06-30T23:00:00.000Z", priority: "high", energy: 1, difficulty: 1, status: "done", attributes: ["admin"], tags: ["lab"], subtasks: [], recurrence: { pattern: "none" }, createdAt: now, updatedAt: now },
      { id: "t5", title: "Prepare questions for professor office hours", description: "Collect confusing lecture points and bring one solved example.", courseId: "bio", goalId: "g1", dueAt: "2026-07-03T15:00:00.000Z", priority: "low", energy: 1, difficulty: 1, status: "backlog", attributes: ["admin"], tags: ["office-hours"], subtasks: [], recurrence: { pattern: "none" }, createdAt: now, updatedAt: now }
    ]) await put("tasks", t);
    await put("goals", { id: "g1", title: "Raise BIO exam average", summary: "Use spaced recall and office hours before the next exam.", projectId: "bio", color: "#5b73f0", status: "active", targetDate: "2026-07-20T00:00:00.000Z", createdAt: now, updatedAt: now });
    await put("goals", { id: "g2", title: "Build a reliable weekly study rhythm", summary: "Protect three focused blocks each week.", projectId: "calc", color: "#2fa980", status: "active", targetDate: "2026-08-01T00:00:00.000Z", createdAt: now, updatedAt: now });
    await put("notes", { id: "n1", title: "Cell division review", body: "Mitosis phases, spindle checkpoint, cytokinesis comparison notes.", pinned: false, taskIds: ["t1"], goalIds: ["g1"], createdAt: now, updatedAt: now });
    await put("notes", { id: "n2", title: "Essay evidence bank", body: "Primary source quotes and citations grouped by paragraph.", pinned: false, taskIds: ["t3"], goalIds: [], createdAt: now, updatedAt: now });
    await put("focusSessions", { id: "f1", taskId: "t1", courseId: "bio", goalId: "g1", startedAt: "2026-06-29T18:00:00.000Z", endedAt: "2026-06-29T18:45:00.000Z", durationMinutes: 45, createdAt: now, updatedAt: now });
    await put("progress", { id: "default", xp: 0, level: 1, streak: 0, completedTaskIds: ["t4"] });
    await new Promise((resolve, reject) => {
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
    db.close();
  });
}

async function measure(page) {
  await page.waitForTimeout(900);
  return page.evaluate(() => {
    const visible = Array.from(document.querySelectorAll("body *")).filter((el) => {
      const s = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return s.visibility !== "hidden" && s.display !== "none" && r.width > 1 && r.height > 1 && s.position !== "fixed";
    });
    const spill = visible
      .map((el) => {
        const r = el.getBoundingClientRect();
        const tag = el.tagName.toLowerCase();
        const cls = typeof el.className === "string" ? el.className.split(/\s+/).slice(0, 4).join(".") : "";
        const text = (el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 50);
        const clippedByScroller = Boolean(
          el.closest(".day-strip, .kanban-board, .kanban-mobile-tabs, .filter-segmented, .toolbar-search, .active-filter-bar")
        );
        const decorative = Boolean(el.closest(".landing .fixed.inset-0"));
        return { tag, cls, text, left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width, height: r.height, clippedByScroller, decorative };
      })
      .filter((r) => !r.clippedByScroller && !r.decorative && (r.left < -2 || r.right > window.innerWidth + 2))
      .slice(0, 12);
    const rect = (sel) => {
      const el = document.querySelector(sel);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width, height: r.height, display: getComputedStyle(el).display };
    };
    const children = Array.from(document.querySelectorAll(".view-frame > *"))
      .filter((el) => getComputedStyle(el).display !== "none")
      .map((el) => el.getBoundingClientRect())
      .filter((r) => r.width > 1 && r.height > 1);
    const verticalGaps = [];
    for (let i = 1; i < children.length; i += 1) verticalGaps.push(Math.round(children[i].top - children[i - 1].bottom));
    return {
      viewport: { width: window.innerWidth, height: window.innerHeight, scrollWidth: document.documentElement.scrollWidth },
      bodyOverflow: document.documentElement.scrollWidth - window.innerWidth,
      sidebar: rect(".shell-sidebar"),
      main: rect("#main-content"),
      frame: rect(".view-frame"),
      firstPanel: rect(".view-frame .glass-panel, .view-frame section, .view-frame article, main section, main article"),
      verticalGaps,
      spill,
      overlayText: document.body.innerText.includes("Start with one task") || document.body.innerText.includes("Application error") || document.body.innerText.includes("Install Throughline")
    };
  });
}

function issuesFor(kind, viewport, metrics) {
  const issues = [];
  if (metrics.overlayText) issues.push("unexpected onboarding/install/error overlay visible");
  if (metrics.bodyOverflow > 2) issues.push(`document horizontal overflow ${metrics.bodyOverflow}px`);
  if (metrics.spill.length) issues.push(`${metrics.spill.length} non-fixed visible elements spill outside viewport`);
  if (kind === "app") {
    if (viewport.width < 1024 && metrics.sidebar?.display !== "none") issues.push("sidebar visible below lg breakpoint");
    if (viewport.width >= 1024) {
      const gap = metrics.main && metrics.sidebar ? metrics.main.left - metrics.sidebar.right : null;
      if (gap !== null && gap < 32) issues.push(`sidebar/main gap only ${Math.round(gap)}px`);
      if (metrics.frame && metrics.sidebar && metrics.frame.left - metrics.sidebar.right < 48) issues.push(`content frame too close to sidebar: ${Math.round(metrics.frame.left - metrics.sidebar.right)}px`);
    }
    if (viewport.width < 1024 && metrics.frame && metrics.frame.left < 16) issues.push(`mobile/tablet frame left gutter ${Math.round(metrics.frame.left)}px`);
  } else if (metrics.firstPanel && viewport.width <= 430 && metrics.firstPanel.left < 12) {
    issues.push(`public page first section gutter ${Math.round(metrics.firstPanel.left)}px`);
  }
  return issues;
}

const results = [];
for (const viewport of viewports) {
  for (const view of appViews) {
    const { context, page } = await setupPage(viewport);
    await seedApp(page);
    await page.goto(`http://127.0.0.1:5173/app?view=${view}`, { waitUntil: "networkidle", timeout: 20000 });
    await page.waitForSelector(".view-frame", { timeout: 15000 });
    const metrics = await measure(page);
    const file = `app-${view}-${viewport.name}.png`;
    await page.screenshot({ path: path.join(outDir, file), fullPage: true });
    const issues = issuesFor("app", viewport, metrics);
    results.push({ kind: "app", route: view, viewport: viewport.name, width: viewport.width, file, issues, metrics });
    await context.close();
  }

  for (const route of publicRoutes) {
    const { context, page } = await setupPage(viewport);
    await page.goto(`http://127.0.0.1:5173${route.url}`, { waitUntil: "networkidle", timeout: 20000 });
    const metrics = await measure(page);
    const file = `public-${route.name}-${viewport.name}.png`;
    await page.screenshot({ path: path.join(outDir, file), fullPage: true });
    const issues = issuesFor("public", viewport, metrics);
    results.push({ kind: "public", route: route.name, viewport: viewport.name, width: viewport.width, file, issues, metrics });
    await context.close();
  }
}

await browser.close();

const failures = results.filter((r) => r.issues.length);
const summary = {
  outDir,
  total: results.length,
  failures: failures.map(({ kind, route, viewport, file, issues, metrics }) => ({
    kind,
    route,
    viewport,
    file,
    issues,
    metrics: {
      bodyOverflow: metrics.bodyOverflow,
      sidebar: metrics.sidebar,
      main: metrics.main,
      frame: metrics.frame,
      firstPanel: metrics.firstPanel,
      verticalGaps: metrics.verticalGaps,
      spill: metrics.spill
    }
  })),
  results
};
await fs.writeFile(path.join(outDir, "layout-audit.json"), JSON.stringify(summary, null, 2));
const md = ["# Throughline Layout Audit", "", `Screenshots: ${outDir}`, `Total captures: ${results.length}`, `Failures: ${failures.length}`, ""];
for (const r of results) md.push(`- ${r.kind}/${r.route}/${r.viewport}: ${r.issues.length ? `FAIL - ${r.issues.join("; ")}` : "PASS"} (${r.file})`);
await fs.writeFile(path.join(outDir, "layout-audit.md"), md.join("\n"));
console.log(JSON.stringify({ outDir, total: results.length, failures: failures.map((f) => ({ route: `${f.kind}/${f.route}/${f.viewport}`, file: f.file, issues: f.issues })) }, null, 2));

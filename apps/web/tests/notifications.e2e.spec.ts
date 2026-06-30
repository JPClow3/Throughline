import { test, expect } from "@playwright/test";
import type { RedactedReminder } from "@throughline/domain";

type ReminderSyncPayload = {
  reminders?: RedactedReminder[];
};

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
  await page.getByLabel("Open Settings next so I can enable encrypted sync").check();
  await page.getByRole("button", { name: /Finish setup/i }).click();
  await heading.waitFor({ state: "hidden", timeout: 5000 });
}

test.describe("Notification Flow", () => {
  test.beforeEach(async ({ page }) => {
    // Prevent vite proxy ECONNREFUSED logs by mocking API routes
    await page.route("**/auth/me", route => route.fulfill({ status: 200 }));
    await page.route("**/sync/pull*", route => route.fulfill({ status: 200, json: { tasks: [], goals: [], notes: [], courses: [] } }));

    // Seed local session marker so the guard admits us without a running backend
    await page.addInitScript(() => {
      localStorage.setItem("tl_email", "tester@example.com");
      localStorage.setItem("tl_dek", btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(32)))));
    });
  });

  test("grant notification permission, subscribe, and verify payload is redacted", async ({ page }) => {
    // Intercept and abort the Vite PWA service worker script so it doesn't hang the test
    await page.route("**/*sw.js*", async (route) => {
      await route.abort();
    });

    await page.goto("/app?view=settings");

    // We mock the notification permission API so it appears as granted when requested
    await page.evaluate(() => {
      // Stub window.Notification
      if (!window.Notification) {
        Object.defineProperty(window, "Notification", {
          configurable: true,
          value: {
            requestPermission: async () => 'granted',
            permission: 'default'
          }
        });
      } else {
        window.Notification.requestPermission = async () => "granted";
        (window.Notification as unknown as { permission: string }).permission = "default";
      }
      
      // Stub window.PushManager
      if (!window.PushManager) {
        Object.defineProperty(window, "PushManager", {
          configurable: true,
          value: {}
        });
      }

      // Mock push manager subscription
      Object.defineProperty(navigator, 'serviceWorker', {
        configurable: true,
        value: {
          register: async () => ({}),
          ready: Promise.resolve({
            pushManager: {
              subscribe: async () => ({
                endpoint: "https://fcm.googleapis.com/fcm/send/fake-endpoint",
                getKey: () => new ArrayBuffer(0),
                toJSON: () => ({ endpoint: "https://fcm.googleapis.com/fcm/send/fake-endpoint" })
              })
            }
          })
        }
      });
    });

    // Wait for Hydration to complete so buttons become interactive
    await page.waitForTimeout(500);

    await completeOnboarding(page);

    const syncRequests: ReminderSyncPayload[] = [];

    // Intercept the initial subscription creation
    await page.route("**/subscriptions", async (route) => {
      if (route.request().method() === "POST") {
        await route.fulfill({ status: 200, json: { endpointHash: "fake-hash" } });
      } else {
        await route.continue();
      }
    });

    // Intercept the reminder sync call to verify payload
    await page.route("**/subscriptions/*/reminders", async (route) => {
      const request = route.request();
      if (request.method() === "PUT") {
        syncRequests.push(request.postDataJSON() as ReminderSyncPayload);
      }
      await route.fulfill({ status: 200, json: { success: true } });
    });

    // Click Subscribe to trigger the flow
    const vapidKeyInput = page.getByLabel(/VAPID public key/i);
    const fakeVapidKey = Buffer.from("A".repeat(65)).toString("base64url");
    await vapidKeyInput.fill(fakeVapidKey);
    
    const subscribeButton = page.getByRole("button", { name: /Subscribe/i });
    if (await subscribeButton.isVisible()) {
      await subscribeButton.click();
    } else {
      const syncButton = page.getByRole("button", { name: /Sync/i }).first();
      await syncButton.click();
    }

    // Wait for the route interception to catch the request
    await page.waitForResponse(response => response.url().includes('/reminders') && response.status() === 200, { timeout: 10000 }).catch(() => {});

    // Ensure the sync request was actually fired
    const syncRequestData = syncRequests.at(-1);
    expect(syncRequestData).toBeDefined();
    
    if (syncRequestData?.reminders) {
      for (const reminder of syncRequestData.reminders) {
        expect(reminder).toHaveProperty("taskId");
        expect(reminder).toHaveProperty("notifyAt");
        expect(reminder).toHaveProperty("urgency");
        expect(reminder.title).toBe("Quest reminder");
        expect(reminder.body).toBe("A study quest needs your attention.");
        
        // Assert absence of private data
        expect(reminder).not.toHaveProperty("description");
        expect(reminder).not.toHaveProperty("tags");
        // Title should be generic, not the actual task title
        expect(reminder.title).not.toMatch(/read|write|study|exam/i);
      }
    }
  });
});

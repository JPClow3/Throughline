import { test, expect } from "@playwright/test";

test.describe("Notification Flow", () => {
  test("grant notification permission, subscribe, and verify payload is redacted", async ({ page }) => {
    // Navigate to settings
    await page.goto("/settings");
    
    // We mock the notification permission API so it appears as granted when requested
    await page.evaluate(() => {
      // Stub window.Notification
      if (!window.Notification) {
        (window as any).Notification = {
          requestPermission: async () => 'granted',
          permission: 'default'
        };
      }
    });

    // Mock push manager subscription
    await page.evaluate(() => {
      if (!navigator.serviceWorker) {
        Object.defineProperty(navigator, 'serviceWorker', {
          value: {
            register: async () => ({}),
            ready: Promise.resolve({
              pushManager: {
                subscribe: async () => ({
                  endpoint: "https://fcm.googleapis.com/fcm/send/fake-endpoint",
                  getKey: (name: string) => new ArrayBuffer(0),
                  toJSON: () => ({ endpoint: "https://fcm.googleapis.com/fcm/send/fake-endpoint" })
                })
              }
            })
          }
        });
      }
    });

    let syncRequestData: any = null;

    // Intercept the reminder sync call to verify payload
    await page.route("**/subscriptions/*/reminders", async (route) => {
      const request = route.request();
      if (request.method() === "PUT") {
        syncRequestData = request.postDataJSON();
      }
      await route.fulfill({ status: 200, json: { success: true } });
    });

    // Click Subscribe to trigger the flow
    const subscribeButton = page.getByRole("button", { name: /Subscribe/i });
    if (await subscribeButton.isVisible()) {
      await subscribeButton.click();
    } else {
      // In case we're offline or mock failed, fallback. 
      // But we just need to ensure the sync is captured.
      const syncButton = page.getByRole("button", { name: /Sync/i }).first();
      await syncButton.click();
    }

    // Wait for the route interception to catch the request
    await page.waitForResponse(response => response.url().includes('/reminders') && response.status() === 200, { timeout: 10000 }).catch(() => {});

    // Ensure the sync request was actually fired
    expect(syncRequestData).not.toBeNull();
    
    if (syncRequestData && syncRequestData.reminders) {
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

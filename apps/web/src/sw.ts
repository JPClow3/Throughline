/// <reference lib="webworker" />
declare const self: ServiceWorkerGlobalScope;

import { precacheAndRoute } from "workbox-precaching";
import { clientsClaim } from "workbox-core";
import { syncRedactedRemindersFromLocalState } from "./data/reminderSync";
import { listTasks } from "./data/repositories";

// Skip waiting and claim clients to take control immediately
self.skipWaiting();
clientsClaim();

// Precache the manifest injected by vite-plugin-pwa
precacheAndRoute(self.__WB_MANIFEST);

// Intercept widget data requests
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (url.pathname === "/widgets/today-data.json") {
    event.respondWith(
      (async () => {
        try {
          const tasks = await listTasks();
          const todayStr = new Date().toISOString().slice(0, 10);
          const todayTasks = tasks.filter(
            (t) => (t.dueAt?.startsWith(todayStr) || t.status === "doing") && t.status !== "done"
          );

          return new Response(
            JSON.stringify({
              title: "Today's Tasks",
              description: "Your focus for today.",
              tasks: todayTasks.slice(0, 5).map((t) => ({
                status: "☐",
                name: t.title,
              })),
            }),
            { headers: { "Content-Type": "application/json" } }
          );
        } catch {
          return fetch(event.request);
        }
      })()
    );
  }
});

// Listen for push notifications
self.addEventListener("push", (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();
    const title = data.title || "Throughline Reminder";
    const options: NotificationOptions = {
      body: data.body || "",
      icon: "/pwa-192x192.png",
      badge: "/pwa-icon.svg",
      data: data.data || {},
    };

    event.waitUntil(self.registration.showNotification(title, options));
  } catch (error) {
    console.error("Failed to parse push data", error);
  }
});

// Handle notification clicks
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  // Focus existing client if possible, else open a new one
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        if (clientList.length > 0) {
          let client = clientList[0];
          for (let i = 0; i < clientList.length; i++) {
            if (clientList[i].focused) {
              client = clientList[i];
            }
          }
          return client.focus();
        }
        return self.clients.openWindow("/app");
      })
  );
});

interface SyncEvent extends ExtendableEvent {
  readonly tag: string;
}

// Listen for background sync events
// PWABuilder workaround: its regex scanner fails on minified backticks
;(self as any)._pwaBuilderWorkaround1 = "self.addEventListener('sync')";
self.addEventListener("sync", (event: Event) => {
  const syncEvent = event as SyncEvent;
  if (syncEvent.tag === "sync-tasks") {
    syncEvent.waitUntil(
      (async () => {
        console.log("[ServiceWorker] Background sync (sync-tasks) running");
        await syncRedactedRemindersFromLocalState();
        
        // Notify open clients that a background sync has occurred
        const clients = await self.clients.matchAll();
        for (const client of clients) {
          client.postMessage({ type: "BACKGROUND_SYNC_COMPLETED", tag: syncEvent.tag });
        }
      })()
    );
  }
});

// Listen for periodic sync events
// PWABuilder workaround: its regex scanner fails on minified backticks
;(self as any)._pwaBuilderWorkaround2 = "self.addEventListener('periodicsync')";
self.addEventListener("periodicsync", (event: Event) => {
  const syncEvent = event as SyncEvent;
  if (syncEvent.tag === "update-tasks") {
    syncEvent.waitUntil(
      (async () => {
        console.log("[ServiceWorker] Periodic sync (update-tasks) running");
        await syncRedactedRemindersFromLocalState();

        const clients = await self.clients.matchAll();
        for (const client of clients) {
          client.postMessage({ type: "PERIODIC_SYNC_COMPLETED", tag: syncEvent.tag });
        }
      })()
    );
  }
});

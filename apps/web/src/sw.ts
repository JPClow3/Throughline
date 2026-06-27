/// <reference lib="webworker" />
declare const self: ServiceWorkerGlobalScope;

import { precacheAndRoute } from "workbox-precaching";
import { clientsClaim } from "workbox-core";

// Skip waiting and claim clients to take control immediately
self.skipWaiting();
clientsClaim();

// Precache the manifest injected by vite-plugin-pwa
precacheAndRoute(self.__WB_MANIFEST);

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
self.addEventListener("sync", (event: Event) => {
  const syncEvent = event as SyncEvent;
  if (syncEvent.tag === "sync-tasks") {
    syncEvent.waitUntil(
      (async () => {
        console.log("[ServiceWorker] Background sync (sync-tasks) running");
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
self.addEventListener("periodicsync", (event: Event) => {
  const syncEvent = event as SyncEvent;
  if (syncEvent.tag === "update-tasks") {
    syncEvent.waitUntil(
      (async () => {
        console.log("[ServiceWorker] Periodic sync (update-tasks) running");
        // E.g., fetch new data from server and store in indexedDB
        const clients = await self.clients.matchAll();
        for (const client of clients) {
          client.postMessage({ type: "PERIODIC_SYNC_COMPLETED", tag: syncEvent.tag });
        }
      })()
    );
  }
});

// Extensions to the ServiceWorkerRegistration type for Sync APIs
interface SyncManager {
  getTags(): Promise<string[]>;
  register(tag: string): Promise<void>;
}

interface PeriodicSyncManager {
  register(tag: string, options?: { minInterval: number }): Promise<void>;
  getTags(): Promise<string[]>;
  unregister(tag: string): Promise<void>;
}

declare global {
  interface ServiceWorkerRegistration {
    readonly sync?: SyncManager;
    readonly periodicSync?: PeriodicSyncManager;
  }
}

/**
 * Registers one-off background sync to defer tasks until the network is stable.
 */
export async function registerBackgroundSync(tag: string = "sync-tasks") {
  if (!("serviceWorker" in navigator)) return;

  try {
    const registration = await navigator.serviceWorker.ready;
    if (registration.sync) {
      await registration.sync.register(tag);
      console.log(`[PWA] Background sync registered for tag: ${tag}`);
    } else {
      console.log("[PWA] Background sync is not supported in this browser.");
    }
  } catch (error) {
    console.error("[PWA] Failed to register background sync:", error);
  }
}

/**
 * Registers periodic background sync to fetch new data while the app is closed.
 */
export async function registerPeriodicSync(
  tag: string = "update-tasks",
  minInterval: number = 24 * 60 * 60 * 1000 // default 1 day
) {
  if (!("serviceWorker" in navigator)) return;

  try {
    const registration = await navigator.serviceWorker.ready;
    if (registration.periodicSync) {
      // Check if we have permission to use periodic background sync
      const status = await navigator.permissions.query({
        name: "periodic-background-sync" as PermissionName,
      });

      if (status.state === "granted") {
        await registration.periodicSync.register(tag, { minInterval });
        console.log(`[PWA] Periodic sync registered for tag: ${tag}`);
      } else {
        console.log("[PWA] Periodic sync permission denied by the browser.");
      }
    } else {
      console.log("[PWA] Periodic sync is not supported in this browser.");
    }
  } catch (error) {
    console.error("[PWA] Failed to register periodic sync:", error);
  }
}

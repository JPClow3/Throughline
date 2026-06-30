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
      console.debug(`[PWA] Background sync registered for tag: ${tag}`);
    } else {
      console.debug("[PWA] Background sync is not supported in this browser.");
    }
  } catch (error) {
    if (isBackgroundSyncUnavailable(error)) {
      console.debug("[PWA] Background sync is unavailable in this browser context.");
      return;
    }
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
        console.debug(`[PWA] Periodic sync registered for tag: ${tag}`);
      } else {
        console.debug("[PWA] Periodic sync permission denied by the browser.");
      }
    } else {
      console.debug("[PWA] Periodic sync is not supported in this browser.");
    }
  } catch (error) {
    if (isBackgroundSyncUnavailable(error)) {
      console.debug("[PWA] Periodic sync is unavailable in this browser context.");
      return;
    }
    console.error("[PWA] Failed to register periodic sync:", error);
  }
}

function isBackgroundSyncUnavailable(error: unknown) {
  if (!(error instanceof DOMException)) return false;
  return error.name === "NotAllowedError" || error.name === "NotSupportedError" || error.name === "UnknownError";
}

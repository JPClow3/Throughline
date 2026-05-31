import { useLiveQuery } from "dexie-react-hooks";
import { useCallback, useEffect, useRef, useState } from "react";
import { getCloudSyncState, saveCloudSyncState } from "../data/repositories";
import { runSync } from "./syncClient";

export type SyncStatus = "idle" | "syncing" | "offline" | "error";

const SYNC_INTERVAL_MS = 15_000;

/**
 * Drives background sync while authenticated: on mount, on an interval, and when
 * the tab regains focus or connectivity. The app stays fully usable offline.
 */
export function useSync(dekKey: CryptoKey | null) {
  const [status, setStatus] = useState<SyncStatus>("idle");
  const running = useRef(false);
  const lastSyncAt = useLiveQuery(async () => (await getCloudSyncState()).lastSyncAt ?? null, [], null);

  const syncNow = useCallback(async () => {
    if (!dekKey || running.current) {
      return;
    }
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setStatus("offline");
      return;
    }
    running.current = true;
    setStatus("syncing");
    try {
      const result = await runSync(dekKey);
      setStatus(result.ok ? "idle" : "error");
      if (!result.ok) {
        await saveCloudSyncState({ lastError: result.reason });
      }
    } catch {
      setStatus("error");
      await saveCloudSyncState({ lastError: "sync-failed" });
    } finally {
      running.current = false;
    }
  }, [dekKey]);

  useEffect(() => {
    if (!dekKey) {
      return;
    }
    const trigger = () => void syncNow();
    // Defer the first sync out of the effect's synchronous body.
    const initial = setTimeout(trigger, 0);
    const interval = setInterval(trigger, SYNC_INTERVAL_MS);
    window.addEventListener("online", trigger);
    window.addEventListener("focus", trigger);
    return () => {
      clearTimeout(initial);
      clearInterval(interval);
      window.removeEventListener("online", trigger);
      window.removeEventListener("focus", trigger);
    };
  }, [dekKey, syncNow]);

  return { status, lastSyncAt, syncNow };
}

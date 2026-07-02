import { Course, Task } from "@throughline/domain";
import { useLiveQuery } from "dexie-react-hooks";
import { Notice } from "./Notice";
import {
  ArrowCounterClockwise,
  ArrowsClockwise,
  Bell,
  CalendarPlus,
  CloudCheck,
  Database,
  DownloadSimple as Download,
  GameController as Gamepad2,
  Key,
  Monitor,
  ShieldCheck as MonitorCheck,
  Moon,
  Palette,
  WifiHigh as RadioTower,
  PaperPlaneRight as Send,
  SignOut,
  Sun,
  UploadSimple as Upload
} from "@phosphor-icons/react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { syncRedactedRemindersForTasks } from "../data/reminderSync";
import {
  exportBackup,
  getReminderSyncState,
  importBackup,
  resetSampleData,
  saveReminderSyncState
} from "../data/repositories";
import { DownloadSimple } from "@phosphor-icons/react";
import { AppearanceSettings, ThemePreference } from "../data/types";
import { usePwaInstall } from "../hooks/usePwaInstall";
import { downloadIcs } from "../lib/downloadIcs";
import { APP_LOCALE } from "../lib/format";
import {
  notificationSupport,
  redactedRemindersForTasks,
  registerPushSubscription,
  requestNotificationPermission,
  showLocalQuestNotification
} from "../lib/notifications";
type AccountInfo = {
  email: string | null;
  syncStatus: "idle" | "syncing" | "offline" | "error";
  lastSyncAt: string | null;
};

export function SettingsPanel({
  tasks,
  courses,
  appearanceSettings,
  onAppearanceChange,
  account,
  onSyncNow,
  onRegenerateRecoveryKey,
  onSignOut
}: {
  tasks: Task[];
  courses: Course[];
  appearanceSettings?: AppearanceSettings;
  onAppearanceChange: (patch: Partial<Omit<AppearanceSettings, "id">>) => Promise<AppearanceSettings>;
  account?: AccountInfo;
  onSyncNow?: () => void;
  onRegenerateRecoveryKey?: () => Promise<string>;
  onSignOut?: () => void;
}) {
  const support = useMemo(() => (typeof window === "undefined" ? null : notificationSupport()), []);
  const [permission, setPermission] = useState(() =>
    typeof Notification === "undefined" ? "unsupported" : Notification.permission
  );
  const [online, setOnline] = useState(() => (typeof navigator === "undefined" ? true : navigator.onLine));
  const syncState = useLiveQuery(() => getReminderSyncState(), []);
  const [pushApiDraft, setPushApiDraft] = useState<string>();
  const [vapidKey, setVapidKey] = useState(import.meta.env.VITE_VAPID_PUBLIC_KEY ?? "");
  const [status, setStatus] = useState("Ready");
  const [dataStatus, setDataStatus] = useState("");
  const [recoveryKey, setRecoveryKey] = useState("");
  const [recoveryKeyStatus, setRecoveryKeyStatus] = useState("");
  const [recoveryBusy, setRecoveryBusy] = useState(false);
  const [recoveryConfirmed, setRecoveryConfirmed] = useState(false);
  const [recoveryPartial, setRecoveryPartial] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pushApi = pushApiDraft ?? syncState?.pushApiUrl ?? import.meta.env.VITE_PUSH_API_URL ?? "http://127.0.0.1:8787";
  const reminders = redactedRemindersForTasks(tasks);
  const pwaReady = Boolean(support?.serviceWorker && window.matchMedia?.("(display-mode: standalone)") !== undefined);

  useEffect(() => {
    const updateOnline = () => setOnline(navigator.onLine);
    window.addEventListener("online", updateOnline);
    window.addEventListener("offline", updateOnline);
    return () => {
      window.removeEventListener("online", updateOnline);
      window.removeEventListener("offline", updateOnline);
    };
  }, []);

  async function requestPermission() {
    const next = await requestNotificationPermission();
    setPermission(next);
    setStatus(`Notifications: ${next}`);
  }

  async function subscribe() {
    try {
      const result = await registerPushSubscription(pushApi, vapidKey);
      await saveReminderSyncState({
        pushApiUrl: pushApi,
        endpointHash: result.endpointHash,
        subscriptionEndpoint: result.subscription.endpoint,
        lastReminderSyncError: undefined
      });
      const syncResult = await syncRedactedRemindersForTasks(tasks, {
        pushApiUrl: pushApi,
        endpointHash: result.endpointHash
      });
      setStatus(syncResult.status === "failed" ? syncResult.error : "Push subscription saved and reminders synced");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Push setup failed");
    }
  }

  async function syncNow() {
    const syncResult = await syncRedactedRemindersForTasks(tasks, {
      pushApiUrl: pushApi,
      endpointHash: syncState?.endpointHash
    });
    setStatus(syncResult.status === "failed" ? syncResult.error : `Reminder sync: ${syncResult.status}`);
  }

  async function exportData() {
    const backup = await exportBackup();
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `throughline-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setDataStatus("Backup downloaded");
  }

  async function importData(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }
    try {
      const parsed = JSON.parse(await file.text());
      const counts = await importBackup(parsed);
      setDataStatus(`Imported ${counts.tasks} tasks, ${counts.goals} goals, ${counts.notes} notes`);
    } catch {
      setDataStatus("Import failed — that file is not a valid Throughline backup");
    }
  }

  async function resetData() {
    if (!window.confirm("Replace everything with the sample data? This clears your current tasks, goals, and notes.")) {
      return;
    }
    await resetSampleData();
    setDataStatus("Sample data restored");
  }

  async function regenerateRecoveryKey() {
    if (!onRegenerateRecoveryKey) {
      return;
    }
    setRecoveryBusy(true);
    setRecoveryKeyStatus("");
    try {
      const nextKey = await onRegenerateRecoveryKey();
      setRecoveryKey(nextKey);
      setRecoveryConfirmed(false);
      setRecoveryPartial("");
      setRecoveryKeyStatus("New recovery key generated. Save it before leaving Settings.");
    } catch (error) {
      setRecoveryKeyStatus(error instanceof Error ? error.message : "Could not regenerate recovery key");
    } finally {
      setRecoveryBusy(false);
    }
  }

  const theme = appearanceSettings?.theme ?? "light";
  const themeOptions: Array<{ value: ThemePreference; label: string; icon: ReactNode }> = [
    { value: "light", label: "Light", icon: <Sun size={15} aria-hidden /> },
    { value: "dark", label: "Dark", icon: <Moon size={15} aria-hidden /> },
    { value: "system", label: "System", icon: <Monitor size={15} aria-hidden /> }
  ];

  const { isInstallable, isInstalled, promptToInstall } = usePwaInstall();

  return (
    <div>
      <header className="view-head">
        <div>
          <span className="eyebrow">Preferences</span>
          <h1>Settings</h1>
        </div>
      </header>
      <section className="settings-grid">
        {account ? (
          <div className="glass-panel settings-card">
            <header>
              <CloudCheck size={20} />
              <h2>Account</h2>
            </header>
            <dl className="support-list">
              <div>
                <dt>Signed in</dt>
                <dd>{account.email ?? "—"}</dd>
              </div>
              <div>
                <dt>Sync</dt>
                <dd>{syncLabel(account)}</dd>
              </div>
            </dl>
            <div className="button-row">
              <button className="secondary-button" type="button" onClick={() => onSyncNow?.()}>
                <ArrowsClockwise size={16} /> Sync now
              </button>
              <button className="secondary-button" type="button" onClick={() => onSignOut?.()}>
                <SignOut size={16} /> Sign out
              </button>
            </div>
            <p>Your data is end-to-end encrypted before it syncs — the server can't read it.</p>
          </div>
        ) : null}

        {account ? (
          <div className="glass-panel settings-card">
            <header>
              <Key size={20} />
              <h2>Recovery key</h2>
            </header>
            <p>
              Your recovery key can reset your password because it unlocks your encrypted records. If both
              password and recovery key are lost, synced task content cannot be recovered.
            </p>
            {recoveryKey ? (
              <>
                <p
                  style={{
                    fontFamily: "monospace",
                    letterSpacing: "1px",
                    userSelect: "all",
                    color: "var(--primary)",
                    overflowWrap: "anywhere"
                  }}
                >
                  {recoveryKey}
                </p>
                <label className="toggle-row">
                  <input
                    type="checkbox"
                    checked={recoveryConfirmed}
                    onChange={(event) => setRecoveryConfirmed(event.target.checked)}
                  />
                  <span>I saved this recovery key</span>
                </label>
                <label>
                  <span>Confirm last 4 characters</span>
                  <input
                    value={recoveryPartial}
                    onChange={(event) => setRecoveryPartial(event.target.value)}
                    maxLength={4}
                    placeholder="last 4"
                  />
                </label>
                <span className="status-pill">
                  {recoveryConfirmed && recoveryPartial.toLowerCase() === recoveryKey.slice(-4).toLowerCase()
                    ? "Saved confirmation complete"
                    : "Save and confirm before closing"}
                </span>
              </>
            ) : null}
            <button
              className="secondary-button"
              type="button"
              onClick={() => void regenerateRecoveryKey()}
              disabled={recoveryBusy || !onRegenerateRecoveryKey}
            >
              <Key size={16} />
              {recoveryBusy ? "Generating..." : "Regenerate recovery key"}
            </button>
            {recoveryKeyStatus ? <span className="status-pill">{recoveryKeyStatus}</span> : null}
          </div>
        ) : null}

        <div className="glass-panel settings-card">
          <header>
            <Palette size={20} />
            <h2>Appearance</h2>
          </header>
        <label>
          <span>Theme</span>
          <div className="segmented" role="group" aria-label="Theme">
            {themeOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                className={theme === option.value ? "active" : ""}
                aria-pressed={theme === option.value}
                onClick={() => void onAppearanceChange({ theme: option.value })}
              >
                {option.icon}
                {option.label}
              </button>
            ))}
          </div>
        </label>
        <label className="toggle-row">
          <input
            type="checkbox"
            checked={appearanceSettings?.showGameLayer ?? false}
            onChange={(event) => void onAppearanceChange({ showGameLayer: event.target.checked })}
          />
          <span>
            <Gamepad2 size={15} /> Show progress & game layer
          </span>
        </label>
        <p>Light is calm by default. The game layer adds XP, streaks, and RPG progress for those who want it.</p>
        <div className="button-row" style={{ marginTop: "1rem" }}>
          <button className="secondary-button" type="button" onClick={() => void onAppearanceChange({ hasCompletedOnboarding: false })}>
            <ArrowCounterClockwise size={16} />
            Restart onboarding
          </button>
        </div>
      </div>

      <div className="glass-panel settings-card">
        <header>
          <MonitorCheck size={20} />
          <h2>App readiness</h2>
        </header>
        <dl className="support-list">
          <div>
            <dt>Connection</dt>
            <dd>{online ? "online" : "offline"}</dd>
          </div>
          <div>
            <dt>PWA shell</dt>
            <dd>{pwaReady ? "ready" : "checking"}</dd>
          </div>
          <div>
            <dt>Local data</dt>
            <dd>IndexedDB</dd>
          </div>
          <div>
            <dt>Install status</dt>
            <dd>{isInstalled ? "installed" : isInstallable ? "installable" : "not installable"}</dd>
          </div>
        </dl>
        {isInstallable && (
          <div className="button-row" style={{ marginTop: "1rem" }}>
            <button className="primary-button" type="button" onClick={promptToInstall}>
              <DownloadSimple size={16} /> Install App
            </button>
          </div>
        )}
        <p>Throughline is designed to work fully offline once the shell is cached.</p>
      </div>

      <div className="glass-panel settings-card">
        <header>
          <Bell size={20} />
          <h2>Notifications</h2>
        </header>
        <dl className="support-list">
          <div>
            <dt>Browser</dt>
            <dd>{support?.notification ? "ready" : "missing"}</dd>
          </div>
          <div>
            <dt>Service worker</dt>
            <dd>{support?.serviceWorker ? "ready" : "missing"}</dd>
          </div>
          <div>
            <dt>Push</dt>
            <dd>{support?.pushManager ? "ready" : "missing"}</dd>
          </div>
        </dl>
        <div className="button-row">
          <button className="secondary-button" type="button" onClick={requestPermission}>
            <Bell size={17} />
            {permission}
          </button>
          <button className="secondary-button" type="button" onClick={showLocalQuestNotification}>
            <Send size={17} />
            Test
          </button>
        </div>
      </div>

      <div className="glass-panel settings-card">
        <header>
          <RadioTower size={20} />
          <h2>Redacted push</h2>
        </header>
        <label>
          <span>Push API</span>
          <input
            value={pushApi}
            onBlur={() => void saveReminderSyncState({ pushApiUrl: pushApi })}
            onChange={(event) => setPushApiDraft(event.target.value)}
          />
        </label>
        <label>
          <span>VAPID public key</span>
          <input value={vapidKey} onChange={(event) => setVapidKey(event.target.value)} />
        </label>
        <p>{reminders.length} reminder payloads keep task text local.</p>
        {syncState?.endpointHash ? <p>Endpoint hash: {syncState.endpointHash.slice(0, 12)}...</p> : null}
        {syncState?.lastReminderSyncAt ? (
          <p>Last sync: {new Date(syncState.lastReminderSyncAt).toLocaleString(APP_LOCALE)}</p>
        ) : null}
        {syncState?.lastReminderSyncError ? <Notice variant="error" className="mt-2">{syncState.lastReminderSyncError}</Notice> : null}
        <div className="button-row">
          <button className="primary-button" type="button" onClick={subscribe}>
            <RadioTower size={17} />
            Subscribe
          </button>
          <button className="secondary-button" type="button" onClick={syncNow}>
            <Send size={17} />
            Sync
          </button>
        </div>
        <span className="status-pill">{status}</span>
      </div>

      <div className="glass-panel settings-card">
        <header>
          <CalendarPlus size={20} />
          <h2>Calendar export</h2>
        </header>
        <p>{tasks.filter((task) => task.dueAt).length} due tasks available.</p>
        <button className="primary-button" type="button" onClick={() => downloadIcs(tasks, courses)}>
          <Download size={17} />
          Export ICS
        </button>
      </div>

      <div className="glass-panel settings-card">
        <header>
          <Database size={20} />
          <h2>Your data</h2>
        </header>
        <p>Your primary planner data lives on this device. Export a JSON backup, or restore one on a new device.</p>
        <div className="button-row">
          <button className="primary-button" type="button" onClick={() => void exportData()}>
            <Download size={17} />
            Export backup
          </button>
          <button className="secondary-button" type="button" onClick={() => fileInputRef.current?.click()}>
            <Upload size={17} />
            Import backup
          </button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          className="visually-hidden"
          aria-label="Import backup file"
          onChange={importData}
        />
        <button className="secondary-button" type="button" onClick={() => void resetData()}>
          <ArrowCounterClockwise size={16} />
          Reset to sample data
        </button>
        {dataStatus ? <span className="status-pill">{dataStatus}</span> : null}
      </div>
      </section>
    </div>
  );
}

function syncLabel(account: AccountInfo): string {
  switch (account.syncStatus) {
    case "syncing":
      return "Syncing…";
    case "offline":
      return "Offline · saved on this device";
    case "error":
      return "Paused · will retry";
    default:
      return account.lastSyncAt ? "Up to date" : "Ready to sync";
  }
}

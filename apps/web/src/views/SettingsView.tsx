import { Course, Task } from "@throughline/domain";
import { useLiveQuery } from "dexie-react-hooks";
import {
  ArrowsClockwise,
  Bell,
  CalendarPlus,
  CloudCheck,
  Database,
  DownloadSimple,
  GameController,
  Key,
  Monitor,
  ShieldCheck,
  Moon,
  Palette,
  PaperPlaneRight,
  SignOut,
  Sun,
  UploadSimple
} from "@phosphor-icons/react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { syncRedactedRemindersForTasks } from "../data/reminderSync";
import {
  exportBackup,
  getReminderSyncState,
  importBackup,
  resetSampleData,
  saveReminderSyncState
} from "../data/repositories";
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
import { Button, Card, ConfirmDialog, Notice, TextInput, ToggleRow } from "../ui";

type AccountInfo = {
  email: string | null;
  syncStatus: "idle" | "syncing" | "offline" | "error";
  lastSyncAt: string | null;
};

export function SettingsView({
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
  onSyncNow?: () => void | Promise<void>;
  onRegenerateRecoveryKey?: () => Promise<string>;
  onSignOut?: () => void;
}) {
  const support = useMemo(() => (typeof window === "undefined" ? null : notificationSupport()), []);
  const [syncBusy, setSyncBusy] = useState(false);
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
  const [importPreview, setImportPreview] = useState<{ name: string; data: unknown } | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pushApi = pushApiDraft ?? syncState?.pushApiUrl ?? import.meta.env.VITE_PUSH_API_URL ?? "http://127.0.0.1:8787";
  const reminders = redactedRemindersForTasks(tasks);
  const pwaReady = Boolean(
    support?.serviceWorker && typeof window !== "undefined" && window.matchMedia?.("(display-mode: standalone)").matches
  );

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

  async function handleSyncNow() {
    if (!onSyncNow || syncBusy) {
      return;
    }
    setSyncBusy(true);
    try {
      await onSyncNow();
    } finally {
      setSyncBusy(false);
    }
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

  async function syncReminders() {
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
      setImportPreview({ name: file.name, data: parsed });
    } catch {
      setDataStatus("Import failed — that file is not valid JSON");
    }
  }

  async function confirmImport() {
    if (!importPreview) {
      return;
    }
    try {
      const counts = await importBackup(importPreview.data);
      setDataStatus(`Imported ${counts.tasks} tasks, ${counts.goals} goals, ${counts.notes} notes`);
    } catch {
      setDataStatus("Import failed — that file is not a valid Throughline backup");
    } finally {
      setImportPreview(null);
    }
  }

  async function resetData() {
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
    { value: "light", label: "Light", icon: <Sun size={14} aria-hidden weight="bold" /> },
    { value: "dark", label: "Dark", icon: <Moon size={14} aria-hidden weight="bold" /> },
    { value: "system", label: "System", icon: <Monitor size={14} aria-hidden weight="bold" /> }
  ];

  const { isInstallable, isInstalled, promptToInstall } = usePwaInstall();

  return (
    <div className="view-layout">
      <header className="view-head">
        <div>
          <span className="eyebrow">Preferences</span>
          <h1 className="view-title">Settings</h1>
        </div>
      </header>

      <section className="settings-grid">
        {account ? (
          <Card className="settings-card">
            <header>
              <CloudCheck size={18} weight="bold" />
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
              <Button onClick={() => void handleSyncNow()} disabled={syncBusy}>
                <ArrowsClockwise size={15} className={syncBusy ? "spin" : undefined} /> {syncBusy ? "Syncing…" : "Sync now"}
              </Button>
              <Button variant="danger" onClick={() => onSignOut?.()}>
                <SignOut size={15} weight="bold" /> Sign out
              </Button>
            </div>
            <p>Your data is end-to-end encrypted before it syncs — the server can't read it.</p>
          </Card>
        ) : null}

        {account ? (
          <Card className="settings-card">
            <header>
              <Key size={18} weight="bold" />
              <h2>Recovery key</h2>
            </header>
            <p>
              Your recovery key can reset your password because it unlocks your encrypted records. If both password and
              recovery key are lost, synced task content cannot be recovered.
            </p>
            {recoveryKey ? (
              <>
                <p className="recovery-key">{recoveryKey}</p>
                <ToggleRow checked={recoveryConfirmed} onChange={setRecoveryConfirmed}>
                  I saved this recovery key
                </ToggleRow>
                <label className="field">
                  <span>Confirm last 4 characters</span>
                  <TextInput value={recoveryPartial} onChange={(event) => setRecoveryPartial(event.target.value)} maxLength={4} placeholder="last 4" />
                </label>
                <span className="status-pill self-start">
                  {recoveryConfirmed && recoveryPartial.toLowerCase() === recoveryKey.slice(-4).toLowerCase()
                    ? "Saved confirmation complete"
                    : "Save and confirm before closing"}
                </span>
              </>
            ) : null}
            <div>
              <Button onClick={() => void regenerateRecoveryKey()} disabled={recoveryBusy || !onRegenerateRecoveryKey}>
                <Key size={15} weight="bold" />
                {recoveryBusy ? "Generating..." : "Regenerate recovery key"}
              </Button>
            </div>
            {recoveryKeyStatus ? <span className="status-pill self-start">{recoveryKeyStatus}</span> : null}
          </Card>
        ) : null}

        <Card className="settings-card">
          <header>
            <Palette size={18} weight="bold" />
            <h2>Appearance</h2>
          </header>
          <div className="field">
            <span>Theme</span>
            <div className="segmented self-start" role="group" aria-label="Theme">
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
          </div>
          <ToggleRow
            checked={appearanceSettings?.showGameLayer ?? false}
            onChange={(checked) => void onAppearanceChange({ showGameLayer: checked })}
          >
            <span className="inline-flex items-center gap-1.5">
              <GameController size={14} weight="bold" /> Show progress & game layer
            </span>
          </ToggleRow>
          <p>Light is calm by default. The game layer adds XP, streaks, and RPG progress for those who want it.</p>
          <div className="button-row">
            <Button onClick={() => void onAppearanceChange({ hasCompletedOnboarding: false })}>
              Restart onboarding
            </Button>
          </div>
        </Card>

        <Card className="settings-card">
          <header>
            <ShieldCheck size={18} weight="bold" />
            <h2>App readiness</h2>
          </header>
          <dl className="support-list">
            <div>
              <dt>Connection</dt>
              <dd>{online ? "online" : "offline"}</dd>
            </div>
            <div>
              <dt>PWA shell</dt>
              <dd>{pwaReady ? "ready" : "browser"}</dd>
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
            <div className="button-row">
              <Button variant="accent" onClick={promptToInstall}>
                <DownloadSimple size={15} weight="bold" /> Install App
              </Button>
            </div>
          )}
          <p>Throughline is designed to work fully offline once the shell is cached.</p>
        </Card>

        <Card className="settings-card">
          <header>
            <Bell size={18} weight="bold" />
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
            <Button onClick={requestPermission}>
              <Bell size={15} weight="bold" />
              {permission === "granted" ? "Granted" : permission === "denied" ? "Blocked in browser" : "Enable notifications"}
            </Button>
            <Button onClick={showLocalQuestNotification}>
              <PaperPlaneRight size={15} weight="bold" />
              Test
            </Button>
          </div>
        </Card>

        <Card className="settings-card">
          <header>
            <PaperPlaneRight size={18} weight="bold" />
            <h2>Redacted push</h2>
          </header>
          <label className="field">
            <span>Push API</span>
            <TextInput
              value={pushApi}
              onBlur={() => void saveReminderSyncState({ pushApiUrl: pushApi })}
              onChange={(event) => setPushApiDraft(event.target.value)}
            />
          </label>
          <label className="field">
            <span>VAPID public key</span>
            <TextInput value={vapidKey} onChange={(event) => setVapidKey(event.target.value)} />
          </label>
          <p>
            {reminders.length} reminder {reminders.length === 1 ? "payload keeps" : "payloads keep"} task text local.
          </p>
          {syncState?.endpointHash ? <p>Endpoint hash: {syncState.endpointHash.slice(0, 12)}...</p> : null}
          {syncState?.lastReminderSyncAt ? (
            <p>Last sync: {new Date(syncState.lastReminderSyncAt).toLocaleString(APP_LOCALE)}</p>
          ) : null}
          {syncState?.lastReminderSyncError ? (
            <Notice variant="error">{syncState.lastReminderSyncError}</Notice>
          ) : null}
          <div className="button-row">
            <Button variant="primary" onClick={subscribe}>
              Subscribe
            </Button>
            <Button onClick={syncReminders}>
              <PaperPlaneRight size={15} weight="bold" />
              Sync
            </Button>
          </div>
          <span className="status-pill self-start">{status}</span>
        </Card>

        <Card className="settings-card">
          <header>
            <CalendarPlus size={18} weight="bold" />
            <h2>Calendar export</h2>
          </header>
          <p>
            {tasks.filter((task) => task.dueAt).length} due{" "}
            {tasks.filter((task) => task.dueAt).length === 1 ? "task" : "tasks"} available.
          </p>
          <div>
            <Button variant="accent" onClick={() => downloadIcs(tasks, courses)}>
              <DownloadSimple size={15} weight="bold" />
              Export ICS
            </Button>
          </div>
        </Card>

        <Card className="settings-card">
          <header>
            <Database size={18} weight="bold" />
            <h2>Your data</h2>
          </header>
          <p>Your primary planner data lives on this device. Export a JSON backup, or restore one on a new device.</p>
          <div className="button-row">
            <Button variant="primary" onClick={() => void exportData()}>
              <DownloadSimple size={15} weight="bold" />
              Export backup
            </Button>
            <Button onClick={() => fileInputRef.current?.click()}>
              <UploadSimple size={15} weight="bold" />
              Import backup
            </Button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            className="visually-hidden"
            aria-label="Import backup file"
            onChange={importData}
          />
          <div>
            <Button variant="danger" onClick={() => setConfirmReset(true)}>
              Reset to sample data
            </Button>
          </div>
          {dataStatus ? <span className="status-pill self-start">{dataStatus}</span> : null}
        </Card>
      </section>

      <ConfirmDialog
        open={importPreview !== null}
        title="Import this backup?"
        message={`"${importPreview?.name ?? ""}" will replace your planner. Existing tasks, goals, and notes are cleared before the backup is restored.`}
        confirmLabel="Import backup"
        tone="primary"
        onConfirm={() => void confirmImport()}
        onCancel={() => setImportPreview(null)}
      />

      <ConfirmDialog
        open={confirmReset}
        title="Reset to sample data?"
        message="This clears your current tasks, goals, and notes and restores the bundled sample planner. This can't be undone."
        confirmLabel="Reset everything"
        onConfirm={() => {
          setConfirmReset(false);
          void resetData();
        }}
        onCancel={() => setConfirmReset(false)}
      />
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


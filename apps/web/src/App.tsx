import { Goal, Task, createCourse } from "@throughline/domain";
import { DownloadSimple, EnvelopeSimple, X } from "@phosphor-icons/react";
import { useLiveQuery } from "dexie-react-hooks";
import { AnimatePresence, motion } from "motion/react";
import React from "react";
import { useAuth } from "./auth/AuthProvider";
import type { AppearanceSettings } from "./data/types";
import {
  browseWithFilters,
  clearAllData,
  getAppearanceSettings,
  saveAppearanceSettings,
  syncRecurringTasks
} from "./data/repositories";
import type { GlobalSearchResult } from "./hooks/useGlobalSearch";
import { usePwaInstall } from "./hooks/usePwaInstall";
import { useTheme } from "./hooks/useTheme";
import { downloadIcs } from "./lib/downloadIcs";
import { scheduleLocalReminders } from "./lib/localReminders";
import { PROJECT_COLORS } from "./lib/palette";
import { requestNotificationPermission } from "./lib/notifications";
import { buildVerifyEmailLink } from "./lib/verifyEmailLink";
import { fireAndForget, reportError } from "./sentry";
import { AppShell, AppView, ShellSync } from "./shell/AppShell";
import { PlannerProvider, usePlanner } from "./state/PlannerProvider";
import { Button, Notice, Sheet, ViewSkeleton } from "./ui";
import { useSync } from "./sync/useSync";
import type { TodayPressureKind } from "./views/TodayView";

const TodayView = React.lazy(() => import("./views/TodayView").then((module) => ({ default: module.TodayView })));
const BoardView = React.lazy(() => import("./views/BoardView").then((module) => ({ default: module.BoardView })));
const TimelineView = React.lazy(() => import("./views/TimelineView").then((module) => ({ default: module.TimelineView })));
const GoalsView = React.lazy(() => import("./views/GoalsView").then((module) => ({ default: module.GoalsView })));
const NotesView = React.lazy(() => import("./views/NotesView").then((module) => ({ default: module.NotesView })));
const CoursesView = React.lazy(() => import("./views/CoursesView").then((module) => ({ default: module.CoursesView })));
const InsightsView = React.lazy(() => import("./views/InsightsView").then((module) => ({ default: module.InsightsView })));
const SettingsView = React.lazy(() => import("./views/SettingsView").then((module) => ({ default: module.SettingsView })));
const TaskComposer = React.lazy(() => import("./views/TaskComposer").then((module) => ({ default: module.TaskComposer })));
const TaskEditor = React.lazy(() => import("./views/TaskEditor").then((module) => ({ default: module.TaskEditor })));
const GoalComposer = React.lazy(() => import("./views/GoalComposer").then((module) => ({ default: module.GoalComposer })));
const FocusTimer = React.lazy(() => import("./views/FocusTimer").then((module) => ({ default: module.FocusTimer })));
const CooldownModal = React.lazy(() => import("./views/CooldownModal").then((module) => ({ default: module.CooldownModal })));
const CommandPalette = React.lazy(() => import("./views/CommandPalette").then((module) => ({ default: module.CommandPalette })));
const OnboardingOverlay = React.lazy(() =>
  import("./views/OnboardingOverlay").then((module) => ({ default: module.OnboardingOverlay }))
);

type OnboardingSetupInput = {
  kind: "school" | "work" | "personal";
  projectNames: string[];
  taskTitle: string;
  taskProjectIndex: number;
  dueAt?: string;
  enableNotifications: boolean;
  openSyncSettings: boolean;
};

const VALID_VIEWS: AppView[] = [
  "dashboard",
  "goals",
  "kanban",
  "timeline",
  "notes",
  "courses",
  "insights",
  "settings"
];

const VIEW_ALIASES: Record<string, AppView> = {
  today: "dashboard"
};

function initialView(): AppView {
  const params = new URLSearchParams(window.location.search);
  const rawView = params.get("view")?.toLowerCase();
  if (!rawView) {
    return "dashboard";
  }
  const resolved = VIEW_ALIASES[rawView] ?? (rawView as AppView);
  return VALID_VIEWS.includes(resolved) ? resolved : "dashboard";
}

export function App() {
  const [view, setView] = useStateWithUrl(initialView);
  const sharedPrefill = React.useMemo(() => {
    if (typeof window === "undefined") {
      return "";
    }
    const params = new URLSearchParams(window.location.search);
    const sharedTitle = params.get("title")?.trim() ?? "";
    const sharedText = params.get("text")?.trim() ?? "";
    const sharedUrl = params.get("url")?.trim() ?? "";
    if (!sharedTitle && !sharedText && !sharedUrl) {
      return "";
    }
    return sharedTitle || sharedText.split("\n")[0]?.slice(0, 140) || sharedUrl;
  }, []);

  const [composerOpen, setComposerOpen] = React.useState(() => Boolean(sharedPrefill));
  const [commandPaletteOpen, setCommandPaletteOpen] = React.useState(false);
  const [composerDate, setComposerDate] = React.useState<Date | undefined>(undefined);
  const [composerTitle, setComposerTitle] = React.useState(sharedPrefill);
  const [goalOpen, setGoalOpen] = React.useState(false);
  const [editingTaskId, setEditingTaskId] = React.useState<string | null>(null);
  const [editingGoal, setEditingGoal] = React.useState<Goal | null>(null);
  const [selectedGoalId, setSelectedGoalId] = React.useState<string | null>(null);
  const [selectedNoteId, setSelectedNoteId] = React.useState<string | null>(null);
  const [highlightedProjectId, setHighlightedProjectId] = React.useState<string | null>(null);
  const [focusTask, setFocusTask] = React.useState<Task | null>(null);
  const [cooldownTasks, setCooldownTasks] = React.useState<Task[]>([]);

  const { email, emailVerified, dekKey, rotateRecoveryKey, resendVerification, logout } = useAuth();
  const sync = useSync(dekKey);
  const appearanceSettings = useLiveQuery(() => getAppearanceSettings(), []);
  useTheme(appearanceSettings?.theme);
  const showGameLayer = appearanceSettings?.showGameLayer ?? false;
  // Latch onboarding visibility so a liveQuery undefined flicker cannot remount the wizard mid-step.
  const [onboardingLatched, setOnboardingLatched] = React.useState(false);
  const [seenAppearanceSettings, setSeenAppearanceSettings] = React.useState(appearanceSettings);
  if (appearanceSettings !== seenAppearanceSettings) {
    setSeenAppearanceSettings(appearanceSettings);
    if (appearanceSettings) {
      setOnboardingLatched(!appearanceSettings.hasCompletedOnboarding);
    }
  }
  const showOnboarding = onboardingLatched;
  const { isInstallable, promptToInstall } = usePwaInstall();
  const bannerDismissed = appearanceSettings?.pwaBannerDismissed ?? false;

  React.useEffect(() => {
    fireAndForget(syncRecurringTasks(), { source: "recurring-sync" });
  }, []);

  // Global Ctrl/Cmd+K shortcut lives at the app level so the palette opens even
  // before its lazy chunk has loaded.
  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setCommandPaletteOpen(true);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  const openTaskComposer = React.useCallback((date?: Date, title?: string) => {
    setComposerDate(date);
    setComposerTitle(title ?? "");
    setComposerOpen(true);
  }, []);

  const closeComposer = React.useCallback(() => {
    setComposerOpen(false);
    setComposerDate(undefined);
    setComposerTitle("");
  }, []);

  // Strip consumed share_target query params after initial capture open.
  React.useEffect(() => {
    if (!sharedPrefill) {
      return;
    }
    const params = new URLSearchParams(window.location.search);
    params.delete("title");
    params.delete("text");
    params.delete("url");
    const next = `${window.location.pathname}${params.toString() ? `?${params}` : ""}${window.location.hash}`;
    window.history.replaceState({}, "", next);
  }, [sharedPrefill]);

  const toggleTheme = React.useCallback(() => {
    const current = appearanceSettings?.theme;
    const next = current === "dark" ? "light" : "dark";
    fireAndForget(saveAppearanceSettings({ theme: next }), { source: "appearance" });
  }, [appearanceSettings?.theme]);

  return (
    <PlannerProvider>
      <Workspace
        view={view}
        setView={setView}
        composerOpen={composerOpen}
        commandPaletteOpen={commandPaletteOpen}
        setCommandPaletteOpen={setCommandPaletteOpen}
        composerDate={composerDate}
        composerTitle={composerTitle}
        closeComposer={closeComposer}
        goalOpen={goalOpen}
        setGoalOpen={setGoalOpen}
        editingTaskId={editingTaskId}
        setEditingTaskId={setEditingTaskId}
        editingGoal={editingGoal}
        setEditingGoal={setEditingGoal}
        selectedGoalId={selectedGoalId}
        setSelectedGoalId={setSelectedGoalId}
        selectedNoteId={selectedNoteId}
        setSelectedNoteId={setSelectedNoteId}
        highlightedProjectId={highlightedProjectId}
        setHighlightedProjectId={setHighlightedProjectId}
        focusTask={focusTask}
        setFocusTask={setFocusTask}
        cooldownTasks={cooldownTasks}
        setCooldownTasks={setCooldownTasks}
        sync={sync}
        email={email}
        emailVerified={emailVerified}
        rotateRecoveryKey={rotateRecoveryKey}
        resendVerification={resendVerification}
        logout={logout}
        appearanceSettings={appearanceSettings}
        showGameLayer={showGameLayer}
        showOnboarding={showOnboarding}
        isInstallable={isInstallable}
        bannerDismissed={bannerDismissed}
        promptToInstall={promptToInstall}
        onToggleTheme={toggleTheme}
        onOpenComposer={openTaskComposer}
      />
    </PlannerProvider>
  );
}

type WorkspaceProps = {
  view: AppView;
  setView: (view: AppView) => void;
  composerOpen: boolean;
  commandPaletteOpen: boolean;
  setCommandPaletteOpen: (open: boolean) => void;
  composerDate?: Date;
  composerTitle?: string;
  closeComposer: () => void;
  goalOpen: boolean;
  setGoalOpen: (open: boolean) => void;
  editingTaskId: string | null;
  setEditingTaskId: (id: string | null) => void;
  editingGoal: Goal | null;
  setEditingGoal: (goal: Goal | null) => void;
  selectedGoalId: string | null;
  setSelectedGoalId: (id: string | null) => void;
  selectedNoteId: string | null;
  setSelectedNoteId: (id: string | null) => void;
  highlightedProjectId: string | null;
  setHighlightedProjectId: (id: string | null) => void;
  focusTask: Task | null;
  setFocusTask: (task: Task | null) => void;
  cooldownTasks: Task[];
  setCooldownTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  sync: ShellSync;
  email: string | null;
  emailVerified: boolean | null;
  rotateRecoveryKey: () => Promise<string>;
  resendVerification: () => Promise<{ mailSent: boolean; verificationToken?: string }>;
  logout: () => Promise<void> | void;
  appearanceSettings?: AppearanceSettings;
  showGameLayer: boolean;
  showOnboarding: boolean;
  isInstallable: boolean;
  bannerDismissed: boolean;
  promptToInstall: () => Promise<void>;
  onToggleTheme: () => void;
  onOpenComposer: (date?: Date, title?: string) => void;
};

function getDeepActiveElement(): Element | null {
  let el = document.activeElement;
  while (el && el.shadowRoot && el.shadowRoot.activeElement) {
    el = el.shadowRoot.activeElement;
  }
  return el;
}

function isTextEntryElement(target: unknown): boolean {
  if (!target || typeof target !== "object" || !("nodeType" in target)) {
    return false;
  }
  let curr: Node | null = target as Node;
  while (curr && curr.nodeType !== 9) {
    if (curr.nodeType === 1) {
      const el = curr as HTMLElement;
      const tag = el.tagName ? el.tagName.toUpperCase() : "";
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") {
        return true;
      }
      if (
        el.isContentEditable === true ||
        el.contentEditable === "true" ||
        (el.contentEditable as unknown) === true ||
        (typeof el.getAttribute === "function" &&
          (el.getAttribute("contenteditable") === "true" || el.getAttribute("contenteditable") === ""))
      ) {
        return true;
      }
      if (
        typeof el.closest === "function" &&
        el.closest("input, textarea, select, [contenteditable='true'], [contenteditable='']")
      ) {
        return true;
      }
    }
    curr = curr.parentNode ?? (curr instanceof ShadowRoot ? (curr as ShadowRoot).host : null);
  }
  return false;
}

/**
 * Everything under the planner provider: shell, views, and overlays. Views read
 * planner data from context; this component only orchestrates which surfaces are open.
 */
function Workspace(props: WorkspaceProps) {
  const {
    tasks,
    courses,
    goals,
    notes,
    loading,
    addTask,
    updateTask,
    deleteTask,
    updateTaskStatus,
    completeTask,
    upsertCourse,
    deleteCourse,
    addGoal,
    updateGoal,
    setGoalStatus,
    removeGoal,
    addNote,
    updateNote,
    removeNote,
    toggleNoteLink,
    recordFocusSession
  } = usePlanner();

  const editingTask = props.editingTaskId ? tasks.find((task) => task.id === props.editingTaskId) ?? null : null;

  /** Views hand us the task object; we track only its id. */
  const openTask = React.useCallback(
    (task: Task) => {
      props.setEditingTaskId(task.id);
    },
    [props]
  );

  const openGoalById = React.useCallback(
    (goalId: string) => {
      props.setSelectedGoalId(goalId);
      props.setView("goals");
    },
    [props]
  );

  /** Note chips deep-link into Notes, selecting a linked note when one exists. */
  const openTaskNotes = React.useCallback(
    (taskId: string) => {
      const linked = notes.find((note) => note.taskIds.includes(taskId));
      if (linked) {
        props.setSelectedNoteId(linked.id);
      }
      props.setView("notes");
    },
    [notes, props]
  );

  /** Today pressure rows and Projects open Board with a matching persisted filter. */
  const openBoardWithFilters = React.useCallback(
    (patch: Parameters<typeof browseWithFilters>[0]) => {
      fireAndForget(browseWithFilters(patch), { source: "board-browse" });
      props.setView("kanban");
    },
    [props]
  );

  const browsePressure = React.useCallback(
    (kind: TodayPressureKind) => {
      if (kind === "due-today") {
        openBoardWithFilters({ dateRange: "today" });
        return;
      }
      if (kind === "overdue") {
        openBoardWithFilters({ dateRange: "overdue" });
        return;
      }
      openBoardWithFilters({ status: "blocked" });
    },
    [openBoardWithFilters]
  );

  // Local due-time reminders when the browser already granted notification permission.
  React.useEffect(() => {
    return scheduleLocalReminders(tasks);
  }, [tasks]);

  /** Board moves arrive as a batch of reordered/retitled-status records. */
  const updateTasks = React.useCallback(
    async (updates: Task[]) => {
      for (const task of updates) {
        await updateTask(task);
      }
    },
    [updateTask]
  );

  const openSearchResult = (result: GlobalSearchResult) => {
    if (result.type === "task") {
      props.setView(result.view);
      props.setEditingTaskId(result.id);
      return;
    }
    if (result.type === "note") {
      props.setSelectedNoteId(result.id);
      props.setView("notes");
      return;
    }
    if (result.type === "goal") {
      openGoalById(result.id);
      return;
    }
    props.setHighlightedProjectId(result.id);
    props.setView("courses");
  };

  // View-specific primary capture for the mobile FAB and the `N` shortcut.
  // Masthead "New Task" always opens task capture so it never becomes a dead control.
  const primaryActionLabel =
    props.view === "notes"
      ? "New note"
      : props.view === "goals"
        ? "New goal"
        : props.view === "dashboard" ||
            props.view === "kanban" ||
            props.view === "timeline" ||
            props.view === "courses" ||
            props.view === "insights"
          ? "New task"
          : undefined;

  const { view, setSelectedNoteId, setView, onOpenComposer, setGoalOpen } = props;
  const cooldownTimerRef = React.useRef<number | null>(null);

  React.useEffect(
    () => () => {
      if (cooldownTimerRef.current !== null) {
        window.clearTimeout(cooldownTimerRef.current);
      }
    },
    []
  );

  // Honor PWA note_taking `new_note_url` (?view=notes&action=new) once, then strip the flag.
  const consumedNewNoteAction = React.useRef(false);
  React.useEffect(() => {
    if (loading || props.appearanceSettings === undefined || consumedNewNoteAction.current) {
      return;
    }
    const url = new URL(window.location.href);
    if (url.searchParams.get("action") !== "new") {
      return;
    }
    if (props.view !== "notes" && url.searchParams.get("view") !== "notes") {
      return;
    }
    consumedNewNoteAction.current = true;
    url.searchParams.delete("action");
    url.searchParams.set("view", "notes");
    window.history.replaceState({}, "", url);
    void (async () => {
      const note = await addNote({});
      setSelectedNoteId(note.id);
      setView("notes");
    })();
  }, [addNote, loading, props.appearanceSettings, props.view, setSelectedNoteId, setView]);

  const handlePrimaryAction = React.useCallback(async () => {
    if (view === "notes") {
      const note = await addNote({});
      setSelectedNoteId(note.id);
      setView("notes");
      return;
    }
    if (view === "goals") {
      setGoalOpen(true);
      return;
    }
    if (primaryActionLabel) {
      onOpenComposer();
    }
  }, [view, addNote, primaryActionLabel, setSelectedNoteId, setView, onOpenComposer, setGoalOpen]);

  // Quick capture: `N` opens the composer (or a new note on Notes) from any
  // planner view, unless the user is typing or a dialog already owns the screen.
  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "n" && event.key !== "N") {
        return;
      }
      if (event.metaKey || event.ctrlKey || event.altKey) {
        return;
      }
      const target = (event.composedPath?.()[0] ?? event.target) as HTMLElement | null;
      const activeEl = getDeepActiveElement();
      if (isTextEntryElement(target) || isTextEntryElement(activeEl)) {
        return;
      }
      const dialogOpen =
        props.commandPaletteOpen ||
        props.composerOpen ||
        props.goalOpen ||
        Boolean(props.editingGoal) ||
        Boolean(props.editingTaskId) ||
        props.cooldownTasks.length > 0 ||
        props.showOnboarding;
      if (dialogOpen) {
        return;
      }
      event.preventDefault();
      void handlePrimaryAction();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    props.commandPaletteOpen,
    props.composerOpen,
    props.goalOpen,
    props.editingGoal,
    props.editingTaskId,
    props.cooldownTasks,
    props.showOnboarding,
    handlePrimaryAction
  ]);

  const completeOnboardingSetup = async (input: OnboardingSetupInput) => {
    await clearAllData();

    const palette = PROJECT_COLORS;
    const icons = input.kind === "school" ? ["B", "M", "H"] : input.kind === "work" ? ["W", "S", "P"] : ["P", "H", "A"];
    const createdCourses = input.projectNames.map((name, index) =>
      createCourse({
        name,
        color: palette[index % palette.length],
        icon: icons[index % icons.length]
      })
    );

    for (const course of createdCourses) {
      await upsertCourse(course);
    }

    const taskCourse = createdCourses[input.taskProjectIndex] ?? createdCourses[0];
    await addTask({
      title: input.taskTitle,
      courseId: taskCourse?.id,
      dueAt: input.dueAt,
      priority: "medium",
      energy: 1,
      difficulty: 1,
      attributes: ["focus"],
      tags: input.kind === "school" ? ["study"] : []
    });

    if (input.enableNotifications) {
      try {
        await requestNotificationPermission();
      } catch {
        // Permission prompts can be blocked by browsers; setup should still finish.
      }
    }

    props.setView(input.openSyncSettings ? "settings" : "dashboard");
  };

  const [verifyBannerDismissed, setVerifyBannerDismissed] = React.useState(false);
  const [verifyBusy, setVerifyBusy] = React.useState(false);
  const [verifyBannerStatus, setVerifyBannerStatus] = React.useState<string | null>(null);
  const [verifyBannerLink, setVerifyBannerLink] = React.useState<string | null>(null);
  const [paletteExportNotice, setPaletteExportNotice] = React.useState<string | null>(null);
  const showVerifyBanner = Boolean(props.email) && props.emailVerified === false && !verifyBannerDismissed;

  React.useEffect(() => {
    if (!paletteExportNotice) return;
    const timer = window.setTimeout(() => setPaletteExportNotice(null), 4000);
    return () => window.clearTimeout(timer);
  }, [paletteExportNotice]);

  return (
    <>
      <AnimatePresence>
        {showVerifyBanner ? (
          <motion.div
            key="verify-email-banner"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            className="ik-card pwa-install-banner email-verify-banner"
            role="region"
            aria-label="Verify your email"
          >
            <div className="pwa-install-icon email-verify-icon">
              <EnvelopeSimple size={19} weight="bold" />
            </div>
            <div className="pwa-install-copy">
              <p className="pwa-install-title">Confirm your email</p>
              <p className="pwa-install-sub">
                {verifyBannerStatus ?? "Optional — your local planner stays available either way."}
              </p>
              {verifyBannerLink ? (
                <p className="pwa-install-sub" style={{ marginTop: "0.35rem" }}>
                  <a className="btn btn-accent" href={verifyBannerLink}>
                    Open verification link
                  </a>
                </p>
              ) : null}
            </div>
            <div className="pwa-install-actions">
              <Button
                variant="accent"
                size="sm"
                disabled={verifyBusy}
                onClick={() => {
                  setVerifyBusy(true);
                  setVerifyBannerLink(null);
                  void props
                    .resendVerification()
                    .then((result) => {
                      if (result.mailSent) {
                        setVerifyBannerStatus("Verification email sent.");
                        return;
                      }
                      if (result.verificationToken) {
                        // Stay on /app — match Settings/Signup in-place link UX so
                        // composer and other in-memory planner state are not wiped.
                        const link = buildVerifyEmailLink(result.verificationToken);
                        setVerifyBannerLink(link);
                        setVerifyBannerStatus("Mail is not configured — use the link to confirm.");
                        return;
                      }
                      setVerifyBannerStatus("Could not create a verification link.");
                    })
                    .catch((error) => {
                      setVerifyBannerStatus(error instanceof Error ? error.message : "Could not resend.");
                    })
                    .finally(() => setVerifyBusy(false));
                }}
              >
                {verifyBusy ? "Sending…" : "Resend"}
              </Button>
              <button
                type="button"
                className="icon-toggle"
                onClick={() => setVerifyBannerDismissed(true)}
                aria-label="Dismiss email verification reminder"
              >
                <X size={14} weight="bold" />
              </button>
            </div>
          </motion.div>
        ) : null}
        {props.isInstallable && !props.bannerDismissed ? (
          <motion.div
            key="install-banner"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            className={`ik-card pwa-install-banner${showVerifyBanner ? " pwa-install-banner-stacked" : ""}`}
            role="region"
            aria-label="Install Throughline"
          >
            <div className="pwa-install-icon">
              <DownloadSimple size={19} weight="bold" />
            </div>
            <div className="pwa-install-copy">
              <p className="pwa-install-title">Install Throughline</p>
              <p className="pwa-install-sub">Works offline, feels native</p>
            </div>
            <div className="pwa-install-actions">
              <Button variant="accent" size="sm" onClick={() => fireAndForget(props.promptToInstall(), { source: "pwa-install" })}>
                Install
              </Button>
              <button
                type="button"
                className="icon-toggle"
                onClick={() => {
                  fireAndForget(saveAppearanceSettings({ pwaBannerDismissed: true }), { source: "appearance" });
                }}
                aria-label="Dismiss install banner"
              >
                <X size={14} weight="bold" />
              </button>
            </div>
          </motion.div>
        ) : null}
        {paletteExportNotice ? (
          <motion.div
            key="palette-export-notice"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            className="ik-card palette-export-notice"
            role="status"
            aria-live="polite"
          >
            <Notice variant={paletteExportNotice.startsWith("Exported") ? "success" : "error"}>
              {paletteExportNotice}
            </Notice>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AppShell
        view={props.view}
        onViewChange={props.setView}
        onNewTask={props.onOpenComposer}
        onPrimaryAction={() => void handlePrimaryAction()}
        onOpenCommandPalette={() => props.setCommandPaletteOpen(true)}
        primaryActionLabel={primaryActionLabel}
        email={props.email}
        sync={props.sync}
        onSignOut={props.logout}
      >
        <motion.div
          key={props.view}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18 }}
          className="view-frame"
        >
          {loading || props.appearanceSettings === undefined ? (
            <ViewSkeleton />
          ) : (
            <React.Suspense fallback={<ViewSkeleton />}>
              {props.view === "dashboard" ? (
                <TodayView
                  onNewTask={props.onOpenComposer}
                  onEdit={openTask}
                  onStartFocus={props.setFocusTask}
                  onUpdateTask={(task) => void updateTask(task)}
                  onOpenNotes={openTaskNotes}
                  onBrowsePressure={browsePressure}
                  showGameLayer={props.showGameLayer}
                />
              ) : null}
              {props.view === "kanban" ? (
                <BoardView
                  showGameLayer={props.showGameLayer}
                  onComplete={(task) => completeTask(task)}
                  onStatusChange={(taskId, status) => void updateTaskStatus(taskId, status)}
                  onUpdateTasks={(updates) => void updateTasks(updates)}
                  onUpdateTask={(task) => void updateTask(task)}
                  onEdit={openTask}
                  onOpenNotes={openTaskNotes}
                  onStartFocus={props.setFocusTask}
                  onNewTask={props.onOpenComposer}
                />
              ) : null}
              {props.view === "timeline" ? (
                <TimelineView
                  onNewTask={props.onOpenComposer}
                  onStartFocus={props.setFocusTask}
                  onUpdateTask={(task) => void updateTask(task)}
                  onEdit={openTask}
                />
              ) : null}
              {props.view === "goals" ? (
                <GoalsView
                  goals={goals}
                  tasks={tasks}
                  courses={courses}
                  notes={notes}
                  selectedId={props.selectedGoalId}
                  onSelectGoal={props.setSelectedGoalId}
                  onNewGoal={() => props.setGoalOpen(true)}
                  onSetGoalStatus={(goalId, status) => setGoalStatus(goalId, status)}
                  onDeleteGoal={removeGoal}
                  onEditGoal={props.setEditingGoal}
                  onAddTask={addTask}
                  onAddNote={async (input) => {
                    const note = await addNote(input);
                    props.setSelectedNoteId(note.id);
                    props.setView("notes");
                    return note;
                  }}
                  onCompleteTask={(task) => completeTask(task)}
                  onStatusChange={(taskId, status) => void updateTaskStatus(taskId, status)}
                  onEditTask={openTask}
                  onUpdateTask={(task) => void updateTask(task)}
                  onStartFocus={props.setFocusTask}
                  onOpenNote={(noteId) => {
                    props.setSelectedNoteId(noteId);
                    props.setView("notes");
                  }}
                  onOpenNotes={openTaskNotes}
                  onReorderTask={updateTask}
                  showGameLayer={props.showGameLayer}
                />
              ) : null}
              {props.view === "notes" ? (
                <NotesView
                  notes={notes}
                  tasks={tasks}
                  goals={goals}
                  onAddNote={addNote}
                  onUpdateNote={updateNote}
                  onRemoveNote={removeNote}
                  onToggleLink={(noteId, kind, refId, linked) => void toggleNoteLink(noteId, kind, refId, linked)}
                  onOpenTask={(taskId) => props.setEditingTaskId(taskId)}
                  onOpenGoal={openGoalById}
                  selectedId={props.selectedNoteId}
                  onSelectedIdChange={props.setSelectedNoteId}
                />
              ) : null}
              {props.view === "courses" ? (
                <CoursesView
                  courses={courses}
                  tasks={tasks}
                  onUpsertCourse={upsertCourse}
                  onDeleteCourse={deleteCourse}
                  onOpenOnBoard={(courseId) => openBoardWithFilters({ projectId: courseId })}
                  highlightedProjectId={props.highlightedProjectId}
                />
              ) : null}
              {props.view === "insights" ? (
                <InsightsView onNewTask={props.onOpenComposer} showGameLayer={props.showGameLayer} />
              ) : null}
              {props.view === "settings" ? (
                <SettingsView
                  tasks={tasks}
                  courses={courses}
                  appearanceSettings={props.appearanceSettings}
                  onAppearanceChange={saveAppearanceSettings}
                  account={
                    props.email
                      ? {
                          email: props.email,
                          emailVerified: props.emailVerified,
                          syncStatus: props.sync.status,
                          lastSyncAt: props.sync.lastSyncAt
                        }
                      : undefined
                  }
                  onSyncNow={props.email ? props.sync.syncNow : undefined}
                  onRegenerateRecoveryKey={props.email ? props.rotateRecoveryKey : undefined}
                  onResendVerification={props.email ? props.resendVerification : undefined}
                  onSignOut={props.email ? props.logout : undefined}
                />
              ) : null}
            </React.Suspense>
          )}
        </motion.div>
      </AppShell>

      <React.Suspense fallback={null}>
        <CommandPalette
          open={props.commandPaletteOpen}
          setOpen={props.setCommandPaletteOpen}
          onNavigate={props.setView}
          onNewTask={() => props.onOpenComposer()}
          onNewGoal={() => props.setGoalOpen(true)}
          onNewNote={() => {
            void (async () => {
              const note = await addNote({});
              props.setSelectedNoteId(note.id);
              props.setView("notes");
            })();
          }}
          onExportCalendar={() => {
            try {
              downloadIcs(tasks, courses);
              const dueCount = tasks.filter((task) => task.dueAt).length;
              setPaletteExportNotice(
                `Exported ${dueCount} due ${dueCount === 1 ? "task" : "tasks"} to throughline.ics`
              );
            } catch (error) {
              reportError(error, { source: "palette-ics-export" });
              setPaletteExportNotice(error instanceof Error ? error.message : "Calendar export failed");
            }
          }}
          onToggleTheme={props.onToggleTheme}
          tasks={tasks}
          notes={notes}
          goals={goals}
          courses={courses}
          onOpenResult={openSearchResult}
        />

        <Sheet open={props.composerOpen} title="New task" onClose={props.closeComposer}>
          {props.composerOpen ? (
            <TaskComposer
              courses={courses}
              goals={goals}
              showGameLayer={props.showGameLayer}
              initialDate={props.composerDate}
              initialTitle={props.composerTitle}
              onAddTask={async (input) => {
                await addTask(input);
                props.closeComposer();
              }}
            />
          ) : null}
        </Sheet>

        <Sheet open={props.goalOpen} title="New goal" onClose={() => props.setGoalOpen(false)}>
          {props.goalOpen ? (
            <GoalComposer
              courses={courses}
              onSubmit={async (input) => {
                await addGoal(input);
                props.setGoalOpen(false);
              }}
            />
          ) : null}
        </Sheet>

        <Sheet open={Boolean(props.editingGoal)} title="Edit goal" onClose={() => props.setEditingGoal(null)}>
          {props.editingGoal ? (
            <GoalComposer
              courses={courses}
              goal={props.editingGoal}
              onSubmit={async (input) => {
                const current = props.editingGoal;
                if (!current) {
                  return;
                }
                await updateGoal({
                  ...current,
                  title: input.title,
                  summary: input.summary ?? "",
                  projectId: input.projectId,
                  color: input.color,
                  targetDate: input.targetDate ? new Date(input.targetDate).toISOString() : undefined
                });
                props.setEditingGoal(null);
              }}
            />
          ) : null}
        </Sheet>

        <Sheet open={Boolean(editingTask)} title="Edit task" onClose={() => props.setEditingTaskId(null)}>
          {editingTask ? (
            <TaskEditor
              task={editingTask}
              courses={courses}
              goals={goals}
              showGameLayer={props.showGameLayer}
              onSave={async (updated) => {
                await updateTask(updated);
                props.setEditingTaskId(null);
              }}
              onDelete={async (taskId) => {
                await deleteTask(taskId);
                props.setEditingTaskId(null);
              }}
            />
          ) : null}
        </Sheet>

        <FocusTimer
          task={props.focusTask}
          launcherMode={props.view === "dashboard" || props.view === "timeline" ? "desktop-dock" : "hidden"}
          onTaskClose={() => props.setFocusTask(null)}
          onRecordFocusSession={async (input) => {
            await recordFocusSession(input);
            const inputTaskId = typeof input === "object" ? input.taskId : undefined;
            const backlogTasks = tasks.filter(
              (task) => (task.status === "backlog" || task.status === "ready") && task.energy <= 2 && task.id !== inputTaskId
            );
            if (backlogTasks.length > 0) {
              const suggestions = backlogTasks.sort((a, b) => a.energy - b.energy).slice(0, 3);
              cooldownTimerRef.current = window.setTimeout(() => props.setCooldownTasks(suggestions), 3000);
            }
          }}
        />

        {props.cooldownTasks.length > 0 ? (
          <CooldownModal
            tasks={props.cooldownTasks}
            onClose={() => props.setCooldownTasks([])}
            onEditTask={(task) => {
              props.setCooldownTasks([]);
              props.setEditingTaskId(task.id);
            }}
            onCompleteTask={(task) => {
              completeTask(task);
              props.setCooldownTasks((prev) => prev.filter((item) => item.id !== task.id));
            }}
            onStartFocus={(task) => {
              props.setCooldownTasks([]);
              props.setFocusTask(task);
            }}
          />
        ) : null}
      </React.Suspense>

      {/* Own Suspense so sibling overlay lazy-loads cannot remount setup and wipe step state. */}
      {props.showOnboarding ? (
        <React.Suspense fallback={null}>
          <OnboardingOverlay
            onSetup={completeOnboardingSetup}
            onComplete={async () => {
              await saveAppearanceSettings({ hasCompletedOnboarding: true });
            }}
          />
        </React.Suspense>
      ) : null}
    </>
  );
}

function useStateWithUrl(initializer: () => AppView): [AppView, (view: AppView) => void] {
  const [view, setView] = React.useState<AppView>(initializer);

  React.useEffect(() => {
    const url = new URL(window.location.href);
    const currentParam = url.searchParams.get("view");
    if (currentParam && VIEW_ALIASES[currentParam.toLowerCase()]) {
      url.searchParams.set("view", VIEW_ALIASES[currentParam.toLowerCase()]);
      window.history.replaceState({}, "", url);
    }
  }, []);

  const update = React.useCallback((next: AppView) => {
    setView(next);
    const url = new URL(window.location.href);
    url.searchParams.set("view", next);
    window.history.replaceState({}, "", url);
  }, []);

  return [view, update];
}

export default App;

export type { AppView };


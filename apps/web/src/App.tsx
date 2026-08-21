import { Goal, Task, createCourse } from "@throughline/domain";
import { IconContext } from "@phosphor-icons/react";
import { X, DownloadSimple, Plus } from "@phosphor-icons/react";
import { useLiveQuery } from "dexie-react-hooks";
import { MotionConfig, motion } from "motion/react";
import React from "react";
import { AppShell, AppView } from "./components/AppShell";
import { Dashboard } from "./components/Dashboard";
import { GoalComposer } from "./components/GoalComposer";
import { Sheet } from "./components/Sheet";
import { ViewSkeleton } from "./components/Skeleton";
import { TaskComposer } from "./components/TaskComposer";
import { TaskEditor } from "./components/TaskEditor";
import { FocusTimer } from "./components/FocusTimer";
import { CooldownModal } from "./components/CooldownModal";
import { OnboardingOverlay, type OnboardingSetupInput } from "./components/OnboardingOverlay";
import { CommandPalette } from "./components/CommandPalette";
import { DynamicBackground } from "./components/DynamicBackground";
import { useAuth } from "./auth/AuthProvider";
import { clearAllData, getAppearanceSettings, saveAppearanceSettings, syncRecurringTasks } from "./data/repositories";
import type { GlobalSearchResult } from "./hooks/useGlobalSearch";
import { useFocusSessions } from "./hooks/useFocusSessions";
import { useGoals } from "./hooks/useGoals";
import { useNotes } from "./hooks/useNotes";
import { useTasks } from "./hooks/useTasks";
import { useTheme } from "./hooks/useTheme";
import { usePwaInstall } from "./hooks/usePwaInstall";
import { requestNotificationPermission } from "./lib/notifications";
import { useSync } from "./sync/useSync";

const KanbanBoard = React.lazy(() => import("./components/KanbanBoard").then((module) => ({ default: module.KanbanBoard })));
const CalendarTimeline = React.lazy(() =>
  import("./components/CalendarTimeline").then((module) => ({ default: module.CalendarTimeline }))
);
const GoalsView = React.lazy(() => import("./components/GoalsView").then((module) => ({ default: module.GoalsView })));
const NotesView = React.lazy(() => import("./components/NotesView").then((module) => ({ default: module.NotesView })));
const ProjectsView = React.lazy(() =>
  import("./components/ProjectsView").then((module) => ({ default: module.ProjectsView }))
);
const InsightsView = React.lazy(() =>
  import("./pages/InsightsView").then((module) => ({ default: module.InsightsView }))
);
const SettingsPanel = React.lazy(() =>
  import("./components/SettingsPanel").then((module) => ({ default: module.SettingsPanel }))
);

function initialView(): AppView {
  const params = new URLSearchParams(window.location.search);
  const view = params.get("view");
  const views: AppView[] = ["goals", "kanban", "timeline", "notes", "courses", "insights", "settings"];
  return views.includes(view as AppView) ? (view as AppView) : "dashboard";
}

export function App() {
  const [view, setView] = useStateWithUrl(initialView);
  const [composerOpen, setComposerOpen] = React.useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = React.useState(false);
  const [composerDate, setComposerDate] = React.useState<Date | undefined>(undefined);
  const [goalOpen, setGoalOpen] = React.useState(false);
  const [editingTask, setEditingTask] = React.useState<Task | null>(null);
  const [editingGoal, setEditingGoal] = React.useState<Goal | null>(null);
  const [selectedGoalId, setSelectedGoalId] = React.useState<string | null>(null);
  const [selectedNoteId, setSelectedNoteId] = React.useState<string | null>(null);
  const [highlightedProjectId, setHighlightedProjectId] = React.useState<string | null>(null);
  const [focusTask, setFocusTask] = React.useState<Task | null>(null);
  const [cooldownTasks, setCooldownTasks] = React.useState<Task[]>([]);
  const {
    tasks = [],
    courses = [],
    loading,
    addTask,
    updateTask,
    deleteTask,
    updateTaskStatus,
    completeTask,
    upsertCourse,
    deleteCourse
  } = useTasks();
  const { focusSessions, recordFocusSession } = useFocusSessions();
  const { goals, addGoal, updateGoal, setGoalStatus, removeGoal } = useGoals();
  const { notes, addNote, updateNote, removeNote, toggleNoteLink } = useNotes();
  const { email, dekKey, rotateRecoveryKey, logout } = useAuth();
  const sync = useSync(dekKey);
  const appearanceSettings = useLiveQuery(() => getAppearanceSettings(), []);
  useTheme(appearanceSettings?.theme);
  const showGameLayer = appearanceSettings?.showGameLayer ?? false;
  const showOnboarding = appearanceSettings ? !appearanceSettings.hasCompletedOnboarding : false;
  
  const { isInstallable, promptToInstall } = usePwaInstall();
  const bannerDismissed = appearanceSettings?.pwaBannerDismissed ?? false;

  React.useEffect(() => {
    void syncRecurringTasks();
  }, []);

  const openGoal = (goalId: string) => {
    setSelectedGoalId(goalId);
    setView("goals");
  };
  const openTaskById = (taskId: string) => {
    const task = tasks.find((item) => item.id === taskId);
    if (task) {
      setEditingTask(task);
    }
  };

  const openSearchResult = (result: GlobalSearchResult) => {
    if (result.type === "task") {
      setView(result.view);
      openTaskById(result.id);
      return;
    }
    if (result.type === "note") {
      setSelectedNoteId(result.id);
      setView("notes");
      return;
    }
    if (result.type === "goal") {
      setSelectedGoalId(result.id);
      setView("goals");
      return;
    }
    setHighlightedProjectId(result.id);
    setView("courses");
  };

  const openTaskComposer = React.useCallback((date?: Date) => {
    setComposerDate(date);
    setComposerOpen(true);
  }, []);

  const createNoteFromShell = React.useCallback(async () => {
    const note = await addNote({});
    setSelectedNoteId(note.id);
    setView("notes");
  }, [addNote, setView]);

  const primaryAction = React.useMemo(() => {
    if (view === "notes") {
      return {
        label: "New note",
        icon: <Plus size={24} weight="bold" />,
        onClick: () => {
          void createNoteFromShell();
        }
      };
    }

    if (view === "dashboard" || view === "kanban" || view === "timeline" || view === "courses") {
      return {
        label: "New task",
        icon: <Plus size={24} weight="bold" />,
        onClick: () => openTaskComposer()
      };
    }

    return undefined;
  }, [createNoteFromShell, openTaskComposer, view]);

  const toggleTheme = () => {
    const current = appearanceSettings?.theme;
    const next = current === "dark" ? "light" : current === "system" ? "dark" : "dark";
    void saveAppearanceSettings({ theme: next });
  };

  const completeOnboardingSetup = async (input: OnboardingSetupInput) => {
    await clearAllData();

    const palette = ["#5b73f0", "#2fa980", "#f3b95f"];
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

    setView(input.openSyncSettings ? "settings" : "dashboard");
  };

  return (
    <MotionConfig reducedMotion="user">
      <IconContext.Provider value={{ weight: "regular" }}>
        <DynamicBackground />
        
        {isInstallable && !bannerDismissed && (
          <div className="pwa-install-banner clay-modal" role="dialog" aria-label="Install Throughline">
            <div className="pwa-install-icon">
              <DownloadSimple size={20} />
            </div>
            <div className="pwa-install-copy">
              <p className="pwa-install-title">Install Throughline</p>
              <p className="pwa-install-sub">Works offline, feels native</p>
            </div>
            <div className="pwa-install-actions">
              <button
                type="button"
                onClick={promptToInstall}
                className="shell-primary-action clay-btn"
              >
                Install
              </button>
              <button
                type="button"
                onClick={() => {
                  void saveAppearanceSettings({ pwaBannerDismissed: true });
                }}
                className="shell-icon-button clay-btn"
                aria-label="Dismiss install banner"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        )}

        <AppShell
          view={view}
          onViewChange={setView}
          onNewTask={openTaskComposer}
          onOpenCommandPalette={() => setCommandPaletteOpen(true)}
          primaryAction={primaryAction}
          email={email}
          sync={sync}
          onSignOut={logout}
        >
          <motion.div
            key={view}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="view-frame"
          >
            {loading ? (
              <ViewSkeleton />
            ) : (
              <>
                {view === "dashboard" ? (
                  <Dashboard
                    tasks={tasks}
                    courses={courses}
                    focusSessions={focusSessions}
                    onComplete={completeTask}
                    onUpdateTask={updateTask}
                    onNewTask={openTaskComposer}
                    onEdit={setEditingTask}
                    onStartFocus={setFocusTask}
                  />
                ) : null}
                {view === "goals" ? (
                  <React.Suspense fallback={<ViewSkeleton />}>
                    <GoalsView
                      goals={goals}
                      tasks={tasks}
                      courses={courses}
                      notes={notes}
                      showGameLayer={showGameLayer}
                      selectedId={selectedGoalId}
                      onSelectGoal={setSelectedGoalId}
                      onNewGoal={() => setGoalOpen(true)}
                      onSetGoalStatus={setGoalStatus}
                      onDeleteGoal={removeGoal}
                      onEditGoal={setEditingGoal}
                      onAddTask={addTask}
                      onAddNote={addNote}
                      onCompleteTask={completeTask}
                      onStatusChange={updateTaskStatus}
                      onEditTask={setEditingTask}
                      onUpdateTask={updateTask}
                      onReorderTask={updateTask}
                    />
                  </React.Suspense>
                ) : null}
                {view === "kanban" ? (
                  <React.Suspense fallback={<ViewSkeleton />}>
                    <KanbanBoard
                      tasks={tasks}
                      courses={courses}
                      goals={goals}
                      notes={notes}
                      showGameLayer={showGameLayer}
                      onComplete={completeTask}
                      onStatusChange={updateTaskStatus}
                      onEdit={setEditingTask}
                      onUpdateTask={updateTask}
                      onOpenNotes={() => setView("notes")}
                      onStartFocus={setFocusTask}
                    />
                  </React.Suspense>
                ) : null}
                {view === "timeline" ? (
                  <React.Suspense fallback={<ViewSkeleton />}>
                    <CalendarTimeline 
                      tasks={tasks} 
                      courses={courses} 
                      goals={goals} 
                      onNewTask={openTaskComposer}
                      onStartFocus={setFocusTask}
                      onUpdateTask={updateTask}
                    />
                  </React.Suspense>
                ) : null}
                {view === "notes" ? (
                  <React.Suspense fallback={<ViewSkeleton />}>
                    <NotesView
                      notes={notes}
                      tasks={tasks}
                      goals={goals}
                      onAddNote={addNote}
                      onUpdateNote={updateNote}
                      onRemoveNote={removeNote}
                      onToggleLink={toggleNoteLink}
                      onOpenTask={openTaskById}
                      onOpenGoal={openGoal}
                      selectedId={selectedNoteId}
                      onSelectedIdChange={setSelectedNoteId}
                    />
                  </React.Suspense>
                ) : null}
                {view === "courses" ? (
                  <React.Suspense fallback={<ViewSkeleton />}>
                    <ProjectsView
                      courses={courses}
                      tasks={tasks}
                      onUpsertCourse={upsertCourse}
                      onDeleteCourse={deleteCourse}
                      highlightedProjectId={highlightedProjectId}
                    />
                  </React.Suspense>
                ) : null}
                {view === "insights" ? (
                  <React.Suspense fallback={<ViewSkeleton />}>
                    <InsightsView />
                  </React.Suspense>
                ) : null}
                {view === "settings" ? (
                  <React.Suspense fallback={<ViewSkeleton />}>
                    <SettingsPanel
                      tasks={tasks}
                      courses={courses}
                      appearanceSettings={appearanceSettings}
                      onAppearanceChange={saveAppearanceSettings}
                      account={{ email, syncStatus: sync.status, lastSyncAt: sync.lastSyncAt }}
                      onSyncNow={sync.syncNow}
                      onRegenerateRecoveryKey={rotateRecoveryKey}
                      onSignOut={logout}
                    />
                  </React.Suspense>
                ) : null}
              </>
            )}
          </motion.div>
        </AppShell>

        <CommandPalette 
          open={commandPaletteOpen} 
          setOpen={setCommandPaletteOpen}
          onNavigate={setView}
          onNewTask={() => setComposerOpen(true)}
          onToggleTheme={toggleTheme}
          tasks={tasks}
          notes={notes}
          goals={goals}
          courses={courses}
          onOpenResult={openSearchResult}
        />

        <Sheet 
          open={composerOpen} 
          title="New task" 
          onClose={() => {
            setComposerOpen(false);
            setComposerDate(undefined);
          }}
        >
          <TaskComposer
            courses={courses}
            goals={goals}
            showGameLayer={showGameLayer}
            initialDate={composerDate}
            onAddTask={async (input) => {
              await addTask(input);
              setComposerOpen(false);
              setComposerDate(undefined);
            }}
          />
        </Sheet>

        <Sheet open={goalOpen} title="New goal" onClose={() => setGoalOpen(false)}>
          <GoalComposer
            courses={courses}
            onSubmit={async (input) => {
              await addGoal(input);
              setGoalOpen(false);
            }}
          />
        </Sheet>

        <Sheet open={Boolean(editingGoal)} title="Edit goal" onClose={() => setEditingGoal(null)}>
          {editingGoal ? (
            <GoalComposer
              courses={courses}
              goal={editingGoal}
              onSubmit={async (input) => {
                await updateGoal({
                  ...editingGoal,
                  title: input.title,
                  summary: input.summary ?? "",
                  projectId: input.projectId,
                  color: input.color,
                  targetDate: input.targetDate ? new Date(input.targetDate).toISOString() : undefined
                });
                setEditingGoal(null);
              }}
            />
          ) : null}
        </Sheet>

        <Sheet open={Boolean(editingTask)} title="Edit task" onClose={() => setEditingTask(null)}>
          {editingTask ? (
            <TaskEditor
              task={editingTask}
              courses={courses}
              goals={goals}
              onSave={async (updated) => {
                await updateTask(updated);
                setEditingTask(null);
              }}
              onDelete={async (taskId) => {
                await deleteTask(taskId);
                setEditingTask(null);
              }}
            />
          ) : null}
        </Sheet>
        
        <FocusTimer
          task={focusTask}
          launcherMode={view === "dashboard" || view === "timeline" ? "desktop-dock" : "hidden"}
          onTaskClose={() => setFocusTask(null)}
          onRecordFocusSession={async (input) => {
            await recordFocusSession(input);
            const inputTaskId = typeof input === 'object' ? input.taskId : undefined;
            const backlogTasks = tasks.filter(t => (t.status === "backlog" || t.status === "ready") && t.energy <= 2 && t.id !== inputTaskId);
            if (backlogTasks.length > 0) {
              const suggestions = backlogTasks.sort((a, b) => a.energy - b.energy).slice(0, 3);
              setTimeout(() => setCooldownTasks(suggestions), 3000);
            }
          }}
        />

        {cooldownTasks.length > 0 && (
          <CooldownModal
            tasks={cooldownTasks}
            onClose={() => setCooldownTasks([])}
            onEditTask={(t) => {
              setCooldownTasks([]);
              setEditingTask(t);
            }}
            onCompleteTask={async (t) => {
              await completeTask(t);
              setCooldownTasks((prev) => prev.filter(p => p.id !== t.id));
            }}
            onStartFocus={(t) => {
              setCooldownTasks([]);
              setFocusTask(t);
            }}
          />
        )}
        
        {showOnboarding ? (
          <OnboardingOverlay
            onSetup={completeOnboardingSetup}
            onComplete={async () => {
              await saveAppearanceSettings({ hasCompletedOnboarding: true });
            }}
          />
        ) : null}
      </IconContext.Provider>
    </MotionConfig>
  );
}

function useStateWithUrl(initializer: () => AppView): [AppView, (view: AppView) => void] {
  const [view, setView] = React.useState<AppView>(initializer);

  const update = React.useCallback((next: AppView) => {
    setView(next);
    const url = new URL(window.location.href);
    url.searchParams.set("view", next);
    window.history.replaceState({}, "", url);
  }, []);

  return [view, update];
}

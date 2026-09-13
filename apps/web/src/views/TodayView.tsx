import { FocusSession, Task, deriveTodayBriefing } from "@throughline/domain";
import { CheckCircle, Clock, LockKey, Plus, Timer, WarningCircle } from "@phosphor-icons/react";
import { useMemo, type CSSProperties, type ReactNode } from "react";
import { usePlanner } from "../state/PlannerProvider";
import { Button, Card, EmptyState } from "../ui";
import { TaskCard } from "./TaskCard";

export function TodayView({
  onNewTask,
  onEdit,
  onStartFocus,
  onUpdateTask,
  showGameLayer = false
}: {
  onNewTask: (date?: Date) => void;
  onEdit: (task: Task) => void;
  onStartFocus?: (task: Task) => void;
  onUpdateTask?: (task: Task) => void;
  showGameLayer?: boolean;
}) {
  const { tasks, courses, focusSessions, completeTask } = usePlanner();

  const briefing = useMemo(() => deriveTodayBriefing({ tasks, focusSessions: focusSessions as FocusSession[] }), [tasks, focusSessions]);
  const stats = briefing.stats;
  const courseMap = useMemo(() => new Map(courses.map((course) => [course.id, course])), [courses]);

  // "Also on the radar": the next few actionable tasks that are not already in
  // the priority list, so the main panel stays useful on quiet days.
  const radarTasks = useMemo(() => {
    const priorityIds = new Set(briefing.priorityTasks.map((task) => task.id));
    return tasks
      .filter((task) => task.status !== "done" && task.status !== "blocked" && !priorityIds.has(task.id))
      .sort((a, b) => {
        const aTime = a.dueAt ? new Date(a.dueAt).getTime() : Number.MAX_SAFE_INTEGER;
        const bTime = b.dueAt ? new Date(b.dueAt).getTime() : Number.MAX_SAFE_INTEGER;
        return aTime - bTime || a.order - b.order;
      })
      .slice(0, 4);
  }, [tasks, briefing.priorityTasks]);

  const dateLabel = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric"
  });

  return (
    <div className="today-page">
      <header className="today-hero">
        <div>
          <span className="eyebrow">{dateLabel}</span>
          <h1>Today</h1>
          <p className="today-progress-line">{briefing.progressSentence}</p>
        </div>
        <Button variant="accent" className="today-primary-action" onClick={() => onNewTask()} aria-label="Capture a task from Today">
          <Plus size={16} weight="bold" />
          New task
        </Button>
      </header>

      <div className="today-layout">
        <Card className="today-panel" aria-labelledby="today-priority-heading">
          <div className="today-section-head">
            <div>
              <span className="eyebrow">Next</span>
              <h2 id="today-priority-heading">What matters now</h2>
            </div>
            <span className="today-count">{briefing.priorityTasks.length || "No"} active</span>
          </div>

          {briefing.priorityTasks.length ? (
            <div className="today-priority-list">
              {briefing.priorityTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  course={courseMap.get(task.courseId ?? "")}
                  showGameLayer={showGameLayer}
                  onComplete={(target) => completeTask(target)}
                  onEdit={onEdit}
                  onUpdateTask={onUpdateTask}
                  offerEmptyStepInput={false}
                  onStartFocus={onStartFocus}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              className="today-empty"
              icon={<CheckCircle size={24} weight="bold" />}
              title="All clear for today"
              body="No urgent work is asking for you right now."
              action={
                <Button variant="accent" onClick={() => onNewTask()}>
                  <Plus size={15} weight="bold" />
                  Capture a task
                </Button>
              }
            />
          )}

          {radarTasks.length ? (
            <div className="today-radar">
              <span className="eyebrow">Also on the radar</span>
              <div className="today-radar-list">
                {radarTasks.map((task) => {
                  const course = courseMap.get(task.courseId ?? "");
                  return (
                    <button
                      key={task.id}
                      type="button"
                      className="today-radar-row"
                      onClick={() => onEdit(task)}
                      aria-label={`${task.title}${task.dueAt ? `, due ${formatRadarDue(task.dueAt)}` : ""}`}
                    >
                      <span className="project-dot" aria-hidden="true" style={{ "--project-color": course?.color ?? "var(--ink-faint)" } as CSSProperties} />
                      <span className="today-radar-title">{task.title}</span>
                      {task.dueAt ? <span className="today-radar-due">{formatRadarDue(task.dueAt)}</span> : null}
                      {course ? <span className="today-radar-course">{course.code ?? course.name}</span> : null}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}
        </Card>

        <aside className="today-side" aria-label="Today pressure and guidance">
          <Card className="today-panel" aria-label="Guidance">
            <div className="today-section-head">
              <div>
                <span className="eyebrow">Guidance</span>
                <h2>Start here</h2>
              </div>
            </div>
            {briefing.guidance.length ? (
              <div className="today-guidance-list">
                {briefing.guidance.map((item) => (
                  <div key={item.id} className={`today-guidance-item guidance-${item.kind}`}>
                    {guidanceIcon(item.kind)}
                    <span>{item.message}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="today-muted">Nothing is pressing. This is a good day to protect focus.</p>
            )}
          </Card>

          <Card className="today-panel" aria-label="Schedule shape">
            <section>
              <div className="today-section-head">
                <div>
                  <span className="eyebrow">Pressure</span>
                  <h2>Schedule shape</h2>
                </div>
              </div>
              <div className="today-pressure-list">
                <PressureRow icon={<Clock size={16} weight="bold" />} label="Due today" value={`${stats.dueTodayCount}`} />
                <PressureRow icon={<WarningCircle size={16} weight="bold" />} label="Overdue" value={`${briefing.overdueCount}`} tone={briefing.overdueCount ? "urgent" : undefined} />
                <PressureRow icon={<LockKey size={16} weight="bold" />} label="Blocked" value={`${briefing.blockedCount}`} tone={briefing.blockedCount ? "blocked" : undefined} />
                <PressureRow icon={<Timer size={16} weight="bold" />} label="Focus logged" value={formatMinutes(stats.focusMinutesToday)} progress={Math.min(100, (stats.focusMinutesToday / 120) * 100)} />
                <PressureRow
                  icon={<CheckCircle size={16} weight="bold" />}
                  label="Today progress"
                  value={`${stats.completedTasksToday}/${stats.todayTaskTotal}`}
                  progress={stats.todayTaskTotal > 0 ? (stats.completedTasksToday / stats.todayTaskTotal) * 100 : 0}
                  tone={stats.completedTasksToday === stats.todayTaskTotal && stats.todayTaskTotal > 0 ? "success" : undefined}
                />
              </div>
              {stats.nextStudyBlock ? (
                <button type="button" onClick={() => onEdit(stats.nextStudyBlock!.task)} className="today-next-block">
                  <span>Next study block</span>
                  <strong>{stats.nextStudyBlock.task.title}</strong>
                  <small>
                    {formatClock(stats.nextStudyBlock.startsAt)} · {formatMinutes(stats.nextStudyBlock.minutes)}
                  </small>
                </button>
              ) : null}
            </section>
          </Card>
        </aside>
      </div>
    </div>
  );
}

function PressureRow({
  icon,
  label,
  value,
  tone,
  progress = 0
}: {
  icon: ReactNode;
  label: string;
  value: string;
  tone?: "urgent" | "blocked" | "success";
  progress?: number;
}) {
  return (
    <div
      className={`pressure-row${tone ? ` pressure-${tone}` : ""}`}
    >
      {progress > 0 ? (
        <span
          className="pressure-progress"
          style={{ width: `${Math.min(100, Math.round(progress))}%` }}
          aria-hidden="true"
        />
      ) : null}
      <span className="pressure-icon">{icon}</span>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function guidanceIcon(kind: string) {
  if (kind === "overdue") return <WarningCircle size={16} weight="bold" />;
  if (kind === "blocked") return <LockKey size={16} weight="bold" />;
  if (kind === "focus") return <Timer size={16} weight="bold" />;
  if (kind === "due") return <Clock size={16} weight="bold" />;
  return <CheckCircle size={16} weight="bold" />;
}

function formatMinutes(minutes: number) {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder ? `${hours}h ${remainder}m` : `${hours}h`;
}

function formatClock(iso: string) {
  return new Date(iso).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

function formatRadarDue(iso: string) {
  const due = new Date(iso);
  if (Number.isNaN(due.getTime())) {
    return "";
  }
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfDue = new Date(due.getFullYear(), due.getMonth(), due.getDate());
  const dayDiff = Math.round((startOfDue.getTime() - startOfToday.getTime()) / 86_400_000);
  if (dayDiff < 0) {
    return dayDiff === -1 ? "Yesterday" : `${Math.abs(dayDiff)}d overdue`;
  }
  if (dayDiff === 0) {
    return "Today";
  }
  if (dayDiff === 1) {
    return "Tomorrow";
  }
  return due.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}


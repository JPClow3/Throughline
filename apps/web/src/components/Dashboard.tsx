import { Course, FocusSession, Task, deriveTodayBriefing } from "@throughline/domain";
import { CheckCircle, Clock, LockKey, Plus, Timer, WarningCircle } from "@phosphor-icons/react";
import type { ReactNode } from "react";
import { TaskCard } from "./TaskCard";

type DashboardProps = {
  tasks: Task[];
  courses: Course[];
  focusSessions?: FocusSession[];
  showGameLayer?: boolean;
  onComplete: (task: Task) => void;
  onUpdateTask?: (task: Task) => void;
  onNewTask: (date?: Date) => void;
  onEdit: (task: Task) => void;
  onStartFocus?: (task: Task) => void;
};

export function Dashboard({
  tasks,
  courses,
  focusSessions = [],
  showGameLayer = false,
  onComplete,
  onUpdateTask,
  onNewTask,
  onEdit,
  onStartFocus
}: DashboardProps) {
  const briefing = deriveTodayBriefing({ tasks, focusSessions });
  const stats = briefing.stats;
  const courseMap = new Map(courses.map((course) => [course.id, course]));
  const dateLabel = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric"
  });

  return (
    <div className="today-page max-w-container-max mx-auto w-full">
      <header className="today-hero">
        <div>
          <span className="eyebrow">{dateLabel}</span>
          <h1>Today</h1>
          <p>{briefing.progressSentence}</p>
        </div>
        <button type="button" onClick={() => onNewTask()} className="primary-button today-primary-action" aria-label="Capture a task from Today">
          <Plus size={16} weight="bold" />
          New task
        </button>
      </header>

      <div className="today-layout">
        <section className="today-task-surface glass-panel" aria-labelledby="today-priority-heading">
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
                  onComplete={onComplete}
                  onEdit={onEdit}
                  onUpdateTask={onUpdateTask}
                  onStartFocus={onStartFocus}
                />
              ))}
            </div>
          ) : (
            <div className="empty-state today-empty">
              <p>No urgent work is asking for you right now.</p>
              <button type="button" className="secondary-button" onClick={() => onNewTask()}>
                <Plus size={15} />
                Capture a task
              </button>
            </div>
          )}
        </section>

        <aside className="today-side" aria-label="Today pressure and guidance">
          <section className="today-guidance-panel glass-panel">
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
                    {iconForGuidance(item.kind)}
                    <span>{item.message}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="today-muted">Nothing is pressing. This is a good day to protect focus.</p>
            )}
          </section>

          <section className="today-pressure-panel glass-panel">
            <div className="today-section-head">
              <div>
                <span className="eyebrow">Pressure</span>
                <h2>Schedule shape</h2>
              </div>
            </div>
            <div className="today-pressure-list">
              <PressureRow icon={<Clock size={17} />} label="Due today" value={`${stats.dueTodayCount}`} />
              <PressureRow icon={<WarningCircle size={17} />} label="Overdue" value={`${briefing.overdueCount}`} tone={briefing.overdueCount ? "urgent" : undefined} />
              <PressureRow icon={<LockKey size={17} />} label="Blocked" value={`${briefing.blockedCount}`} tone={briefing.blockedCount ? "blocked" : undefined} />
              <PressureRow icon={<Timer size={17} />} label="Focus logged" value={formatMinutes(stats.focusMinutesToday)} />
              <PressureRow icon={<CheckCircle size={17} />} label="Today progress" value={`${stats.completedTasksToday}/${stats.todayTaskTotal}`} />
            </div>
            {stats.nextStudyBlock ? (
              <button type="button" onClick={() => onEdit(stats.nextStudyBlock!.task)} className="today-next-block">
                <span>Next study block</span>
                <strong>{stats.nextStudyBlock.task.title}</strong>
                <small>{formatClock(stats.nextStudyBlock.startsAt)} · {formatMinutes(stats.nextStudyBlock.minutes)}</small>
              </button>
            ) : null}
          </section>
        </aside>
      </div>
    </div>
  );
}

function PressureRow({
  icon,
  label,
  value,
  tone
}: {
  icon: ReactNode;
  label: string;
  value: string;
  tone?: "urgent" | "blocked";
}) {
  return (
    <div className={`today-pressure-row${tone ? ` pressure-${tone}` : ""}`}>
      <span className="today-pressure-icon">{icon}</span>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function iconForGuidance(kind: string) {
  if (kind === "overdue") return <WarningCircle size={17} />;
  if (kind === "blocked") return <LockKey size={17} />;
  if (kind === "focus") return <Timer size={17} />;
  if (kind === "due") return <Clock size={17} />;
  return <CheckCircle size={17} />;
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

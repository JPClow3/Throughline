import { Course, Note, Task, UserProgress } from "@throughline/domain";
import { CalendarBlank, Flame, ListChecks, Plus, Trophy } from "@phosphor-icons/react";
import type { CSSProperties } from "react";
import { capitalizeFirst } from "../lib/format";
import { countNotesByTask } from "../lib/noteCounts";
import { EmptyState } from "./EmptyState";
import { GoalRing } from "./GoalRing";
import { TaskCard } from "./TaskCard";

type DashboardProps = {
  tasks: Task[];
  courses: Course[];
  notes?: Note[];
  progress?: UserProgress;
  showGameLayer?: boolean;
  onComplete: (task: Task) => void;
  onNewTask: () => void;
  onEdit: (task: Task) => void;
  onOpenNotes?: () => void;
};

type ProjectProgress = {
  id: string;
  name: string;
  color?: string;
  total: number;
  done: number;
  left: number;
  ratio: number;
};

export function Dashboard({
  tasks,
  courses,
  notes = [],
  progress,
  showGameLayer = false,
  onComplete,
  onNewTask,
  onEdit,
  onOpenNotes
}: DashboardProps) {
  const courseMap = new Map(courses.map((course) => [course.id, course]));
  const noteCounts = countNotesByTask(notes);

  const total = tasks.length;
  const done = tasks.filter((task) => task.status === "done").length;
  const pct = total ? Math.round((done / total) * 100) : 0;

  const active = tasks.filter((task) => task.status !== "done");
  const dueSoon = active
    .filter((task) => task.dueAt)
    .sort((a, b) => new Date(a.dueAt as string).getTime() - new Date(b.dueAt as string).getTime())
    .slice(0, 4);

  const greeting = greetingForHour(new Date().getHours());
  const dateLabel = new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });

  const projectProgress: ProjectProgress[] = courses
    .map((course) => {
      const owned = tasks.filter((task) => task.courseId === course.id);
      const completed = owned.filter((task) => task.status === "done").length;
      return {
        id: course.id,
        name: course.name,
        color: course.color,
        total: owned.length,
        done: completed,
        left: owned.length - completed,
        ratio: owned.length ? Math.round((completed / owned.length) * 100) : 0
      };
    })
    .filter((project) => project.total > 0);

  const unsorted = tasks.filter((task) => !task.courseId);
  if (unsorted.length) {
    const completed = unsorted.filter((task) => task.status === "done").length;
    projectProgress.push({
      id: "__unsorted",
      name: "Unsorted",
      total: unsorted.length,
      done: completed,
      left: unsorted.length - completed,
      ratio: Math.round((completed / unsorted.length) * 100)
    });
  }

  const level = progress?.level ?? 1;
  const xp = progress?.xp ?? 0;
  const xpRatio = Math.min(100, Math.round((xp / (level * level * 120)) * 100));

  return (
    <div className="dashboard-view">
      <header className="view-head">
        <div>
          <span className="eyebrow">Today</span>
          <h1>{greeting}</h1>
          <p className="view-head-sub">{capitalizeFirst(dateLabel)}</p>
        </div>
        <div className="view-head-actions">
          {showGameLayer ? (
            <div className="level-orb">
              <Trophy size={20} />
              <strong>{xp}</strong>
              <span>XP · Lv {level}</span>
            </div>
          ) : null}
          <button className="primary-button" type="button" onClick={onNewTask}>
            <Plus size={17} /> New task
          </button>
        </div>
      </header>

      <div className="dashboard-grid">
        {total ? (
          <div className="progress-hero">
            <div className="progress-hero-text">
              <span className="eyebrow">{heroHeadline(pct)}</span>
              <h2>
                {done} of {total} tasks done
              </h2>
              <div className="progress-track">
                <div style={{ width: `${pct}%` }} />
              </div>
            </div>
            <GoalRing ratio={pct} size={92} />
          </div>
        ) : null}

        <section>
          <div className="section-heading">
            <div>
              <span className="eyebrow">By project</span>
              <h2>Daily progress</h2>
            </div>
          </div>
          {projectProgress.length ? (
            <div className="progress-grid">
              {projectProgress.map((project) => (
                <div
                  key={project.id}
                  className="progress-card"
                  style={{ "--project-color": project.color ?? "var(--ink-faint)" } as CSSProperties}
                >
                  <div className="progress-card-head">
                    <span className="project-chip">
                      <span className="project-dot" aria-hidden="true" />
                      {project.name}
                    </span>
                    <GoalRing ratio={project.ratio} size={38} />
                  </div>
                  <div className="progress-card-foot">
                    <span>
                      {project.total} {project.total === 1 ? "task" : "tasks"}
                    </span>
                    <span className="pill-done">{project.done} done</span>
                    <span className="pill-left">{project.left} left</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<ListChecks size={26} />}
              title="No tasks yet"
              body="Add your first task to see progress roll up here."
              action={
                <button className="primary-button" type="button" onClick={onNewTask}>
                  <Plus size={17} /> Add your first task
                </button>
              }
            />
          )}
        </section>

        <section>
          <div className="section-heading">
            <div>
              <span className="eyebrow">Coming up</span>
              <h2>Due soon</h2>
            </div>
          </div>
          <div className="quest-list-stack">
            {dueSoon.length ? (
              dueSoon.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  course={courseMap.get(task.courseId ?? "")}
                  showGameLayer={showGameLayer}
                  noteCount={noteCounts.get(task.id) ?? 0}
                  onComplete={onComplete}
                  onEdit={onEdit}
                  onOpenNotes={onOpenNotes}
                />
              ))
            ) : (
              <EmptyState
                icon={<CalendarBlank size={26} />}
                title="Nothing scheduled soon"
                body="Tasks with a due date will appear here. Enjoy the breathing room."
              />
            )}
          </div>
        </section>

        {showGameLayer && progress ? (
          <div className="progress-panel">
            <header>
              <h2>
                <Flame size={16} /> Momentum
              </h2>
              <span>{progress.streakDays}-day streak</span>
            </header>
            <div className="progress-track">
              <div style={{ width: `${xpRatio}%` }} />
            </div>
            <div className="attribute-bars">
              {Object.entries(progress.attributes).map(([attribute, value]) => (
                <div key={attribute}>
                  <span>{attribute}</span>
                  <meter min={0} max={20} value={Math.min(20, value as number)} />
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function greetingForHour(hour: number) {
  if (hour < 12) {
    return "Good morning";
  }
  if (hour < 18) {
    return "Good afternoon";
  }
  return "Good evening";
}

function heroHeadline(pct: number) {
  if (pct >= 100) {
    return "All done — nice work";
  }
  if (pct >= 70) {
    return "You're almost there";
  }
  if (pct >= 30) {
    return "Good momentum";
  }
  return "Let's get going";
}

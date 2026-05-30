import { Course, Task, TaskStatus, kanbanColumns } from "@liquidglass-todo/domain";
import { Check, Clock as Clock3, Diamond as Gem, ListChecks, Note as StickyNote, Target } from "@phosphor-icons/react";
import { motion } from "motion/react";
import type { CSSProperties } from "react";
import { capitalizeFirst } from "../lib/format";

type TaskCardProps = {
  task: Task;
  course?: Course;
  compact?: boolean;
  /** Show the optional XP / game-layer detail. Off by default for the calm planner. */
  showGameLayer?: boolean;
  /** Title of the parent goal, when this task belongs to one. */
  goalLabel?: string;
  /** Count of notes linked to this task. */
  noteCount?: number;
  onComplete?: (task: Task) => void;
  onStatusChange?: (taskId: string, status: TaskStatus) => void;
  onEdit?: (task: Task) => void;
  /** Open the Notes view (used by the linked-notes count chip). */
  onOpenNotes?: () => void;
};

type DueTone = "done" | "overdue" | "soon" | "normal";

export function TaskCard({
  task,
  course,
  compact = false,
  showGameLayer = false,
  goalLabel,
  noteCount = 0,
  onComplete,
  onStatusChange,
  onEdit,
  onOpenNotes
}: TaskCardProps) {
  const done = task.status === "done";
  const due = task.dueAt ? new Date(task.dueAt) : undefined;
  const dueInfo = due ? describeDue(due, done) : undefined;
  const totalSubtasks = task.subtasks.length;
  const completedSubtasks = task.subtasks.filter((subtask) => subtask.completed).length;

  return (
    <motion.article
      className={`task-card${compact ? " task-card-compact" : ""}${done ? " is-done" : ""}`}
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 300, damping: 28 }}
    >
      <div className="task-card-top">
        {course ? (
          <span className="project-chip" style={{ "--project-color": course.color } as CSSProperties}>
            <span className="project-dot" aria-hidden="true" />
            {course.code ?? course.name}
          </span>
        ) : (
          <span className="project-chip project-chip-none">
            <span className="project-dot" aria-hidden="true" />
            No project
          </span>
        )}
        <button
          className={`complete-button${done ? " is-done" : ""}`}
          type="button"
          aria-label={done ? `${task.title} complete` : `Complete ${task.title}`}
          title={done ? "Complete" : "Mark complete"}
          disabled={done}
          onPointerDown={(event) => event.stopPropagation()}
          onClick={() => {
            if (onStatusChange) {
              onStatusChange(task.id, "done");
              return;
            }
            onComplete?.(task);
          }}
        >
          <Check size={16} />
        </button>
      </div>

      <h3 className="task-card-title">
        {onEdit ? (
          <button type="button" className="task-card-edit" onClick={() => onEdit(task)}>
            {task.title}
          </button>
        ) : (
          task.title
        )}
      </h3>

      {!compact && task.description ? <p className="task-card-summary">{task.description}</p> : null}

      {totalSubtasks ? (
        <div
          className="subtask-progress"
          aria-label={`${completedSubtasks} of ${totalSubtasks} steps complete`}
        >
          <div style={{ width: `${Math.round((completedSubtasks / totalSubtasks) * 100)}%` }} />
        </div>
      ) : null}

      <div className="task-card-meta">
        {dueInfo ? (
          <span className={`meta-due meta-due-${dueInfo.tone}`}>
            <Clock3 size={14} />
            {dueInfo.text}
          </span>
        ) : null}
        {goalLabel ? (
          <span className="meta-chip">
            <Target size={14} />
            {goalLabel}
          </span>
        ) : null}
        {totalSubtasks ? (
          <span className="meta-chip">
            <ListChecks size={14} />
            {completedSubtasks}/{totalSubtasks}
          </span>
        ) : null}
        {noteCount ? (
          onOpenNotes ? (
            <button
              type="button"
              className="meta-chip meta-chip-button"
              onClick={onOpenNotes}
              aria-label={`${noteCount} linked ${noteCount === 1 ? "note" : "notes"} — open Notes`}
            >
              <StickyNote size={14} />
              {noteCount}
            </button>
          ) : (
            <span className="meta-chip">
              <StickyNote size={14} />
              {noteCount}
            </span>
          )
        ) : null}
        {showGameLayer ? (
          <span className="meta-chip meta-xp">
            <Gem size={14} />
            {task.xp} XP
          </span>
        ) : null}
      </div>

      {onStatusChange ? (
        <footer className="task-card-foot">
          <select
            aria-label={`Move ${task.title}`}
            value={task.status}
            onPointerDown={(event) => event.stopPropagation()}
            onChange={(event) => onStatusChange(task.id, event.target.value as TaskStatus)}
          >
            {Object.entries(kanbanColumns).map(([status, label]) => (
              <option key={status} value={status}>
                {label}
              </option>
            ))}
          </select>
        </footer>
      ) : null}
    </motion.article>
  );
}

function describeDue(due: Date, done: boolean): { text: string; tone: DueTone } {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfDue = new Date(due.getFullYear(), due.getMonth(), due.getDate());
  const dayDiff = Math.round((startOfDue.getTime() - startOfToday.getTime()) / 86_400_000);
  const time = due.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });

  if (done) {
    return { text: "Done", tone: "done" };
  }

  if (dayDiff < 0) {
    return { text: dayDiff === -1 ? "Yesterday" : "Overdue", tone: "overdue" };
  }

  if (dayDiff === 0) {
    return { text: `Today · ${time}`, tone: "soon" };
  }

  if (dayDiff === 1) {
    return { text: `Tomorrow · ${time}`, tone: "soon" };
  }

  if (dayDiff < 7) {
    return { text: capitalizeFirst(due.toLocaleDateString(undefined, { weekday: "long" })), tone: "normal" };
  }

  const sameYear = due.getFullYear() === now.getFullYear();
  return {
    text: due.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      ...(sameYear ? {} : { year: "numeric" })
    }),
    tone: "normal"
  };
}

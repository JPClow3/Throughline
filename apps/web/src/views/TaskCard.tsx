import { Course, Task, TaskStatus, kanbanColumns } from "@throughline/domain";
import {
  ArrowsClockwise,
  Check,
  Clock,
  Diamond,
  ListChecks,
  Note as StickyNote,
  Play,
  Plus,
  Target
} from "@phosphor-icons/react";
import { motion, AnimatePresence } from "motion/react";
import * as React from "react";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { APP_LOCALE, capitalizeFirst } from "../lib/format";

type TaskCardProps = {
  task: Task;
  course?: Course;
  compact?: boolean;
  showGameLayer?: boolean;
  goalLabel?: string;
  noteCount?: number;
  onComplete?: (task: Task) => void;
  onStatusChange?: (taskId: string, status: TaskStatus) => void;
  onEdit?: (task: Task) => void;
  onUpdateTask?: (task: Task) => void;
  onOpenNotes?: () => void;
  onStartFocus?: (task: Task) => void;
};

type DueTone = "done" | "overdue" | "soon" | "normal";

function CompletionBurst({ task }: { task: Task }) {
  const [particles] = useState(() =>
    Array.from({ length: 14 }, (_, index) => ({
      x: Math.cos((index / 14) * Math.PI * 2) * (36 + (index % 4) * 14),
      y: Math.sin((index / 14) * Math.PI * 2) * (30 + (index % 3) * 12),
      color: ["var(--yellow)", "var(--blue)", "var(--red)", "var(--green)"][index % 4]
    }))
  );

  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center overflow-visible" aria-hidden="true">
      <motion.span
        className="xp-burst"
        initial={{ opacity: 0, y: 6, scale: 0.7 }}
        animate={{ opacity: [0, 1, 1, 0], y: [-4, -26, -34, -44], scale: 1 }}
        transition={{ duration: 1.5, times: [0, 0.15, 0.75, 1], ease: "easeOut" }}
      >
        +{task.xp} XP
      </motion.span>
      {particles.map((particle, index) => (
        <motion.span
          key={index}
          className="absolute h-2 w-2 border-2 border-[var(--line)]"
          style={{ backgroundColor: particle.color }}
          initial={{ x: 0, y: 0, opacity: 1, scale: 0, rotate: 0 }}
          animate={{
            x: particle.x,
            y: [0, particle.y - 18, particle.y + 26],
            opacity: [1, 1, 0],
            scale: [0, 1, 0.7],
            rotate: index % 2 ? 180 : -180
          }}
          transition={{ duration: 0.8 + (index % 3) * 0.15, ease: "easeOut", times: [0, 0.45, 1] }}
        />
      ))}
    </div>
  );
}

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
  onUpdateTask,
  onOpenNotes,
  onStartFocus
}: TaskCardProps) {
  const done = task.status === "done";
  const due = task.dueAt ? new Date(task.dueAt) : undefined;
  const dueInfo = due ? describeDue(due, done) : undefined;
  const totalSubtasks = task.subtasks?.length ?? 0;
  const completedSubtasks = task.subtasks?.filter((subtask) => subtask.completed).length ?? 0;

  const [expanded, setExpanded] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [justCompleted, setJustCompleted] = useState(false);
  const wasDoneRef = useRef(task.status === "done");
  const showSubtaskEditor = Boolean(onUpdateTask && (expanded || totalSubtasks === 0));

  useEffect(() => {
    if (task.status === "done" && !wasDoneRef.current) {
      setJustCompleted(true);
      const timer = setTimeout(() => setJustCompleted(false), 2000);
      return () => clearTimeout(timer);
    }
    wasDoneRef.current = task.status === "done";
  }, [task.status]);

  function toggleSubtask(index: number) {
    if (!onUpdateTask) return;
    const nextSubtasks = [...(task.subtasks || [])];
    nextSubtasks[index] = { ...nextSubtasks[index], completed: !nextSubtasks[index].completed };
    onUpdateTask({ ...task, subtasks: nextSubtasks });
  }

  function handleAddSubtask(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" && newSubtaskTitle.trim() && onUpdateTask) {
      event.preventDefault();
      const newSubtask = { id: crypto.randomUUID(), title: newSubtaskTitle.trim(), completed: false };
      onUpdateTask({ ...task, subtasks: [...(task.subtasks || []), newSubtask] });
      setNewSubtaskTitle("");
      setExpanded(true);
    }
  }

  return (
    <motion.article
      className={`task-card${compact ? " task-card-compact" : ""}${done ? " is-done" : ""}${
        !done && (task.priority === "high" || task.priority === "critical") ? " has-priority" : ""
      }`}
      style={{ "--project-color": course?.color ?? "var(--ink-faint)" } as CSSProperties}
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={justCompleted ? { scale: [1, 1.03, 1] } : { opacity: 1, y: 0, scale: 1 }}
      whileHover={justCompleted ? undefined : { translateX: -2, translateY: -2 }}
      whileTap={{ scale: 0.985 }}
      transition={{ type: "spring", stiffness: 380, damping: 28 }}
    >
      <AnimatePresence>{justCompleted ? <CompletionBurst task={task} /> : null}</AnimatePresence>

      <div className="task-card-top">
        <h3 className={`task-card-title ${compact ? "line-clamp-2" : ""}`}>
          {onEdit ? (
            <button type="button" className={`task-card-edit ${compact ? "w-full text-left" : ""}`} onClick={() => onEdit(task)}>
              {task.title}
            </button>
          ) : (
            task.title
          )}
        </h3>
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
          <motion.span initial={false} animate={done ? { rotate: [0, -12, 0] } : { rotate: 0 }} transition={{ duration: 0.3 }}>
            <Check size={15} weight="bold" />
          </motion.span>
        </button>
      </div>

      <div className="task-card-meta">
        {!done && (task.priority === "high" || task.priority === "critical") ? (
          <span className="sr-only">{task.priority === "critical" ? "Critical priority" : "High priority"}</span>
        ) : null}
        {course ? (
          <span className="chip-static">
            <ProjectDot />
            {course.code ?? course.name}
          </span>
        ) : (
          <span className="chip-static">
            <span className="project-dot" aria-hidden="true" style={{ background: "transparent" }} />
            No project
          </span>
        )}
        {dueInfo ? (
          <span className={`meta-due chip-static meta-due-${dueInfo.tone}`}>
            <Clock size={12} weight="bold" />
            {dueInfo.text}
          </span>
        ) : null}
      </div>

      {!compact && task.description ? <p className="task-card-summary">{task.description}</p> : null}

      {totalSubtasks ? (
        <button
          type="button"
          className={`subtask-progress${expanded ? " mb-2 mt-3" : ""}`}
          onClick={(event) => {
            event.stopPropagation();
            setExpanded(!expanded);
          }}
          aria-expanded={expanded}
          aria-label={`${completedSubtasks} of ${totalSubtasks} steps complete`}
        >
          <div style={{ width: `${Math.round((completedSubtasks / totalSubtasks) * 100)}%` }} />
        </button>
      ) : null}

      {showSubtaskEditor ? (
        <div className="mt-2 flex flex-col gap-0.5 overflow-hidden" onClick={(event) => event.stopPropagation()}>
          <AnimatePresence initial={false}>
            {showSubtaskEditor ? (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="flex flex-col gap-0.5"
              >
                {(task.subtasks || []).map((subtask, index) => (
                  <label key={subtask.id} className={`subtask-row cursor-pointer${subtask.completed ? " done" : ""}`}>
                    <input type="checkbox" className="checkbox" checked={subtask.completed} onChange={() => toggleSubtask(index)} />
                    <span className="min-w-0 flex-1 truncate">{subtask.title}</span>
                  </label>
                ))}
                <div className="subtask-add-row">
                  <Plus size={14} weight="bold" style={{ color: "var(--ink-faint)" }} />
                  <input
                    type="text"
                    value={newSubtaskTitle}
                    onChange={(event) => setNewSubtaskTitle(event.target.value)}
                    onKeyDown={handleAddSubtask}
                    placeholder="Add subtask..."
                  />
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      ) : null}

      <div className="task-card-meta">
        {goalLabel ? (
          <span className="meta-chip">
            <Target size={12} weight="bold" />
            {goalLabel}
          </span>
        ) : null}
        {task.recurrence ? (
          <span className="meta-chip" title={`Repeats ${task.recurrence.pattern}`}>
            <ArrowsClockwise size={12} weight="bold" />
          </span>
        ) : null}
        {totalSubtasks > 0 && onUpdateTask ? (
          <button
            type="button"
            className="meta-chip"
            onClick={(event) => {
              event.stopPropagation();
              setExpanded(!expanded);
            }}
          >
            <ListChecks size={12} weight="bold" />
            {completedSubtasks}/{totalSubtasks}
          </button>
        ) : null}
        {noteCount ? (
          onOpenNotes ? (
            <button
              type="button"
              className="meta-chip"
              onClick={onOpenNotes}
              aria-label={`${noteCount} linked ${noteCount === 1 ? "note" : "notes"} — open Notes`}
            >
              <StickyNote size={12} weight="bold" />
              {noteCount}
            </button>
          ) : (
            <span className="meta-chip">
              <StickyNote size={12} weight="bold" />
              {noteCount}
            </span>
          )
        ) : null}
        {onStartFocus && !done ? (
          <button
            type="button"
            className="meta-chip"
            onClick={(event) => {
              event.stopPropagation();
              onStartFocus(task);
            }}
            aria-label={`Start focus mode for ${task.title}`}
          >
            <Play size={12} weight="bold" />
            Focus
          </button>
        ) : null}
        {showGameLayer ? (
          <span className="meta-chip meta-xp">
            <Diamond size={12} weight="bold" />
            {task.xp} XP
          </span>
        ) : null}
      </div>

      {onStatusChange ? (
        <footer className="task-card-foot">
          <select
            className="input"
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

function ProjectDot() {
  return <span className="project-dot" aria-hidden="true" />;
}

function describeDue(due: Date, done: boolean): { text: string; tone: DueTone } {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfDue = new Date(due.getFullYear(), due.getMonth(), due.getDate());
  const dayDiff = Math.round((startOfDue.getTime() - startOfToday.getTime()) / 86_400_000);
  const time = due.toLocaleTimeString(APP_LOCALE, { hour: "2-digit", minute: "2-digit" });

  if (done) {
    return { text: "Done", tone: "done" };
  }

  if (dayDiff < 0) {
    return {
      text: dayDiff === -1 ? "Yesterday" : `Overdue · ${Math.abs(dayDiff)}d`,
      tone: "overdue"
    };
  }

  if (dayDiff === 0) {
    return { text: `Today · ${time}`, tone: "soon" };
  }

  if (dayDiff === 1) {
    return { text: `Tomorrow · ${time}`, tone: "soon" };
  }

  if (dayDiff < 7) {
    return { text: capitalizeFirst(due.toLocaleDateString(APP_LOCALE, { weekday: "long" })), tone: "normal" };
  }

  const sameYear = due.getFullYear() === now.getFullYear();
  return {
    text: due.toLocaleDateString(APP_LOCALE, {
      month: "short",
      day: "numeric",
      ...(sameYear ? {} : { year: "numeric" })
    }),
    tone: "normal"
  };
}

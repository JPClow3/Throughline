import { Course, Task, TaskStatus, kanbanColumns } from "@throughline/domain";
import { Check, Clock as Clock3, Diamond as Gem, ListChecks, Note as StickyNote, Target, Plus, CaretDown, CaretUp, Play } from "@phosphor-icons/react";
import { motion, AnimatePresence } from "motion/react";
import { useState, type CSSProperties } from "react";
import { APP_LOCALE, capitalizeFirst } from "../lib/format";

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
  onUpdateTask?: (task: Task) => void;
  /** Open the Notes view (used by the linked-notes count chip). */
  onOpenNotes?: () => void;
  onStartFocus?: (task: Task) => void;
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
  onUpdateTask,
  onOpenNotes,
  onStartFocus
}: TaskCardProps) {
  const done = task.status === "done";
  const due = task.dueAt ? new Date(task.dueAt) : undefined;
  const dueInfo = due ? describeDue(due, done) : undefined;
  const totalSubtasks = task.subtasks.length;
  const completedSubtasks = task.subtasks.filter((subtask) => subtask.completed).length;

  const [expanded, setExpanded] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");

  function toggleSubtask(index: number) {
    if (!onUpdateTask) return;
    const nextSubtasks = [...task.subtasks];
    nextSubtasks[index] = { ...nextSubtasks[index], completed: !nextSubtasks[index].completed };
    onUpdateTask({ ...task, subtasks: nextSubtasks });
  }

  function handleAddSubtask(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && newSubtaskTitle.trim() && onUpdateTask) {
      e.preventDefault();
      onUpdateTask({
        ...task,
        subtasks: [...task.subtasks, { id: crypto.randomUUID(), title: newSubtaskTitle.trim(), completed: false }]
      });
      setNewSubtaskTitle("");
    }
  }

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
          <motion.div
            initial={false}
            animate={done ? { scale: [1, 1.4, 1], rotate: [0, 15, 0] } : { scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 12 }}
          >
            <Check size={16} />
          </motion.div>
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
          className={`subtask-progress cursor-pointer hover:opacity-80 transition-opacity ${expanded ? 'mb-2' : ''}`}
          onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
          aria-label={`${completedSubtasks} of ${totalSubtasks} steps complete`}
        >
          <div style={{ width: `${Math.round((completedSubtasks / totalSubtasks) * 100)}%` }} />
        </div>
      ) : null}

      <AnimatePresence>
        {expanded && onUpdateTask && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex flex-col gap-2 mt-2 mb-4 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {task.subtasks.map((st, idx) => (
              <label key={st.id} className="flex items-center gap-3 text-sm text-on-surface-variant hover:text-on-surface cursor-pointer p-1 -mx-1 rounded hover:bg-white/40 transition-colors">
                <input type="checkbox" checked={st.completed} onChange={() => toggleSubtask(idx)} className="w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary focus:ring-offset-0 bg-transparent" />
                <span className={st.completed ? "line-through opacity-60" : ""}>{st.title}</span>
              </label>
            ))}
            <div className="flex items-center gap-3 mt-1 text-sm p-1 -mx-1">
              <Plus size={16} className="text-outline flex-shrink-0 ml-0.5" />
              <input 
                type="text" 
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                onKeyDown={handleAddSubtask}
                placeholder="Add step (press Enter)..." 
                className="bg-transparent border-none focus:ring-0 p-0 text-on-surface placeholder-outline-variant w-full"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
        {totalSubtasks || onUpdateTask ? (
          <button 
            type="button"
            className="meta-chip hover:bg-surface-container-highest cursor-pointer transition-colors"
            onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
          >
            <ListChecks size={14} />
            {totalSubtasks > 0 ? `${completedSubtasks}/${totalSubtasks}` : "Add steps"}
            {expanded ? <CaretUp size={12} className="ml-1 opacity-50"/> : <CaretDown size={12} className="ml-1 opacity-50"/>}
          </button>
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
        {onStartFocus && !done ? (
          <button
            type="button"
            className="meta-chip meta-chip-button hover:bg-surface-container-highest cursor-pointer transition-colors"
            onClick={(e) => { e.stopPropagation(); onStartFocus(task); }}
            aria-label={`Start focus mode for ${task.title}`}
          >
            <Play size={14} />
            Focus
          </button>
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
  const time = due.toLocaleTimeString(APP_LOCALE, { hour: "2-digit", minute: "2-digit" });

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

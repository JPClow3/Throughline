import { Course, Task, TaskStatus, kanbanColumns } from "@throughline/domain";
import { Check, Clock as Clock3, Diamond as Gem, ListChecks, Note as StickyNote, Target, Plus, CaretDown, CaretUp, Play, ArrowsClockwise } from "@phosphor-icons/react";
import { motion, AnimatePresence } from "motion/react";
import * as React from "react";
import { useState, useEffect, useRef, type CSSProperties } from "react";
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
  /** Adds a distinct visual urgency (pulsing glow) */
  urgentGlow?: boolean;
};

type DueTone = "done" | "overdue" | "soon" | "normal";

function RewardAnimation({ showGameLayer }: { showGameLayer: boolean }) {
  const [particles, setParticles] = useState<{x: number, y: number, scale: number, duration: number, color: string, rotation: number}[]>([]);

  useEffect(() => {
    // We generate particles anyway, but fewer if not showGameLayer
    const count = showGameLayer ? 24 : 8;
    const colors = ['var(--tl-accent-violet)', 'var(--tl-accent-blue)', 'var(--tl-accent-aqua)', 'var(--tl-accent-pink)'];
    
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setParticles(
      Array.from({ length: count }).map((_, i) => {
        const angle = (i / count) * Math.PI * 2 + (Math.random() * 0.5 - 0.25);
        const distance = showGameLayer ? 50 + Math.random() * 60 : 30 + Math.random() * 30;
        return {
          x: Math.cos(angle) * distance,
          y: Math.sin(angle) * distance,
          scale: Math.random() * 0.6 + 0.4,
          duration: 0.5 + Math.random() * 0.3,
          color: colors[Math.floor(Math.random() * colors.length)],
          rotation: Math.random() * 360
        };
      })
    );
  }, [showGameLayer]);

  return (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-visible z-10" aria-hidden="true">
      {showGameLayer && (
        <motion.div
          initial={{ opacity: 0, scale: 2, rotate: -15 }}
          animate={{ opacity: [0, 1, 1, 0], scale: [2, 1, 1, 1.1], rotate: [-15, -5, -5, -5] }}
          transition={{ duration: 1.5, times: [0, 0.15, 0.8, 1], ease: "easeOut" }}
          className="text-4xl font-black tracking-widest uppercase border-4 border-current px-4 py-2 rounded-lg mix-blend-overlay"
          style={{ color: 'var(--tl-accent-violet)' }}
        >
          DONE
        </motion.div>
      )}
      {particles.map((p, i) => (
        <motion.div
          key={i}
          initial={{ x: 0, y: 0, opacity: 1, scale: 0, rotate: 0 }}
          animate={{ 
            x: p.x, 
            y: p.y,
            opacity: 0,
            scale: p.scale,
            rotate: p.rotation
          }}
          transition={{ duration: p.duration, ease: "easeOut" }}
          className={`absolute w-3 h-3 ${i % 2 === 0 ? 'rounded-full' : 'rounded-sm'}`}
          style={{ backgroundColor: p.color }}
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
  onStartFocus,
  urgentGlow = false
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

  function handleAddSubtask(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && newSubtaskTitle.trim() && onUpdateTask) {
      e.preventDefault();
      const newSubtask = { id: crypto.randomUUID(), title: newSubtaskTitle.trim(), completed: false };
      onUpdateTask({ ...task, subtasks: [...(task.subtasks || []), newSubtask] });
      setNewSubtaskTitle("");
      setExpanded(true); // ensure list is open when adding
    }
  }

  return (
    <motion.article
      className={`task-card${compact ? " task-card-compact" : ""}${done ? " is-done" : ""}${urgentGlow ? " urgent-pulse-glow" : ""} relative`}
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={justCompleted ? { opacity: 1, y: [0, -6, 0], scale: [1, 1.02, 1] } : { opacity: 1, y: 0, scale: 1 }}
      whileHover={justCompleted ? undefined : { y: -2 }}
      transition={justCompleted ? { duration: 0.4, ease: "easeOut" } : { type: "spring", stiffness: 300, damping: 28 }}
    >
      <AnimatePresence>
        {justCompleted && (
          <motion.div
            initial={{ opacity: 0, y: 0, scale: 0.5 }}
            animate={{ opacity: 1, y: -40, scale: 1.2 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="absolute z-50 pointer-events-none flex flex-col items-center gap-1 font-bold"
            style={{ left: "50%", x: "-50%", top: "20%" }}
          >
            <span className="text-primary drop-shadow-md bg-surface/50 backdrop-blur px-2 py-1 rounded-full whitespace-nowrap">
              +{task.xp} XP
            </span>
            {task.attributes?.map(attr => (
              <span key={attr} className="text-[10px] text-primary/90 uppercase tracking-widest drop-shadow-sm bg-surface/50 backdrop-blur px-1.5 py-0.5 rounded-full whitespace-nowrap">
                + {attr}
              </span>
            ))}
          </motion.div>
        )}
        {justCompleted && <RewardAnimation showGameLayer={showGameLayer} />}
      </AnimatePresence>
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

      <h3 className={`task-card-title ${compact ? 'line-clamp-2' : ''}`}>
        {onEdit ? (
          <button type="button" className={`task-card-edit ${compact ? 'text-left w-full' : ''}`} onClick={() => onEdit(task)}>
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

      {onUpdateTask && (
        <div 
          className="flex flex-col gap-2 mt-2 mb-3 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <AnimatePresence>
            {expanded && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="flex flex-col gap-2"
              >
                {(task.subtasks || []).map((st, idx) => (
                  <label key={st.id} className="flex items-center gap-3 text-sm text-on-surface-variant hover:text-on-surface cursor-pointer p-1 -mx-1 rounded hover:bg-[var(--accent-soft)] transition-colors min-w-0">
                    <input type="checkbox" checked={st.completed} onChange={() => toggleSubtask(idx)} className="w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary focus:ring-offset-0 bg-transparent flex-shrink-0" />
                    <span className={`truncate flex-1 min-w-0 ${st.completed ? "line-through opacity-60" : ""}`}>{st.title}</span>
                  </label>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
          
          <div className="flex items-center gap-3 mt-1 text-sm p-1 -mx-1 opacity-60 hover:opacity-100 focus-within:opacity-100 transition-opacity">
            <Plus size={16} className="text-outline flex-shrink-0 ml-0.5" />
            <input 
              type="text" 
              value={newSubtaskTitle}
              onChange={(e) => setNewSubtaskTitle(e.target.value)}
              onKeyDown={handleAddSubtask}
              placeholder="Add subtask (press Enter)..." 
              className="bg-transparent border-none focus:ring-0 p-0 text-on-surface placeholder-outline-variant w-full"
            />
          </div>
        </div>
      )}

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
        {task.recurrence ? (
          <span className="meta-chip" title={`Repeats ${task.recurrence.pattern}`}>
            <ArrowsClockwise size={14} />
          </span>
        ) : null}
        {totalSubtasks > 0 && onUpdateTask ? (
          <button 
            type="button"
            className="meta-chip hover:bg-surface-container-highest cursor-pointer transition-colors"
            onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
          >
            <ListChecks size={14} />
            {completedSubtasks}/{totalSubtasks}
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

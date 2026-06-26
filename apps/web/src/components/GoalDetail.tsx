import {
  Course,
  Goal,
  GoalStatus,
  Note,
  Task,
  TaskStatus,
  deriveGoalProgress,
  nextGoalTaskOrder,
  noteDisplayTitle,
  noteExcerpt,
  notesForGoal,
  tasksForGoal
} from "@throughline/domain";
import {
  ArrowLeft,
  CaretDown,
  CaretUp,
  CheckCircle as CheckCircle2,
  Note as FileText,
  PencilSimple,
  Plus,
  Target,
  Trash as Trash2
} from "@phosphor-icons/react";
import { FormEvent, useState, type CSSProperties } from "react";
import type { NoteInput, TaskInput } from "../data/repositories";
import { APP_LOCALE } from "../lib/format";
import { EmptyState } from "./EmptyState";
import { GoalRing } from "./GoalRing";
import { TaskCard } from "./TaskCard";

type GoalDetailProps = {
  goal: Goal;
  tasks: Task[];
  courses: Course[];
  notes: Note[];
  showGameLayer?: boolean;
  onBack: () => void;
  onAddTask: (input: TaskInput) => Promise<void>;
  onAddNote: (input?: NoteInput) => Promise<Note>;
  onCompleteTask: (task: Task) => void;
  onStatusChange: (taskId: string, status: TaskStatus) => void;
  onEditTask: (task: Task) => void;
  onUpdateTask?: (task: Task) => void;
  onStartFocus?: (task: Task) => void;
  onEditGoal: (goal: Goal) => void;
  onReorderTask: (task: Task) => Promise<void>;
  onSetGoalStatus: (goalId: string, status: GoalStatus) => Promise<void>;
  onDeleteGoal: (goalId: string) => Promise<void>;
};

export function GoalDetail({
  goal,
  tasks,
  courses,
  notes,
  showGameLayer,
  onBack,
  onAddTask,
  onAddNote,
  onCompleteTask,
  onStatusChange,
  onEditTask,
  onUpdateTask,
  onStartFocus,
  onEditGoal,
  onReorderTask,
  onSetGoalStatus,
  onDeleteGoal
}: GoalDetailProps) {
  const [stepTitle, setStepTitle] = useState("");
  const courseMap = new Map(courses.map((course) => [course.id, course]));
  const children = tasksForGoal(goal.id, tasks);
  const linkedNotes = notesForGoal(goal.id, notes);
  const progress = deriveGoalProgress(goal.id, tasks);
  const project = goal.projectId ? courseMap.get(goal.projectId) : undefined;
  const targetDate = goal.targetDate ? new Date(goal.targetDate) : undefined;
  const accent = goal.color ?? project?.color ?? "var(--accent)";

  const statusLabel = goal.status === "done" ? "Complete" : goal.status === "paused" ? "Paused" : "";

  async function addStep(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const title = stepTitle.trim();
    if (!title) {
      return;
    }

    await onAddTask({
      title,
      goalId: goal.id,
      order: nextGoalTaskOrder(goal.id, tasks),
      courseId: goal.projectId,
      priority: "medium",
      energy: 2,
      difficulty: 2,
      attributes: ["focus"]
    });
    setStepTitle("");
  }

  function moveStep(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= children.length) {
      return;
    }
    const reordered = [...children];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(target, 0, moved);
    reordered.forEach((task, position) => {
      if (task.order !== position) {
        void onReorderTask({ ...task, order: position });
      }
    });
  }

  return (
    <section className="goal-detail" style={{ "--project-color": accent } as CSSProperties}>
      <div className="goal-detail-head glass-panel">
        <button className="goal-back" type="button" onClick={onBack}>
          <ArrowLeft size={16} /> All goals
        </button>
        <div className="goal-detail-main">
          <div className="goal-detail-text">
            <span className="eyebrow">{project ? project.name : "Goal"}</span>
            <h1>{goal.title}</h1>
            {goal.summary ? <p>{goal.summary}</p> : null}
            <div className="goal-detail-meta">
              <span>
                <Target size={15} /> {progress.completed} of {progress.total} done
              </span>
              {targetDate ? (
                <span>Target {targetDate.toLocaleDateString(APP_LOCALE, { month: "short", day: "numeric" })}</span>
              ) : null}
              {statusLabel ? <span className={`goal-status-pill is-${goal.status}`}>{statusLabel}</span> : null}
            </div>
          </div>
          <GoalRing ratio={progress.ratio} size={88} />
        </div>
        <div className="button-row">
          {progress.isComplete && goal.status !== "done" ? (
            <button className="primary-button" type="button" onClick={() => void onSetGoalStatus(goal.id, "done")}>
              <CheckCircle2 size={17} /> Mark goal complete
            </button>
          ) : null}
          {goal.status === "done" ? (
            <button className="secondary-button" type="button" onClick={() => void onSetGoalStatus(goal.id, "active")}>
              Reopen goal
            </button>
          ) : null}
          <button className="secondary-button" type="button" onClick={() => onEditGoal(goal)}>
            <PencilSimple size={16} /> Edit
          </button>
          <button className="secondary-button" type="button" onClick={() => void onDeleteGoal(goal.id)}>
            <Trash2 size={16} /> Delete
          </button>
        </div>
      </div>

      <div className="goal-steps">
        <div className="section-heading">
          <Target size={18} />
          <div>
            <span className="eyebrow">Steps</span>
            <h2>Tasks toward this goal</h2>
          </div>
        </div>
        <form className="goal-add-step" onSubmit={addStep}>
          <input
            value={stepTitle}
            onChange={(event) => setStepTitle(event.target.value)}
            placeholder="Add a step…"
            aria-label="New step"
          />
          <button className="primary-button" type="submit">
            <Plus size={17} /> Add
          </button>
        </form>
        <div className="quest-list-stack">
          {children.length ? (
            children.map((task, index) => (
              <div key={task.id} className="goal-step">
                <div className="goal-step-reorder">
                  <button
                    type="button"
                    aria-label={`Move ${task.title} up`}
                    disabled={index === 0}
                    onClick={() => moveStep(index, -1)}
                  >
                    <CaretUp size={14} />
                  </button>
                  <button
                    type="button"
                    aria-label={`Move ${task.title} down`}
                    disabled={index === children.length - 1}
                    onClick={() => moveStep(index, 1)}
                  >
                    <CaretDown size={14} />
                  </button>
                </div>
                <TaskCard
                  task={task}
                  course={courseMap.get(task.courseId ?? "")}
                  showGameLayer={showGameLayer}
                  onComplete={onCompleteTask}
                  onStatusChange={onStatusChange}
                  onEdit={onEditTask}
                  onUpdateTask={onUpdateTask}
                  onStartFocus={onStartFocus}
                />
              </div>
            ))
          ) : (
            <EmptyState
              variant="inline"
              icon={<CheckCircle2 size={24} />}
              title="No steps yet"
              body="Break this goal into a few small tasks."
            />
          )}
        </div>
      </div>

      <div className="goal-notes">
        <div className="section-heading">
          <FileText size={18} />
          <div>
            <span className="eyebrow">Notes</span>
            <h2>Linked notes</h2>
          </div>
        </div>
        <button
          className="secondary-button"
          type="button"
          onClick={() => void onAddNote({ goalIds: [goal.id], projectId: goal.projectId })}
        >
          <Plus size={16} /> Add linked note
        </button>
        <div className="goal-note-list">
          {linkedNotes.length ? (
            linkedNotes.map((note) => (
              <div key={note.id} className="goal-note-card glass-panel">
                <strong>{noteDisplayTitle(note)}</strong>
                <p>{noteExcerpt(note.body, 100) || "Empty note — open Notes to write it."}</p>
              </div>
            ))
          ) : (
            <EmptyState
              variant="inline"
              icon={<FileText size={24} />}
              title="No notes linked yet"
              body="Add one to capture context for this goal."
            />
          )}
        </div>
      </div>
    </section>
  );
}

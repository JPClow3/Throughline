import { Course, Goal, GoalStatus, Note, Task, TaskStatus, deriveGoalProgress, nextGoalTaskOrder, noteDisplayTitle, noteExcerpt, notesForGoal, tasksForGoal } from "@throughline/domain";
import { ArrowLeft, CaretDown, CaretUp, CheckCircle, Note as FileText, PencilSimple, Plus, Target, Trash } from "@phosphor-icons/react";
import { FormEvent, useState } from "react";
import type { NoteInput, TaskInput } from "../data/repositories";
import { APP_LOCALE } from "../lib/format";
import { Button, Card, EmptyState, Ring, SectionHeading, TextInput } from "../ui";
import { TaskCard } from "./TaskCard";

export function GoalsView({
  goals,
  tasks,
  courses,
  notes,
  selectedId,
  onSelectGoal,
  onNewGoal,
  onSetGoalStatus,
  onDeleteGoal,
  onEditGoal,
  onAddTask,
  onAddNote,
  onCompleteTask,
  onStatusChange,
  onEditTask,
  onUpdateTask,
  onStartFocus,
  onReorderTask
}: {
  goals: Goal[];
  tasks: Task[];
  courses: Course[];
  notes: Note[];
  selectedId: string | null;
  onSelectGoal: (goalId: string | null) => void;
  onNewGoal: () => void;
  onSetGoalStatus: (goalId: string, status: GoalStatus) => Promise<void>;
  onDeleteGoal: (goalId: string) => Promise<void>;
  onEditGoal: (goal: Goal) => void;
  onAddTask: (input: TaskInput) => Promise<void>;
  onAddNote: (input?: NoteInput) => Promise<Note>;
  onCompleteTask: (task: Task) => void;
  onStatusChange: (taskId: string, status: TaskStatus) => void;
  onEditTask: (task: Task) => void;
  onUpdateTask?: (task: Task) => void;
  onStartFocus?: (task: Task) => void;
  onReorderTask: (task: Task) => Promise<void>;
}) {
  const selected = selectedId ? goals.find((goal) => goal.id === selectedId) : undefined;

  if (selected) {
    return (
      <GoalDetail
        goal={selected}
        tasks={tasks}
        courses={courses}
        notes={notes}
        onBack={() => onSelectGoal(null)}
        onAddTask={onAddTask}
        onAddNote={onAddNote}
        onCompleteTask={onCompleteTask}
        onStatusChange={onStatusChange}
        onEditTask={onEditTask}
        onUpdateTask={onUpdateTask}
        onStartFocus={onStartFocus}
        onEditGoal={onEditGoal}
        onReorderTask={onReorderTask}
        onSetGoalStatus={onSetGoalStatus}
        onDeleteGoal={async (id) => {
          await onDeleteGoal(id);
          onSelectGoal(null);
        }}
      />
    );
  }

  return (
    <section className="view-layout">
      <header className="view-head">
        <div>
          <span className="eyebrow">End goals</span>
          <h1 className="view-title">Goals</h1>
        </div>
        <Button variant="accent" onClick={onNewGoal}>
          <Plus size={16} weight="bold" /> New goal
        </Button>
      </header>

      <div className="goals-grid">
        {goals.length ? (
          goals.map((goal) => {
            const progress = deriveGoalProgress(goal.id, tasks);
            const project = goal.projectId ? courses.find((course) => course.id === goal.projectId) : undefined;
            const accent = goal.color ?? project?.color ?? "var(--blue)";
            return (
              <button
                key={goal.id}
                className="ik-card goal-card"
                type="button"
                onClick={() => onSelectGoal(goal.id)}
                style={{ "--project-color": accent } as React.CSSProperties}
              >
                <div className="goal-card-top">
                  <span className="chip-static">
                    <span className="project-dot" aria-hidden="true" />
                    {project?.name ?? "Goal"}
                  </span>
                  <Ring ratio={progress.ratio} color={accent} />
                </div>
                <h2>{goal.title}</h2>
                {goal.summary ? <p>{goal.summary}</p> : null}
                <div className="goal-card-foot">
                  <span>{progress.completed}/{progress.total} steps</span>
                  {goal.targetDate ? (
                    <span>Target {new Date(goal.targetDate).toLocaleDateString(APP_LOCALE, { month: "short", day: "numeric" })}</span>
                  ) : null}
                </div>
              </button>
            );
          })
        ) : (
          <EmptyState
            icon={<Target size={24} weight="bold" />}
            title="No goals yet"
            body="Set an end goal and break it into small steps."
            action={
              <Button variant="primary" onClick={onNewGoal}>
                <Plus size={15} weight="bold" /> New goal
              </Button>
            }
          />
        )}
      </div>
    </section>
  );
}

function GoalDetail({
  goal,
  tasks,
  courses,
  notes,
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
}: {
  goal: Goal;
  tasks: Task[];
  courses: Course[];
  notes: Note[];
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
}) {
  const [stepTitle, setStepTitle] = useState("");
  const courseMap = new Map(courses.map((course) => [course.id, course]));
  const children = tasksForGoal(goal.id, tasks);
  const linkedNotes = notesForGoal(goal.id, notes);
  const progress = deriveGoalProgress(goal.id, tasks);
  const project = goal.projectId ? courseMap.get(goal.projectId) : undefined;
  const targetDate = goal.targetDate ? new Date(goal.targetDate) : undefined;
  const accent = goal.color ?? project?.color ?? "var(--blue)";

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
    <section className="goal-detail" style={{ "--project-color": accent } as React.CSSProperties}>
      <Card className="goal-detail-head">
        <div>
          <Button size="sm" onClick={onBack}>
            <ArrowLeft size={14} weight="bold" /> All goals
          </Button>
        </div>
        <div className="goal-detail-main">
          <div className="goal-detail-text">
            <span className="eyebrow">{project ? project.name : "Goal"}</span>
            <h1>{goal.title}</h1>
            {goal.summary ? <p>{goal.summary}</p> : null}
            <div className="goal-detail-meta">
              <span className="inline-flex items-center gap-1.5">
                <Target size={13} weight="bold" /> {progress.completed} of {progress.total} done
              </span>
              {targetDate ? (
                <span>Target {targetDate.toLocaleDateString(APP_LOCALE, { month: "short", day: "numeric" })}</span>
              ) : null}
              {statusLabel ? <span className={`goal-status-pill is-${goal.status}`}>{statusLabel}</span> : null}
            </div>
          </div>
          <Ring ratio={progress.ratio} size={88} color={accent} />
        </div>
        <div className="button-row">
          {progress.isComplete && goal.status !== "done" ? (
            <Button variant="primary" onClick={() => void onSetGoalStatus(goal.id, "done")}>
              <CheckCircle size={15} weight="bold" /> Mark goal complete
            </Button>
          ) : null}
          {goal.status === "done" ? (
            <Button onClick={() => void onSetGoalStatus(goal.id, "active")}>Reopen goal</Button>
          ) : null}
          <Button onClick={() => onEditGoal(goal)}>
            <PencilSimple size={14} weight="bold" /> Edit
          </Button>
          <Button variant="danger" onClick={() => void onDeleteGoal(goal.id)}>
            <Trash size={14} weight="bold" /> Delete
          </Button>
        </div>
      </Card>

      <div className="goal-steps">
        <SectionHeading icon={<Target size={17} weight="bold" style={{ color: "var(--ink-soft)" }} />} eyebrow="Steps" title="Tasks toward this goal" />
        <form className="goal-add-step" onSubmit={addStep}>
          <TextInput
            value={stepTitle}
            onChange={(event) => setStepTitle(event.target.value)}
            placeholder="Add a step…"
            aria-label="New step"
          />
          <Button variant="accent" type="submit">
            <Plus size={15} weight="bold" /> Add
          </Button>
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
                    <CaretUp size={12} weight="bold" />
                  </button>
                  <button
                    type="button"
                    aria-label={`Move ${task.title} down`}
                    disabled={index === children.length - 1}
                    onClick={() => moveStep(index, 1)}
                  >
                    <CaretDown size={12} weight="bold" />
                  </button>
                </div>
                <TaskCard
                  task={task}
                  course={courseMap.get(task.courseId ?? "")}
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
              icon={<CheckCircle size={22} weight="bold" />}
              title="No steps yet"
              body="Break this goal into a few small tasks."
            />
          )}
        </div>
      </div>

      <div className="goal-notes">
        <SectionHeading icon={<FileText size={17} weight="bold" style={{ color: "var(--ink-soft)" }} />} eyebrow="Notes" title="Linked notes" />
        <div>
          <Button
            onClick={() => void onAddNote({ goalIds: [goal.id], projectId: goal.projectId })}
          >
            <Plus size={14} weight="bold" /> Add linked note
          </Button>
        </div>
        <div className="goal-note-list">
          {linkedNotes.length ? (
            linkedNotes.map((note) => (
              <Card key={note.id} flat className="goal-note-card">
                <strong>{noteDisplayTitle(note)}</strong>
                <p>{noteExcerpt(note.body, 100) || "Empty note — open Notes to write it."}</p>
              </Card>
            ))
          ) : (
            <EmptyState
              variant="inline"
              icon={<FileText size={22} weight="bold" />}
              title="No notes linked yet"
              body="Add one to capture context for this goal."
            />
          )}
        </div>
      </div>
    </section>
  );
}

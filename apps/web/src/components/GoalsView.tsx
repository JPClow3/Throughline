import { Course, Goal, GoalStatus, Note, Task, TaskStatus, deriveGoalProgress } from "@throughline/domain";
import { Plus, Target } from "@phosphor-icons/react";
import { type CSSProperties } from "react";
import type { NoteInput, TaskInput } from "../data/repositories";
import { EmptyState } from "./EmptyState";
import { GoalDetail } from "./GoalDetail";
import { GoalRing } from "./GoalRing";

type GoalsViewProps = {
  goals: Goal[];
  tasks: Task[];
  courses: Course[];
  notes: Note[];
  showGameLayer?: boolean;
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
  onReorderTask: (task: Task) => Promise<void>;
};

export function GoalsView({
  goals,
  tasks,
  courses,
  notes,
  showGameLayer,
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
  onReorderTask
}: GoalsViewProps) {
  const selected = selectedId ? goals.find((goal) => goal.id === selectedId) : undefined;

  if (selected) {
    return (
      <GoalDetail
        goal={selected}
        tasks={tasks}
        courses={courses}
        notes={notes}
        showGameLayer={showGameLayer}
        onBack={() => onSelectGoal(null)}
        onAddTask={onAddTask}
        onAddNote={onAddNote}
        onCompleteTask={onCompleteTask}
        onStatusChange={onStatusChange}
        onEditTask={onEditTask}
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
    <section className="goals-view">
      <header className="view-head">
        <div>
          <span className="eyebrow">End goals</span>
          <h1>Goals</h1>
        </div>
        <button className="primary-button" type="button" onClick={onNewGoal}>
          <Plus size={17} /> New goal
        </button>
      </header>

      <div className="goals-grid">
        {goals.length ? (
          goals.map((goal) => {
            const progress = deriveGoalProgress(goal.id, tasks);
            const project = goal.projectId ? courses.find((course) => course.id === goal.projectId) : undefined;
            const accent = goal.color ?? project?.color ?? "var(--accent)";
            return (
              <button
                key={goal.id}
                className="goal-card glass-panel"
                type="button"
                onClick={() => onSelectGoal(goal.id)}
                style={{ "--project-color": accent } as CSSProperties}
              >
                <div className="goal-card-top">
                  <span className="project-chip">
                    <span className="project-dot" aria-hidden="true" />
                    {project?.name ?? "Goal"}
                  </span>
                  <GoalRing ratio={progress.ratio} />
                </div>
                <h2>{goal.title}</h2>
                {goal.summary ? <p>{goal.summary}</p> : null}
                <div className="goal-card-foot">
                  <span>
                    {progress.completed}/{progress.total} steps
                  </span>
                  {goal.targetDate ? (
                    <span>
                      Target {new Date(goal.targetDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                    </span>
                  ) : null}
                </div>
              </button>
            );
          })
        ) : (
          <EmptyState
            icon={<Target size={26} />}
            title="No goals yet"
            body="Set an end goal and break it into small steps."
            action={
              <button className="primary-button" type="button" onClick={onNewGoal}>
                <Plus size={17} /> New goal
              </button>
            }
          />
        )}
      </div>
    </section>
  );
}

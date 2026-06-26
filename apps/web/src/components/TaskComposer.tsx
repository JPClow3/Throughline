import { Course, Goal, Priority, RpgAttribute, Subtask, priorities, rpgAttributes } from "@throughline/domain";
import { CaretDown as ChevronDown, Plus } from "@phosphor-icons/react";
import { FormEvent, useEffect, useState } from "react";
import type { TaskInput } from "../data/repositories";

function toLocalInput(date?: Date) {
  if (!date) return "";
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

type TaskComposerProps = {
  courses: Course[];
  goals?: Goal[];
  showGameLayer?: boolean;
  initialDate?: Date;
  onAddTask: (input: TaskInput) => Promise<void>;
};

export function TaskComposer({ courses, goals = [], showGameLayer = false, initialDate, onAddTask }: TaskComposerProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [courseId, setCourseId] = useState("");
  const [goalId, setGoalId] = useState("");
  const [dueAt, setDueAt] = useState(() => toLocalInput(initialDate));
  const [reminderAt, setReminderAt] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [energy, setEnergy] = useState(2);
  const [difficulty, setDifficulty] = useState(2);
  const [attribute, setAttribute] = useState<RpgAttribute>("focus");
  const [tags, setTags] = useState("");
  const [subtasks, setSubtasks] = useState("");
  const [recurrence, setRecurrence] = useState<"daily" | "weekly" | "monthly" | "yearly" | "">("");
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (initialDate) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDueAt(toLocalInput(initialDate));
    }
  }, [initialDate]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim()) {
      return;
    }

    await onAddTask({
      title: title.trim(),
      description: description.trim() || undefined,
      courseId: courseId || undefined,
      goalId: goalId || undefined,
      dueAt: dueAt || undefined,
      reminderAt: reminderAt || undefined,
      priority,
      energy,
      difficulty,
      attributes: [attribute],
      tags: parseTags(tags),
      subtasks: parseSubtasks(subtasks),
      recurrence: recurrence || undefined
    });

    setTitle("");
    setDescription("");
    setCourseId("");
    setGoalId("");
    setDueAt("");
    setReminderAt("");
    setTags("");
    setSubtasks("");
    setPriority("medium");
    setRecurrence("");
  }

  return (
    <form className="composer-form" onSubmit={submit}>
      <label>
        <span>Title</span>
        <input autoFocus value={title} onChange={(event) => setTitle(event.target.value)} placeholder="What needs doing?" />
      </label>
      <div className="composer-grid">
        <label>
          <span>Project</span>
          <select value={courseId} onChange={(event) => setCourseId(event.target.value)}>
            <option value="">None</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.code ?? course.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Due</span>
          <input type="datetime-local" value={dueAt} onChange={(event) => setDueAt(event.target.value)} />
        </label>
      </div>

      {goals.length ? (
        <label>
          <span>Goal</span>
          <select value={goalId} onChange={(event) => setGoalId(event.target.value)}>
            <option value="">No goal</option>
            {goals.map((goal) => (
              <option key={goal.id} value={goal.id}>
                {goal.title}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      <button
        className="details-toggle"
        type="button"
        aria-expanded={expanded}
        onClick={() => setExpanded((value) => !value)}
      >
        <ChevronDown size={17} />
        Details
      </button>

      {expanded ? (
        <div className="composer-details">
          <label>
            <span>Description</span>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="A short note about what done looks like"
            />
          </label>
          <div className="composer-grid">
            <label>
              <span>Priority</span>
              <select value={priority} onChange={(event) => setPriority(event.target.value as Priority)}>
                {priorities.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Reminder</span>
              <input type="datetime-local" value={reminderAt} onChange={(event) => setReminderAt(event.target.value)} />
            </label>
          </div>
          <label>
            <span>Recurrence</span>
            <select value={recurrence} onChange={(event) => setRecurrence(event.target.value as "daily" | "weekly" | "monthly" | "yearly" | "")}>
              <option value="">None</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </label>
          <label>
            <span>Tags</span>
            <input value={tags} onChange={(event) => setTags(event.target.value)} placeholder="reading, errand" />
          </label>
          <label>
            <span>Subtasks</span>
            <textarea
              value={subtasks}
              onChange={(event) => setSubtasks(event.target.value)}
              placeholder={"Outline\nFirst draft\nReview"}
            />
          </label>

          {showGameLayer ? (
            <>
              <div className="range-row">
                <label>
                  <span>Energy {energy}</span>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={energy}
                    onChange={(event) => setEnergy(Number(event.target.value))}
                  />
                </label>
                <label>
                  <span>Difficulty {difficulty}</span>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={difficulty}
                    onChange={(event) => setDifficulty(Number(event.target.value))}
                  />
                </label>
              </div>
              <label>
                <span>Attribute</span>
                <select value={attribute} onChange={(event) => setAttribute(event.target.value as RpgAttribute)}>
                  {rpgAttributes.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>
            </>
          ) : null}
        </div>
      ) : null}

      <button className="primary-button" type="submit">
        <Plus size={18} />
        Add task
      </button>
    </form>
  );
}

function parseTags(value: string) {
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function parseSubtasks(value: string): Subtask[] {
  return value
    .split(/\r?\n/)
    .map((title) => title.trim())
    .filter(Boolean)
    .map((title, index) => ({
      id: `subtask_${Date.now()}_${index}`,
      title,
      completed: false
    }));
}

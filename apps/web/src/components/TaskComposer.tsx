import { Course, Goal, Priority, RpgAttribute, priorities, rpgAttributes } from "@throughline/domain";
import { CaretDown as ChevronDown, Plus, Trash as Trash2 } from "@phosphor-icons/react";
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
  const [subtasks, setSubtasks] = useState<{id: string, title: string, completed: boolean}[]>([]);
  const [recurrence, setRecurrence] = useState<"daily" | "weekly" | "biweekly" | "monthly" | "custom" | "">("");
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
      subtasks: subtasks.map(st => ({ ...st, title: st.title.trim() })).filter(st => st.title),
      recurrence: recurrence ? { pattern: recurrence } : undefined
    });

    setTitle("");
    setDescription("");
    setCourseId("");
    setGoalId("");
    setDueAt("");
    setReminderAt("");
    setTags("");
    setSubtasks([]);
    setPriority("medium");
    setRecurrence("");
  }

  return (
    <form className="composer-form" onSubmit={submit}>
      <label>
        <span>Title</span>
        <input autoFocus value={title} onChange={(event) => setTitle(event.target.value)} placeholder="What needs doing?" maxLength={140} />
      </label>
      <div className="composer-grid">
        <label>
          <span>Project</span>
          <select value={courseId} onChange={(event) => {
            const nextCourseId = event.target.value;
            setCourseId(nextCourseId);
            const course = courses.find(c => c.id === nextCourseId);
            if (course?.defaultAttributes?.[0]) {
              setAttribute(course.defaultAttributes[0]);
            }
          }}>
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
            <select value={recurrence} onChange={(event) => setRecurrence(event.target.value as "daily" | "weekly" | "biweekly" | "monthly" | "custom" | "")}>
              <option value="">None</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="biweekly">Biweekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </label>
          <label>
            <span>Tags</span>
            <input value={tags} onChange={(event) => setTags(event.target.value)} placeholder="reading, errand" />
          </label>
          <div className="subtasks-editor" style={{ marginBottom: "1rem" }}>
            <span style={{ fontSize: "var(--text-sm)", fontWeight: "var(--fw-medium)", color: "var(--ink-muted)", marginBottom: "0.4rem", display: "block" }}>Subtasks</span>
            <div className="subtasks-list" style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "0.5rem" }}>
              {subtasks.map((st, index) => (
                <div key={st.id} className="subtask-edit-row" style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                  <input type="checkbox" checked={st.completed} onChange={(e) => {
                    const next = [...subtasks];
                    next[index] = { ...next[index], completed: e.target.checked };
                    setSubtasks(next);
                  }} style={{ width: "auto" }} />
                  <input value={st.title} onChange={(e) => {
                    const next = [...subtasks];
                    next[index] = { ...next[index], title: e.target.value };
                    setSubtasks(next);
                  }} placeholder="Subtask title" style={{ flex: 1, margin: 0 }} />
                  <button type="button" onClick={() => {
                    setSubtasks(subtasks.filter((_, i) => i !== index));
                  }} aria-label="Delete subtask" className="secondary-button danger" style={{ padding: "0.5rem" }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
            <button type="button" className="secondary-button" onClick={() => {
              setSubtasks([...subtasks, { id: crypto.randomUUID(), title: "", completed: false }]);
            }}>
              <Plus size={14} /> Add step
            </button>
          </div>

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



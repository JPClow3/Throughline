import { Course, Goal, Priority, RpgAttribute, priorities, rpgAttributes } from "@throughline/domain";
import { CaretDown, Plus, Trash } from "@phosphor-icons/react";
import { FormEvent, useEffect, useRef, useState } from "react";
import type { TaskInput } from "../data/repositories";
import { Button, Field, Select, TextArea, TextInput } from "../ui";

function toLocalInput(date?: Date) {
  if (!date) return "";
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function TaskComposer({
  courses,
  goals = [],
  showGameLayer = false,
  initialDate,
  onAddTask
}: {
  courses: Course[];
  goals?: Goal[];
  showGameLayer?: boolean;
  initialDate?: Date;
  onAddTask: (input: TaskInput) => Promise<void>;
}) {
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
  const [subtasks, setSubtasks] = useState<Array<{ id: string; title: string; completed: boolean }>>([]);
  const [recurrence, setRecurrence] = useState<"daily" | "weekly" | "biweekly" | "monthly" | "custom" | "">("");
  const [expanded, setExpanded] = useState(false);
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const canSubmit = title.trim().length > 0 && !isSubmitting;

  useEffect(() => {
    if (initialDate) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDueAt(toLocalInput(initialDate));
    }
  }, [initialDate]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAttemptedSubmit(true);
    if (!canSubmit) {
      return;
    }

    if (submittingRef.current) {
      return;
    }
    submittingRef.current = true;
    setIsSubmitting(true);
    try {
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
        subtasks: subtasks.map((subtask) => ({ ...subtask, title: subtask.title.trim() })).filter((subtask) => subtask.title),
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
      setAttemptedSubmit(false);
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  }

  return (
    <form className="composer-form" onSubmit={submit}>
      <Field label="Title">
        <TextInput
          autoFocus
          required
          value={title}
          onChange={(event) => {
            setTitle(event.target.value);
            if (event.target.value.trim()) setAttemptedSubmit(false);
          }}
          placeholder="What needs doing?"
          maxLength={140}
          aria-describedby={attemptedSubmit && !canSubmit ? "task-title-error" : undefined}
        />
      </Field>
      {attemptedSubmit && !canSubmit ? (
        <p id="task-title-error" className="composer-error" role="alert">
          Add a title before saving this task.
        </p>
      ) : null}
      <div className="composer-grid">
        <Field label="Project">
          <Select
            value={courseId}
            onChange={(event) => {
              const nextCourseId = event.target.value;
              setCourseId(nextCourseId);
              const course = courses.find((item) => item.id === nextCourseId);
              if (course?.defaultAttributes?.[0]) {
                setAttribute(course.defaultAttributes[0]);
              }
            }}
          >
            <option value="">None</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.code ?? course.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Due">
          <TextInput type="datetime-local" value={dueAt} onChange={(event) => setDueAt(event.target.value)} />
        </Field>
      </div>

      {goals.length ? (
        <Field label="Goal">
          <Select value={goalId} onChange={(event) => setGoalId(event.target.value)}>
            <option value="">No goal</option>
            {goals.map((goal) => (
              <option key={goal.id} value={goal.id}>
                {goal.title}
              </option>
            ))}
          </Select>
        </Field>
      ) : null}

      <button className="details-toggle" type="button" aria-expanded={expanded} onClick={() => setExpanded((value) => !value)}>
        <CaretDown size={14} weight="bold" style={{ rotate: expanded ? "180deg" : undefined }} />
        Details
      </button>

      {expanded ? (
        <div className="composer-details">
          <Field label="Description">
            <TextArea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="A short note about what done looks like"
            />
          </Field>
          <div className="composer-grid">
            <Field label="Priority">
              <Select value={priority} onChange={(event) => setPriority(event.target.value as Priority)}>
                {priorities.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Reminder">
              <TextInput type="datetime-local" value={reminderAt} onChange={(event) => setReminderAt(event.target.value)} />
            </Field>
          </div>
          <Field label="Recurrence">
            <Select
              value={recurrence}
              onChange={(event) => setRecurrence(event.target.value as "daily" | "weekly" | "biweekly" | "monthly" | "custom" | "")}
            >
              <option value="">None</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="biweekly">Biweekly</option>
              <option value="monthly">Monthly</option>
            </Select>
          </Field>
          <Field label="Tags">
            <TextInput value={tags} onChange={(event) => setTags(event.target.value)} placeholder="reading, errand" />
          </Field>

          <div className="subtasks-editor">
            <span>Subtasks</span>
            <div className="subtasks-list">
              {subtasks.map((subtask, index) => (
                <div key={subtask.id} className="subtask-edit-row">
                  <input
                    type="checkbox"
                    className="checkbox"
                    checked={subtask.completed}
                    onChange={(event) => {
                      const next = [...subtasks];
                      next[index] = { ...next[index], completed: event.target.checked };
                      setSubtasks(next);
                    }}
                  />
                  <TextInput
                    value={subtask.title}
                    onChange={(event) => {
                      const next = [...subtasks];
                      next[index] = { ...next[index], title: event.target.value };
                      setSubtasks(next);
                    }}
                    placeholder="Subtask title"
                  />
                  <Button size="sm" variant="danger" aria-label="Delete subtask" onClick={() => setSubtasks(subtasks.filter((_, i) => i !== index))}>
                    <Trash size={13} weight="bold" />
                  </Button>
                </div>
              ))}
            </div>
            <div>
              <Button
                onClick={() => {
                  setSubtasks([...subtasks, { id: crypto.randomUUID(), title: "", completed: false }]);
                }}
              >
                <Plus size={14} weight="bold" /> Add step
              </Button>
            </div>
          </div>

          {showGameLayer ? (
            <>
              <div className="range-row">
                <Field label={`Energy ${energy}`}>
                  <input type="range" className="range" min="1" max="5" value={energy} onChange={(event) => setEnergy(Number(event.target.value))} />
                </Field>
                <Field label={`Difficulty ${difficulty}`}>
                  <input type="range" className="range" min="1" max="5" value={difficulty} onChange={(event) => setDifficulty(Number(event.target.value))} />
                </Field>
              </div>
              <Field label="Attribute">
                <Select value={attribute} onChange={(event) => setAttribute(event.target.value as RpgAttribute)}>
                  {rpgAttributes.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </Select>
              </Field>
            </>
          ) : null}
        </div>
      ) : null}

      <Button variant="primary" type="submit" disabled={!canSubmit}>
        <Plus size={16} weight="bold" />
        {isSubmitting ? "Adding..." : "Add task"}
      </Button>
    </form>
  );
}

function parseTags(value: string) {
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

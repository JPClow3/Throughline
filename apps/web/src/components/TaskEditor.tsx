import { Course, Goal, Priority, Task, TaskStatus, kanbanColumns, priorities, taskStatuses } from "@liquidglass-todo/domain";
import { Trash as Trash2 } from "@phosphor-icons/react";
import { FormEvent, useState } from "react";

type TaskEditorProps = {
  task: Task;
  courses: Course[];
  goals?: Goal[];
  onSave: (task: Task) => Promise<void>;
  onDelete: (taskId: string) => Promise<void>;
};

function toLocalInput(iso?: string) {
  if (!iso) {
    return "";
  }
  const date = new Date(iso);
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function TaskEditor({ task, courses, goals = [], onSave, onDelete }: TaskEditorProps) {
  const [title, setTitle] = useState(task.title);
  const [courseId, setCourseId] = useState(task.courseId ?? "");
  const [goalId, setGoalId] = useState(task.goalId ?? "");
  const [dueAt, setDueAt] = useState(toLocalInput(task.dueAt));
  const [status, setStatus] = useState<TaskStatus>(task.status);
  const [priority, setPriority] = useState<Priority>(task.priority);
  const [description, setDescription] = useState(task.description);
  const [tags, setTags] = useState(task.tags.join(", "));

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim()) {
      return;
    }

    await onSave({
      ...task,
      title: title.trim(),
      courseId: courseId || undefined,
      goalId: goalId || undefined,
      dueAt: dueAt ? new Date(dueAt).toISOString() : undefined,
      status,
      priority,
      description: description.trim(),
      tags: tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      completedAt: status === "done" ? task.completedAt ?? new Date().toISOString() : undefined
    });
  }

  return (
    <form className="composer-form" onSubmit={submit}>
      <label>
        <span>Title</span>
        <input autoFocus value={title} onChange={(event) => setTitle(event.target.value)} />
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
      <div className="composer-grid">
        <label>
          <span>Status</span>
          <select value={status} onChange={(event) => setStatus(event.target.value as TaskStatus)}>
            {taskStatuses.map((value) => (
              <option key={value} value={value}>
                {kanbanColumns[value]}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Priority</span>
          <select value={priority} onChange={(event) => setPriority(event.target.value as Priority)}>
            {priorities.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
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
      <label>
        <span>Description</span>
        <textarea value={description} onChange={(event) => setDescription(event.target.value)} />
      </label>
      <label>
        <span>Tags</span>
        <input value={tags} onChange={(event) => setTags(event.target.value)} placeholder="reading, errand" />
      </label>
      <div className="button-row editor-actions">
        <button className="primary-button" type="submit">
          Save changes
        </button>
        <button className="secondary-button danger" type="button" onClick={() => void onDelete(task.id)}>
          <Trash2 size={16} /> Delete
        </button>
      </div>
    </form>
  );
}

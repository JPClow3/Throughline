import { Course, Goal, Priority, Task, TaskStatus, kanbanColumns, priorities, taskStatuses } from "@throughline/domain";
import { Plus, Trash as Trash2, DotsSixVertical as GripVertical } from "@phosphor-icons/react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";

import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
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
  const [subtasks, setSubtasks] = useState([...task.subtasks]);
  const [recurrence, setRecurrence] = useState<"daily" | "weekly" | "biweekly" | "monthly" | "custom" | "">(task.recurrence?.pattern ?? "");
  const [attributes, setAttributes] = useState(task.attributes);

  function addSubtask() {
    setSubtasks([...subtasks, { id: crypto.randomUUID(), title: "", completed: false }]);
  }

  function updateSubtask(index: number, updates: Partial<typeof subtasks[0]>) {
    const next = [...subtasks];
    next[index] = { ...next[index], ...updates };
    setSubtasks(next);
  }

  function removeSubtask(index: number) {
    setSubtasks(subtasks.filter((_, i) => i !== index));
  }

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function handleDragEnd(event: any) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setSubtasks((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  }

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
      subtasks: subtasks.map(st => ({ ...st, title: st.title.trim() })).filter(st => st.title),
      recurrence: recurrence ? { pattern: recurrence as "daily" | "weekly" | "biweekly" | "monthly" | "custom" } : undefined,
      attributes,
      completedAt: status === "done" ? task.completedAt ?? new Date().toISOString() : undefined
    });
  }

  return (
    <form className="composer-form" onSubmit={submit}>
      <label>
        <span>Title</span>
        <input autoFocus value={title} onChange={(event) => setTitle(event.target.value)} maxLength={140} />
      </label>
      <div className="composer-grid">
        <label>
          <span>Project</span>
          <select value={courseId} onChange={(event) => {
            const nextCourseId = event.target.value;
            setCourseId(nextCourseId);
            const course = courses.find(c => c.id === nextCourseId);
            if (course?.defaultAttributes?.length) {
              setAttributes(course.defaultAttributes);
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
      <div className="subtasks-editor" style={{ marginBottom: "1rem" }}>
        <span style={{ fontSize: "var(--text-sm)", fontWeight: "var(--fw-medium)", color: "var(--ink-muted)", marginBottom: "0.4rem", display: "block" }}>Subtasks</span>
        <div className="subtasks-list" style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "0.5rem" }}>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={subtasks.map(st => st.id)} strategy={verticalListSortingStrategy}>
              {subtasks.map((st, i) => (
                <SortableSubtask
                  key={st.id}
                  st={st}
                  i={i}
                  updateSubtask={updateSubtask}
                  removeSubtask={removeSubtask}
                />
              ))}
            </SortableContext>
          </DndContext>
        </div>
        <button type="button" className="secondary-button" onClick={addSubtask}>
          <Plus size={14} /> Add step
        </button>
      </div>
      <div className="composer-grid">
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
      </div>
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

type SortableSubtaskProps = {
  st: { id: string; title: string; completed: boolean };
  i: number;
  updateSubtask: (index: number, updates: Partial<{ title: string; completed: boolean }>) => void;
  removeSubtask: (index: number) => void;
};

function SortableSubtask({ st, i, updateSubtask, removeSubtask }: SortableSubtaskProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ 
    id: st.id,
    resizeObserverConfig: {} 
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 1,
    position: isDragging ? ("relative" as const) : undefined,
    display: "flex",
    gap: "0.5rem",
    alignItems: "center"
  };

  return (
    <div ref={setNodeRef} style={style} className="subtask-edit-row">
      <button
        type="button"
        style={{ background: "transparent", border: "none", cursor: "grab", color: "var(--ink-muted)", padding: 0 }}
        {...attributes}
        {...listeners}
      >
        <GripVertical size={14} />
      </button>
      <input type="checkbox" checked={st.completed} onChange={(e) => updateSubtask(i, { completed: e.target.checked })} style={{ width: "auto" }} />
      <input value={st.title} onChange={(e) => updateSubtask(i, { title: e.target.value })} placeholder="Subtask title" style={{ flex: 1, margin: 0 }} />
      <button type="button" onClick={() => removeSubtask(i)} aria-label="Delete subtask" className="secondary-button danger" style={{ padding: "0.5rem" }}>
        <Trash2 size={14} />
      </button>
    </div>
  );
}

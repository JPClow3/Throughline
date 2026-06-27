import { Course, Task, createCourse, RpgAttribute, rpgAttributes } from "@throughline/domain";
import { Check, PencilSimple, Plus, Trash as Trash2, X } from "@phosphor-icons/react";
import { FormEvent, useState, type CSSProperties } from "react";

const PROJECT_COLORS = ["#5b73f0", "#2fa980", "#cf9326", "#df645a", "#8a73e0", "#3aa6c2"];

type ProjectsManagerProps = {
  courses: Course[];
  tasks: Task[];
  onUpsertCourse: (course: Course) => Promise<void>;
  onDeleteCourse: (courseId: string) => Promise<void>;
};

function ColorPicker({ value, onChange, label }: { value: string; onChange: (color: string) => void; label: string }) {
  return (
    <div className="project-color-picker" role="group" aria-label={label}>
      {PROJECT_COLORS.map((swatch) => (
        <button
          key={swatch}
          type="button"
          className={`color-swatch${value === swatch ? " active" : ""}`}
          style={{ background: swatch }}
          aria-label={`Colour ${swatch}`}
          aria-pressed={value === swatch}
          onClick={() => onChange(swatch)}
        />
      ))}
    </div>
  );
}

export function ProjectsManager({ courses, tasks, onUpsertCourse, onDeleteCourse }: ProjectsManagerProps) {
  const [name, setName] = useState("");
  const [color, setColor] = useState(PROJECT_COLORS[0]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState(PROJECT_COLORS[0]);
  const [attribute, setAttribute] = useState<RpgAttribute | "">("");
  const [editAttribute, setEditAttribute] = useState<RpgAttribute | "">("");

  const counts = new Map<string, number>();
  for (const task of tasks) {
    if (task.courseId) {
      counts.set(task.courseId, (counts.get(task.courseId) ?? 0) + 1);
    }
  }

  async function addProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      return;
    }
    const course = createCourse({ name: trimmed, color, icon: trimmed.slice(0, 1).toUpperCase() });
    if (attribute) {
      course.defaultAttributes = [attribute as RpgAttribute];
    }
    await onUpsertCourse(course);
    setName("");
    setAttribute("");
  }

  function startEdit(course: Course) {
    setEditingId(course.id);
    setEditName(course.name);
    setEditColor(course.color ?? PROJECT_COLORS[0]);
    setEditAttribute(course.defaultAttributes?.[0] ?? "");
  }

  async function saveEdit(course: Course) {
    const trimmed = editName.trim();
    if (!trimmed) {
      return;
    }
    await onUpsertCourse({ 
      ...course, 
      name: trimmed, 
      color: editColor,
      defaultAttributes: editAttribute ? [editAttribute as RpgAttribute] : undefined
    });
    setEditingId(null);
  }

  return (
    <div className="glass-panel settings-card">
      <div className="project-rows">
        {courses.length ? (
          courses.map((course) =>
            editingId === course.id ? (
              <form
                key={course.id}
                className="project-row-edit"
                onSubmit={(event) => {
                  event.preventDefault();
                  void saveEdit(course);
                }}
              >
                <input
                  value={editName}
                  onChange={(event) => setEditName(event.target.value)}
                  aria-label={`Rename ${course.name}`}
                  autoFocus
                />
                <select value={editAttribute} onChange={(e) => setEditAttribute(e.target.value as RpgAttribute | "")} aria-label="Default attribute" style={{ width: 'auto', padding: '4px' }}>
                  <option value="">No attribute</option>
                  {rpgAttributes.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
                <ColorPicker value={editColor} onChange={setEditColor} label="Project colour" />
                <button className="icon-toggle" type="submit" aria-label={`Save ${course.name}`}>
                  <Check size={15} />
                </button>
                <button
                  className="icon-toggle"
                  type="button"
                  aria-label="Cancel edit"
                  onClick={() => setEditingId(null)}
                >
                  <X size={15} />
                </button>
              </form>
            ) : (
              <div key={course.id} className="project-row" style={{ "--project-color": course.color } as CSSProperties}>
                <span className="project-dot" aria-hidden="true" />
                <span className="project-row-name">{course.name}</span>
                <span className="project-row-count">{counts.get(course.id) ?? 0}</span>
                <button
                  className="icon-toggle"
                  type="button"
                  aria-label={`Edit ${course.name}`}
                  onClick={() => startEdit(course)}
                >
                  <PencilSimple size={15} />
                </button>
                <button
                  className="icon-toggle"
                  type="button"
                  aria-label={`Delete ${course.name}`}
                  onClick={() => void onDeleteCourse(course.id)}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            )
          )
        ) : (
          <p>No projects yet. Add one to group related tasks and goals.</p>
        )}
      </div>
      <form className="project-add" onSubmit={addProject}>
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="New project name"
          aria-label="New project name"
        />
        <select value={attribute} onChange={(e) => setAttribute(e.target.value as RpgAttribute | "")} aria-label="Default attribute" style={{ width: 'auto' }}>
          <option value="">No attribute</option>
          {rpgAttributes.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
        <ColorPicker value={color} onChange={setColor} label="Project colour" />
        <button className="primary-button" type="submit">
          <Plus size={16} /> Add project
        </button>
      </form>
    </div>
  );
}

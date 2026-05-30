import { Goal, Note, Task } from "@liquidglass-todo/domain";
import { LinkSimple as Link2, PushPin as Pin, Trash as Trash2, X } from "@phosphor-icons/react";
import { useState } from "react";
import ReactMarkdown from "react-markdown";

type LinkKind = "task" | "goal";

type NoteEditorProps = {
  note: Note;
  tasks: Task[];
  goals: Goal[];
  onSave: (note: Note) => Promise<Note> | void;
  onDelete: (noteId: string) => void;
  onToggleLink: (noteId: string, kind: LinkKind, refId: string, linked: boolean) => void;
  onOpenTask?: (taskId: string) => void;
  onOpenGoal?: (goalId: string) => void;
};

export function NoteEditor({ note, tasks, goals, onSave, onDelete, onToggleLink, onOpenTask, onOpenGoal }: NoteEditorProps) {
  // The parent remounts this editor via a `key` on note.id, so initialising from
  // props is correct and avoids a state-sync effect.
  const [title, setTitle] = useState(note.title);
  const [body, setBody] = useState(note.body);
  const [mode, setMode] = useState<"write" | "preview">("write");

  const taskMap = new Map(tasks.map((task) => [task.id, task]));
  const goalMap = new Map(goals.map((goal) => [goal.id, goal]));
  const linkedTasks = note.taskIds.map((id) => taskMap.get(id)).filter((task): task is Task => Boolean(task));
  const linkedGoals = note.goalIds.map((id) => goalMap.get(id)).filter((goal): goal is Goal => Boolean(goal));
  const unlinkedTasks = tasks.filter((task) => !note.taskIds.includes(task.id));
  const unlinkedGoals = goals.filter((goal) => !note.goalIds.includes(goal.id));

  function commit(next: Partial<Pick<Note, "title" | "body" | "pinned">>) {
    onSave({ ...note, title, body, ...next });
  }

  function addLink(value: string) {
    if (value.startsWith("task:")) {
      onToggleLink(note.id, "task", value.slice(5), true);
    } else if (value.startsWith("goal:")) {
      onToggleLink(note.id, "goal", value.slice(5), true);
    }
  }

  return (
    <div className="note-editor glass-panel">
      <div className="note-editor-head">
        <input
          className="note-editor-title"
          value={title}
          placeholder="Title"
          aria-label="Note title"
          onChange={(event) => setTitle(event.target.value)}
          onBlur={() => commit({})}
        />
        <div className="note-editor-actions">
          <button
            className={`icon-toggle${note.pinned ? " active" : ""}`}
            type="button"
            aria-label={note.pinned ? "Unpin note" : "Pin note"}
            aria-pressed={note.pinned}
            onClick={() => commit({ pinned: !note.pinned })}
          >
            <Pin size={16} />
          </button>
          <button className="icon-toggle" type="button" aria-label="Delete note" onClick={() => onDelete(note.id)}>
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <div className="segmented note-mode" role="group" aria-label="Editor mode">
        <button
          type="button"
          className={mode === "write" ? "active" : ""}
          aria-pressed={mode === "write"}
          onClick={() => setMode("write")}
        >
          Write
        </button>
        <button
          type="button"
          className={mode === "preview" ? "active" : ""}
          aria-pressed={mode === "preview"}
          onClick={() => {
            commit({});
            setMode("preview");
          }}
        >
          Preview
        </button>
      </div>

      {mode === "write" ? (
        <textarea
          className="note-editor-body"
          value={body}
          placeholder="Start writing… markdown is welcome."
          aria-label="Note body"
          onChange={(event) => setBody(event.target.value)}
          onBlur={() => commit({})}
        />
      ) : (
        <div className="note-preview">
          {body.trim() ? (
            <ReactMarkdown>{body}</ReactMarkdown>
          ) : (
            <p className="note-preview-empty">Nothing to preview yet.</p>
          )}
        </div>
      )}

      <div className="note-links">
        <div className="note-links-head">
          <Link2 size={15} />
          <span>Linked to</span>
        </div>
        <div className="note-link-chips">
          {linkedTasks.length === 0 && linkedGoals.length === 0 ? (
            <span className="note-links-empty">Nothing linked yet.</span>
          ) : null}
          {linkedGoals.map((goal) => (
            <span key={goal.id} className="note-link-chip note-link-goal">
              {onOpenGoal ? (
                <button type="button" className="note-link-open" onClick={() => onOpenGoal(goal.id)}>
                  {goal.title}
                </button>
              ) : (
                goal.title
              )}
              <button type="button" aria-label={`Unlink ${goal.title}`} onClick={() => onToggleLink(note.id, "goal", goal.id, false)}>
                <X size={13} />
              </button>
            </span>
          ))}
          {linkedTasks.map((task) => (
            <span key={task.id} className="note-link-chip">
              {onOpenTask ? (
                <button type="button" className="note-link-open" onClick={() => onOpenTask(task.id)}>
                  {task.title}
                </button>
              ) : (
                task.title
              )}
              <button type="button" aria-label={`Unlink ${task.title}`} onClick={() => onToggleLink(note.id, "task", task.id, false)}>
                <X size={13} />
              </button>
            </span>
          ))}
        </div>
        {unlinkedTasks.length || unlinkedGoals.length ? (
          <select
            className="note-link-add"
            value=""
            aria-label="Link a task or goal"
            onChange={(event) => {
              addLink(event.target.value);
              event.target.value = "";
            }}
          >
            <option value="">Link a task or goal…</option>
            {unlinkedGoals.length ? (
              <optgroup label="Goals">
                {unlinkedGoals.map((goal) => (
                  <option key={goal.id} value={`goal:${goal.id}`}>
                    {goal.title}
                  </option>
                ))}
              </optgroup>
            ) : null}
            {unlinkedTasks.length ? (
              <optgroup label="Tasks">
                {unlinkedTasks.map((task) => (
                  <option key={task.id} value={`task:${task.id}`}>
                    {task.title}
                  </option>
                ))}
              </optgroup>
            ) : null}
          </select>
        ) : null}
      </div>
    </div>
  );
}

import { Goal, Note, Task, noteDisplayTitle, noteExcerpt, searchNotes } from "@liquidglass-todo/domain";
import { Note as FileText, PushPin as Pin, Plus, MagnifyingGlass as Search } from "@phosphor-icons/react";
import { useState } from "react";
import type { NoteInput } from "../data/repositories";
import { EmptyState } from "./EmptyState";
import { NoteEditor } from "./NoteEditor";

type NotesViewProps = {
  notes: Note[];
  tasks: Task[];
  goals: Goal[];
  onAddNote: (input?: NoteInput) => Promise<Note>;
  onUpdateNote: (note: Note) => Promise<Note>;
  onRemoveNote: (noteId: string) => void | Promise<void>;
  onToggleLink: (noteId: string, kind: "task" | "goal", refId: string, linked: boolean) => void;
  onOpenTask?: (taskId: string) => void;
  onOpenGoal?: (goalId: string) => void;
};

export function NotesView({
  notes,
  tasks,
  goals,
  onAddNote,
  onUpdateNote,
  onRemoveNote,
  onToggleLink,
  onOpenTask,
  onOpenGoal
}: NotesViewProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const sorted = [...searchNotes(query, notes)].sort(
    (a, b) => Number(b.pinned) - Number(a.pinned) || new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
  const selected = selectedId ? notes.find((note) => note.id === selectedId) ?? null : null;

  async function createNote() {
    const note = await onAddNote({});
    setSelectedId(note.id);
  }

  async function removeNote(noteId: string) {
    await onRemoveNote(noteId);
    if (selectedId === noteId) {
      setSelectedId(null);
    }
  }

  return (
    <div>
      <header className="view-head">
        <div>
          <span className="eyebrow">Notebook</span>
          <h1>Notes</h1>
        </div>
        <button className="primary-button" type="button" onClick={createNote}>
          <Plus size={17} /> New note
        </button>
      </header>
      <section className="notes-view">
        <div className="notes-list glass-panel">
          <label className="note-search">
          <Search size={15} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search notes"
            aria-label="Search notes"
          />
        </label>
        <div className="note-list-stack">
          {sorted.length ? (
            sorted.map((note) => {
              const linkCount = note.taskIds.length + note.goalIds.length;
              return (
                <button
                  key={note.id}
                  type="button"
                  className={`note-list-card${selectedId === note.id ? " active" : ""}`}
                  onClick={() => setSelectedId(note.id)}
                >
                  <div className="note-list-card-head">
                    <strong>{noteDisplayTitle(note)}</strong>
                    {note.pinned ? <Pin size={13} /> : null}
                  </div>
                  <p>{noteExcerpt(note.body, 90) || "Empty note"}</p>
                  {linkCount ? <span className="note-list-links">{linkCount} linked</span> : null}
                </button>
              );
            })
          ) : (
            <EmptyState
              icon={<FileText size={24} />}
              title={query ? "No matches" : "No notes yet"}
              body={query ? "Try a different search." : "Capture a thought and link it to a task or goal."}
            />
          )}
        </div>
      </div>
      <div className="notes-detail">
        {selected ? (
          <NoteEditor
            key={selected.id}
            note={selected}
            tasks={tasks}
            goals={goals}
            onSave={onUpdateNote}
            onDelete={removeNote}
            onToggleLink={onToggleLink}
            onOpenTask={onOpenTask}
            onOpenGoal={onOpenGoal}
          />
        ) : (
          <EmptyState
            icon={<FileText size={26} />}
            title="No note selected"
            body="Pick a note from the list, or start a new one."
            action={
              <button className="primary-button" type="button" onClick={createNote}>
                <Plus size={17} /> New note
              </button>
            }
          />
        )}
      </div>
      </section>
    </div>
  );
}

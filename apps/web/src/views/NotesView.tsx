import { Goal, Note, Task, noteDisplayTitle, noteExcerpt } from "@throughline/domain";
import { ArrowLeft, Eye, LinkSimple, MagnifyingGlass, Note as FileText, Plus, PushPin, Trash } from "@phosphor-icons/react";
import ReactMarkdown from "react-markdown";
import { useEffect, useMemo, useState } from "react";
import type { NoteInput } from "../data/repositories";
import { useNotesSearch } from "../hooks/useNotesSearch";
import { useCompactFilters } from "./FilterBar";
import { Button, Card, ConfirmDialog, EmptyState, IconButton, TextInput } from "../ui";
import { UnlinkButton } from "../ui";

type LinkKind = "task" | "goal";

function HighlightedText({ text, terms }: { text: string; terms: string[] }) {
  if (!terms.length || !text) return <>{text}</>;

  const escapedTerms = terms.map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const regex = new RegExp(`(${escapedTerms.join("|")})`, "gi");
  const parts = text.split(regex);
  // A fresh non-global regex per part: reusing the global regex with .test()
  // carries lastIndex state and silently skips alternating matches.
  const isMatch = new RegExp(`^(?:${escapedTerms.join("|")})$`, "i");

  return <>{parts.map((part, index) => (isMatch.test(part) ? <mark key={index}>{part}</mark> : part))}</>;
}

export function NotesView({
  notes,
  tasks,
  goals,
  onAddNote,
  onUpdateNote,
  onRemoveNote,
  onToggleLink,
  onOpenTask,
  onOpenGoal,
  selectedId: controlledSelectedId,
  onSelectedIdChange
}: {
  notes: Note[];
  tasks: Task[];
  goals: Goal[];
  onAddNote: (input?: NoteInput) => Promise<Note>;
  onUpdateNote: (note: Note) => Promise<Note>;
  onRemoveNote: (noteId: string) => void | Promise<void>;
  onToggleLink: (noteId: string, kind: LinkKind, refId: string, linked: boolean) => void;
  onOpenTask?: (taskId: string) => void;
  onOpenGoal?: (goalId: string) => void;
  selectedId?: string | null;
  onSelectedIdChange?: (noteId: string | null) => void;
}) {
  const [localSelectedId, setLocalSelectedId] = useState<string | null>(null);
  const selectedId = controlledSelectedId ?? localSelectedId;
  const setSelectedId = onSelectedIdChange ?? setLocalSelectedId;
  const [query, setQuery] = useState("");
  const isMobileNotes = useCompactFilters();

  const { filteredNotes, searchResults } = useNotesSearch(notes, query);

  const sorted = useMemo(() => {
    if (query.trim()) {
      return filteredNotes;
    }
    return [...filteredNotes].sort(
      (a, b) =>
        Number(b.pinned) - Number(a.pinned) || new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }, [filteredNotes, query]);

  const selected = selectedId ? notes.find((note) => note.id === selectedId) ?? null : null;

  useEffect(() => {
    const visibleSelected = selectedId ? sorted.some((note) => note.id === selectedId) : false;

    if (isMobileNotes) {
      if (selectedId && !notes.some((note) => note.id === selectedId)) {
        setSelectedId(null);
      }
      return;
    }

    if (!sorted.length) {
      if (selectedId) {
        setSelectedId(null);
      }
      return;
    }

    if (!selectedId || !visibleSelected) {
      setSelectedId(sorted[0].id);
    }
  }, [isMobileNotes, notes, selectedId, setSelectedId, sorted]);

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

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
    <div className="view-layout">
      <header className="view-head">
        <div>
          <span className="eyebrow">Notebook</span>
          <h1 className="view-title">Notes</h1>
        </div>
        <Button variant="accent" className="notes-page-action" onClick={() => void createNote()}>
          <Plus size={16} weight="bold" /> New note
        </Button>
      </header>

      <section className={`notes-view${isMobileNotes && selected ? " notes-view-detailing" : ""}`}>
        {!isMobileNotes || !selected ? (
          <Card className="notes-list">
            <label className="note-search">
              <MagnifyingGlass size={14} weight="bold" />
              <TextInput
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
                  const result = searchResults?.find((item) => item.id === note.id);
                  const matchedTerms = result ? Object.keys(result.match) : [];

                  return (
                    <button
                      key={note.id}
                      type="button"
                      className={`note-list-card${selectedId === note.id ? " active" : ""}`}
                      onClick={() => setSelectedId(note.id)}
                    >
                      <div className="note-list-card-head">
                        <strong>
                          <HighlightedText text={noteDisplayTitle(note)} terms={matchedTerms} />
                        </strong>
                        {note.pinned ? <PushPin size={12} weight="fill" style={{ color: "var(--ink-soft)" }} /> : null}
                      </div>
                      <p>
                        <HighlightedText text={noteExcerpt(note.body, 90) || "Empty note"} terms={matchedTerms} />
                      </p>
                      {linkCount ? <span className="note-list-links">{linkCount} linked</span> : null}
                    </button>
                  );
                })
              ) : (
                <EmptyState
                  icon={<FileText size={22} weight="bold" />}
                  title={query ? "No matches" : "No notes yet"}
                  body={query ? "Try a different search." : "Capture a thought and link it to a task or goal."}
                />
              )}
            </div>
          </Card>
        ) : null}

        {(!isMobileNotes || selected) ? (
          <div className="notes-detail">
            {selected ? (
              <>
                {isMobileNotes ? (
                  <Button className="notes-back-button" onClick={() => setSelectedId(null)}>
                    <ArrowLeft size={15} weight="bold" /> Notes
                  </Button>
                ) : null}
                <NoteEditor
                  key={selected.id}
                  note={selected}
                  tasks={tasks}
                  goals={goals}
                  onSave={onUpdateNote}
                  onDelete={(noteId) => setConfirmDeleteId(noteId)}
                  onToggleLink={onToggleLink}
                  onOpenTask={onOpenTask}
                  onOpenGoal={onOpenGoal}
                />
              </>
            ) : (
              <EmptyState
                icon={<FileText size={24} weight="bold" />}
                title="No note selected"
                body="Pick a note from the list, or start a new one."
                action={
                  <Button variant="primary" onClick={() => void createNote()}>
                    <Plus size={15} weight="bold" /> New note
                  </Button>
                }
              />
            )}
          </div>
        ) : null}
      </section>

      <ConfirmDialog
        open={confirmDeleteId !== null}
        title="Delete this note?"
        message="The note and its links will be removed. This can't be undone."
        confirmLabel="Delete note"
        onConfirm={() => {
          if (confirmDeleteId) {
            void removeNote(confirmDeleteId);
          }
          setConfirmDeleteId(null);
        }}
        onCancel={() => setConfirmDeleteId(null)}
      />
    </div>
  );
}

export function NoteEditor({
  note,
  tasks,
  goals,
  onSave,
  onDelete,
  onToggleLink,
  onOpenTask,
  onOpenGoal
}: {
  note: Note;
  tasks: Task[];
  goals: Goal[];
  onSave: (note: Note) => Promise<Note> | void;
  onDelete: (noteId: string) => void;
  onToggleLink: (noteId: string, kind: LinkKind, refId: string, linked: boolean) => void;
  onOpenTask?: (taskId: string) => void;
  onOpenGoal?: (goalId: string) => void;
}) {
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
    <Card className="note-editor">
      <div className="note-editor-head">
        <input
          className="input note-editor-title"
          value={title}
          placeholder="Title"
          aria-label="Note title"
          onChange={(event) => setTitle(event.target.value)}
          onBlur={() => commit({})}
        />
        <IconButton
          label={note.pinned ? "Unpin note" : "Pin note"}
          aria-pressed={note.pinned}
          className={note.pinned ? "active" : ""}
          onClick={() => commit({ pinned: !note.pinned })}
        >
          <PushPin size={15} weight={note.pinned ? "fill" : "regular"} />
        </IconButton>
        <IconButton label="Delete note" onClick={() => onDelete(note.id)}>
          <Trash size={15} weight="bold" />
        </IconButton>
      </div>

      <div className="segmented self-start" role="group" aria-label="Editor mode">
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
          className="input note-editor-body"
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
            <EmptyState variant="inline" icon={<Eye size={22} weight="bold" />} title="Nothing to preview yet" />
          )}
        </div>
      )}

      <div className="note-links">
        <div className="note-links-head">
          <LinkSimple size={14} weight="bold" />
          <span>Linked to</span>
        </div>
        <div className="note-link-chips">
          {linkedTasks.length === 0 && linkedGoals.length === 0 ? (
            <EmptyState variant="inline" icon={<LinkSimple size={20} weight="bold" />} title="Nothing linked yet" />
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
              <UnlinkButton label={`Unlink ${goal.title}`} onClick={() => onToggleLink(note.id, "goal", goal.id, false)} />
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
              <UnlinkButton label={`Unlink ${task.title}`} onClick={() => onToggleLink(note.id, "task", task.id, false)} />
            </span>
          ))}
        </div>
        {unlinkedTasks.length || unlinkedGoals.length ? (
          <select
            className="input note-link-add"
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
    </Card>
  );
}

import { Goal, Note, Task, noteDisplayTitle, noteExcerpt } from "@throughline/domain";
import { ArrowLeft, Note as FileText, PushPin as Pin, Plus, MagnifyingGlass as Search } from "@phosphor-icons/react";
import { useEffect, useMemo, useState } from "react";
import type { NoteInput } from "../data/repositories";
import { EmptyState } from "./EmptyState";
import { NoteEditor } from "./NoteEditor";
import { useNotesSearch } from "../hooks/useNotesSearch";

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
  selectedId?: string | null;
  onSelectedIdChange?: (noteId: string | null) => void;
};

function HighlightedText({ text, terms }: { text: string; terms: string[] }) {
  if (!terms.length || !text) return <>{text}</>;
  
  // Escape terms for regex and join with OR
  const escapedTerms = terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const regex = new RegExp(`(${escapedTerms.join('|')})`, 'gi');
  const parts = text.split(regex);
  
  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? <mark key={i}>{part}</mark> : part
      )}
    </>
  );
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
}: NotesViewProps) {
  const [localSelectedId, setLocalSelectedId] = useState<string | null>(null);
  const selectedId = controlledSelectedId ?? localSelectedId;
  const setSelectedId = onSelectedIdChange ?? setLocalSelectedId;
  const [query, setQuery] = useState("");
  const isMobileNotes = useCompactNotes();

  const { filteredNotes, searchResults } = useNotesSearch(notes, query);

  const sorted = useMemo(() => {
    // If there is a query, we keep the order of `filteredNotes` because MiniSearch sorts by relevance.
    // If no query, we sort by pinned then updated date.
    if (query.trim()) {
      return filteredNotes;
    }
    return [...filteredNotes].sort(
      (a, b) => Number(b.pinned) - Number(a.pinned) || new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
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
        <button className="primary-button notes-page-action" type="button" onClick={createNote}>
          <Plus size={17} /> New note
        </button>
      </header>
      <section className={`notes-view${isMobileNotes && selected ? " notes-view-detailing" : ""}`}>
        {(!isMobileNotes || !selected) ? (
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
              const result = searchResults?.find(r => r.id === note.id);
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
                    {note.pinned ? <Pin size={13} /> : null}
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
              icon={<FileText size={24} />}
              title={query ? "No matches" : "No notes yet"}
              body={query ? "Try a different search." : "Capture a thought and link it to a task or goal."}
            />
          )}
        </div>
      </div>
        ) : null}
      {(!isMobileNotes || selected) ? (
      <div className="notes-detail">
        {selected ? (
          <>
            {isMobileNotes ? (
              <button type="button" className="secondary-button notes-back-button" onClick={() => setSelectedId(null)}>
                <ArrowLeft size={17} /> Notes
              </button>
            ) : null}
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
          </>
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
      ) : null}
      </section>
    </div>
  );
}

function useCompactNotes() {
  const query = "(max-width: 720px)";
  const [matches, setMatches] = useState(() => {
    if (typeof window === "undefined" || !window.matchMedia) return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const media = window.matchMedia(query);
    const update = () => setMatches(media.matches);
    update();
    media.addEventListener?.("change", update);
    return () => media.removeEventListener?.("change", update);
  }, []);

  return matches;
}

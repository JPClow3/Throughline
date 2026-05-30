import { Note } from "@liquidglass-todo/domain";
import { useLiveQuery } from "dexie-react-hooks";
import { useCallback } from "react";
import {
  NoteInput,
  addNote as addNoteRecord,
  deleteNote as deleteNoteRecord,
  listNotes,
  toggleNoteLink as toggleNoteLinkRecord,
  updateNote as updateNoteRecord
} from "../data/repositories";

export function useNotes() {
  const notes = useLiveQuery(() => listNotes(), [], []);

  const addNote = useCallback((input?: NoteInput) => addNoteRecord(input), []);
  const updateNote = useCallback((note: Note) => updateNoteRecord(note), []);
  const removeNote = useCallback((noteId: string) => deleteNoteRecord(noteId), []);
  const toggleNoteLink = useCallback(
    (noteId: string, kind: "task" | "goal", refId: string, linked: boolean) =>
      toggleNoteLinkRecord(noteId, kind, refId, linked),
    []
  );

  return {
    notes: notes ?? [],
    addNote,
    updateNote,
    removeNote,
    toggleNoteLink
  };
}

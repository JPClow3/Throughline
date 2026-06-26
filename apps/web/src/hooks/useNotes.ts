import { Note } from "@throughline/domain";
import { useLiveQuery } from "dexie-react-hooks";
import { useCallback, useOptimistic, startTransition } from "react";
import {
  NoteInput,
  addNote as addNoteRecord,
  deleteNote as deleteNoteRecord,
  listNotes,
  toggleNoteLink as toggleNoteLinkRecord,
  updateNote as updateNoteRecord
} from "../data/repositories";

type NoteOptimisticAction =
  | { type: 'update'; payload: Partial<Note> & { id: string } }
  | { type: 'delete'; payload: string }
  | { type: 'toggleLink'; payload: { id: string; kind: "task" | "goal"; refId: string; linked: boolean } };

export function useNotes() {
  const baseNotes = useLiveQuery(() => listNotes(), [], []);

  const [optimisticNotes, dispatchOptimisticNote] = useOptimistic(
    baseNotes ?? [],
    (state, action: NoteOptimisticAction) => {
      switch (action.type) {
        case 'update':
          return state.map((n) => (n.id === action.payload.id ? { ...n, ...action.payload } : n));
        case 'delete':
          return state.filter((n) => n.id !== action.payload);
        case 'toggleLink':
          return state.map((n) => {
            if (n.id !== action.payload.id) return n;
            const current = new Set(action.payload.kind === "task" ? n.taskIds : n.goalIds);
            if (action.payload.linked) {
              current.add(action.payload.refId);
            } else {
              current.delete(action.payload.refId);
            }
            return action.payload.kind === "task"
              ? { ...n, taskIds: [...current] }
              : { ...n, goalIds: [...current] };
          });
        default:
          return state;
      }
    }
  );

  const addNote = useCallback(async (input?: NoteInput) => {
    const note = await addNoteRecord(input);
    return note;
  }, []);

  const updateNote = useCallback(async (note: Note) => {
    startTransition(async () => {
      dispatchOptimisticNote({ type: 'update', payload: note });
      await updateNoteRecord(note);
    });
    return note;
  }, [dispatchOptimisticNote]);

  const removeNote = useCallback(async (noteId: string) => {
    startTransition(async () => {
      dispatchOptimisticNote({ type: 'delete', payload: noteId });
      await deleteNoteRecord(noteId);
    });
  }, [dispatchOptimisticNote]);

  const toggleNoteLink = useCallback(
    async (noteId: string, kind: "task" | "goal", refId: string, linked: boolean) => {
      startTransition(async () => {
        dispatchOptimisticNote({ type: 'toggleLink', payload: { id: noteId, kind, refId, linked } });
        await toggleNoteLinkRecord(noteId, kind, refId, linked);
      });
    },
    [dispatchOptimisticNote]
  );

  return {
    notes: optimisticNotes,
    addNote,
    updateNote,
    removeNote,
    toggleNoteLink
  };
}

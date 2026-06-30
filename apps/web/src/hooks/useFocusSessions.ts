import { FocusSession } from "@throughline/domain";
import { useLiveQuery } from "dexie-react-hooks";
import { useCallback, useOptimistic, startTransition } from "react";
import { registerBackgroundSync } from "../lib/syncRegistration";
import {
  FocusSessionInput,
  deleteFocusSession as deleteFocusSessionRecord,
  listFocusSessions,
  recordFocusSession as recordFocusSessionRecord,
  updateFocusSession as updateFocusSessionRecord
} from "../data/repositories";

type FocusSessionOptimisticAction =
  | { type: "add"; payload: FocusSession }
  | { type: "update"; payload: FocusSession }
  | { type: "delete"; payload: string };

export function useFocusSessions() {
  const baseFocusSessions = useLiveQuery(() => listFocusSessions(), [], []);
  const [focusSessions, dispatchOptimistic] = useOptimistic(
    baseFocusSessions ?? [],
    (state, action: FocusSessionOptimisticAction) => {
      switch (action.type) {
        case "add":
          return [action.payload, ...state];
        case "update":
          return state.map((session) => (session.id === action.payload.id ? action.payload : session));
        case "delete":
          return state.filter((session) => session.id !== action.payload);
        default:
          return state;
      }
    }
  );

  const recordFocusSession = useCallback(
    async (input: FocusSessionInput = 25) => {
      const session = await recordFocusSessionRecord(input);
      startTransition(() => dispatchOptimistic({ type: "add", payload: session }));
      void registerBackgroundSync("sync-tasks");
      return session;
    },
    [dispatchOptimistic]
  );

  const updateFocusSession = useCallback(
    async (session: FocusSession) => {
      const updated = await updateFocusSessionRecord(session);
      startTransition(() => dispatchOptimistic({ type: "update", payload: updated }));
      void registerBackgroundSync("sync-tasks");
      return updated;
    },
    [dispatchOptimistic]
  );

  const deleteFocusSession = useCallback(
    async (sessionId: string) => {
      await deleteFocusSessionRecord(sessionId);
      startTransition(() => dispatchOptimistic({ type: "delete", payload: sessionId }));
      void registerBackgroundSync("sync-tasks");
    },
    [dispatchOptimistic]
  );

  return {
    focusSessions,
    loading: !baseFocusSessions,
    recordFocusSession,
    updateFocusSession,
    deleteFocusSession
  };
}

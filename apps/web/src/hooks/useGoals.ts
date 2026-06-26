import { Goal, GoalStatus } from "@throughline/domain";
import { useLiveQuery } from "dexie-react-hooks";
import { useCallback, useOptimistic, startTransition } from "react";
import {
  GoalInput,
  addGoal as addGoalRecord,
  deleteGoal as deleteGoalRecord,
  listGoals,
  setGoalStatus as setGoalStatusRecord,
  updateGoal as updateGoalRecord
} from "../data/repositories";

type GoalOptimisticAction =
  | { type: 'update'; payload: Partial<Goal> & { id: string } }
  | { type: 'delete'; payload: string };

export function useGoals() {
  const baseGoals = useLiveQuery(() => listGoals(), [], []);

  const [optimisticGoals, dispatchOptimisticGoal] = useOptimistic(
    baseGoals ?? [],
    (state, action: GoalOptimisticAction) => {
      switch (action.type) {
        case 'update':
          return state.map((g) => (g.id === action.payload.id ? { ...g, ...action.payload } : g));
        case 'delete':
          return state.filter((g) => g.id !== action.payload);
        default:
          return state;
      }
    }
  );

  const addGoal = useCallback(async (input: GoalInput) => {
    await addGoalRecord(input);
  }, []);

  const updateGoal = useCallback(async (goal: Goal) => {
    startTransition(async () => {
      dispatchOptimisticGoal({ type: 'update', payload: goal });
      await updateGoalRecord(goal);
    });
  }, [dispatchOptimisticGoal]);

  const setGoalStatus = useCallback(async (goalId: string, status: GoalStatus) => {
    startTransition(async () => {
      dispatchOptimisticGoal({ type: 'update', payload: { id: goalId, status } });
      await setGoalStatusRecord(goalId, status);
    });
  }, [dispatchOptimisticGoal]);

  const removeGoal = useCallback(async (goalId: string) => {
    startTransition(async () => {
      dispatchOptimisticGoal({ type: 'delete', payload: goalId });
      await deleteGoalRecord(goalId);
    });
  }, [dispatchOptimisticGoal]);

  return {
    goals: optimisticGoals,
    addGoal,
    updateGoal,
    setGoalStatus,
    removeGoal
  };
}

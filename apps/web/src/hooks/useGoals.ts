import { Goal, GoalStatus } from "@liquidglass-todo/domain";
import { useLiveQuery } from "dexie-react-hooks";
import { useCallback } from "react";
import {
  GoalInput,
  addGoal as addGoalRecord,
  deleteGoal as deleteGoalRecord,
  listGoals,
  setGoalStatus as setGoalStatusRecord,
  updateGoal as updateGoalRecord
} from "../data/repositories";

export function useGoals() {
  const goals = useLiveQuery(() => listGoals(), [], []);

  const addGoal = useCallback((input: GoalInput) => addGoalRecord(input), []);
  const updateGoal = useCallback((goal: Goal) => updateGoalRecord(goal), []);
  const setGoalStatus = useCallback((goalId: string, status: GoalStatus) => setGoalStatusRecord(goalId, status), []);
  const removeGoal = useCallback((goalId: string) => deleteGoalRecord(goalId), []);

  return {
    goals: goals ?? [],
    addGoal,
    updateGoal,
    setGoalStatus,
    removeGoal
  };
}

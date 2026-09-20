import { useLiveQuery } from "dexie-react-hooks";
import { useCallback, useMemo, useOptimistic, startTransition } from "react";
import { Task, TaskStatus } from "@throughline/domain";
import { syncRedactedRemindersFromLocalState } from "../data/reminderSync";
import { registerBackgroundSync } from "../lib/syncRegistration";
import { fireAndForget, reportError } from "../sentry";
import {
  TaskInput,
  addTask as addTaskRecord,
  deleteCourse as deleteCourseRecord,
  deleteTask as deleteTaskRecord,
  getProgress,
  listCourses,
  listTasks,
  updateTask as updateTaskRecord,
  updateTaskStatus as updateTaskStatusRecord,
  upsertCourse as upsertCourseRecord,
  recordFocusSession as recordFocusSessionRecord
} from "../data/repositories";

type TaskOptimisticAction = 
  | { type: 'update'; payload: Partial<Task> & { id: string } }
  | { type: 'delete'; payload: string };

export function useTasks() {
  // No `[]` defaults here: `undefined` is the honest first paint, so the shell
  // can show a skeleton instead of flashing an empty state before Dexie resolves.
  const baseTasks = useLiveQuery(() => listTasks(), []);
  const courseRecords = useLiveQuery(() => listCourses(), []);
  const progress = useLiveQuery(() => getProgress(), []);
  const courses = useMemo(() => courseRecords ?? [], [courseRecords]);
  const loading = baseTasks === undefined || courseRecords === undefined;

  const [optimisticTasks, dispatchOptimisticTask] = useOptimistic(
    baseTasks ?? [],
    (state, action: TaskOptimisticAction) => {
      switch (action.type) {
        case 'update':
          return state.map((t) => (t.id === action.payload.id ? { ...t, ...action.payload } : t));
        case 'delete':
          return state.filter((t) => t.id !== action.payload);
        default:
          return state;
      }
    }
  );

  const queueReminderSync = useCallback(() => {
    fireAndForget(syncRedactedRemindersFromLocalState(), { source: "reminder-sync" });
    fireAndForget(registerBackgroundSync("sync-tasks"), { source: "background-sync" });
  }, []);

  const addTask = useCallback(async (input: TaskInput) => {
    await addTaskRecord(input);
    queueReminderSync();
  }, [queueReminderSync]);

  const updateTaskStatus = useCallback(async (taskId: string, status: TaskStatus) => {
    startTransition(async () => {
      dispatchOptimisticTask({ type: 'update', payload: { id: taskId, status } });
      try {
        await updateTaskStatusRecord(taskId, status);
      } catch (error) {
        reportError(error, { source: "task-update" });
        return;
      }
      queueReminderSync();
    });
  }, [dispatchOptimisticTask, queueReminderSync]);

  const completeTask = useCallback(
    async (task: Task) => {
      updateTaskStatus(task.id, "done");
    },
    [updateTaskStatus]
  );

  const updateTask = useCallback(async (task: Task) => {
    startTransition(async () => {
      dispatchOptimisticTask({ type: 'update', payload: task });
      try {
        await updateTaskRecord(task);
      } catch (error) {
        reportError(error, { source: "task-update" });
        return;
      }
      queueReminderSync();
    });
  }, [dispatchOptimisticTask, queueReminderSync]);

  const deleteTask = useCallback(async (taskId: string) => {
    startTransition(async () => {
      dispatchOptimisticTask({ type: 'delete', payload: taskId });
      try {
        await deleteTaskRecord(taskId);
      } catch (error) {
        reportError(error, { source: "task-delete" });
        return;
      }
      queueReminderSync();
    });
  }, [dispatchOptimisticTask, queueReminderSync]);

  const upsertCourse = useCallback(async (course: Parameters<typeof upsertCourseRecord>[0]) => {
    await upsertCourseRecord(course);
  }, []);

  const deleteCourse = useCallback(async (courseId: string) => {
    await deleteCourseRecord(courseId);
  }, []);

  const recordFocusSession = useCallback(async (durationMinutes: number = 25) => {
    return await recordFocusSessionRecord(durationMinutes);
  }, []);

  return {
    tasks: optimisticTasks,
    courses,
    progress,
    loading,
    addTask,
    updateTask,
    deleteTask,
    updateTaskStatus,
    completeTask,
    upsertCourse,
    deleteCourse,
    recordFocusSession
  };
}

import { useLiveQuery } from "dexie-react-hooks";
import { useCallback, useEffect, useOptimistic, startTransition } from "react";
import { Task, TaskStatus } from "@throughline/domain";
import { seedIfEmpty } from "../data/db";
import { syncRedactedRemindersFromLocalState } from "../data/reminderSync";
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
  upsertCourse as upsertCourseRecord
} from "../data/repositories";

type TaskOptimisticAction = 
  | { type: 'update'; payload: Partial<Task> & { id: string } }
  | { type: 'delete'; payload: string };

export function useTasks() {
  useEffect(() => {
    void seedIfEmpty();
  }, []);

  const baseTasks = useLiveQuery(() => listTasks(), [], []);
  const courses = useLiveQuery(() => listCourses(), [], []);
  const progress = useLiveQuery(() => getProgress(), []);

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

  const addTask = useCallback(async (input: TaskInput) => {
    await addTaskRecord(input);
    void syncRedactedRemindersFromLocalState();
  }, []);

  const updateTaskStatus = useCallback(async (taskId: string, status: TaskStatus) => {
    startTransition(async () => {
      dispatchOptimisticTask({ type: 'update', payload: { id: taskId, status } });
      await updateTaskStatusRecord(taskId, status);
      void syncRedactedRemindersFromLocalState();
    });
  }, [dispatchOptimisticTask]);

  const completeTask = useCallback(
    async (task: Task) => {
      updateTaskStatus(task.id, "done");
    },
    [updateTaskStatus]
  );

  const updateTask = useCallback(async (task: Task) => {
    startTransition(async () => {
      dispatchOptimisticTask({ type: 'update', payload: task });
      await updateTaskRecord(task);
      void syncRedactedRemindersFromLocalState();
    });
  }, [dispatchOptimisticTask]);

  const deleteTask = useCallback(async (taskId: string) => {
    startTransition(async () => {
      dispatchOptimisticTask({ type: 'delete', payload: taskId });
      await deleteTaskRecord(taskId);
      void syncRedactedRemindersFromLocalState();
    });
  }, [dispatchOptimisticTask]);

  const upsertCourse = useCallback(async (course: Parameters<typeof upsertCourseRecord>[0]) => {
    await upsertCourseRecord(course);
  }, []);

  const deleteCourse = useCallback(async (courseId: string) => {
    await deleteCourseRecord(courseId);
  }, []);

  return {
    tasks: optimisticTasks,
    courses,
    progress,
    loading: !baseTasks || !courses,
    addTask,
    updateTask,
    deleteTask,
    updateTaskStatus,
    completeTask,
    upsertCourse,
    deleteCourse
  };
}

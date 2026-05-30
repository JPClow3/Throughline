import { useLiveQuery } from "dexie-react-hooks";
import { useCallback, useEffect } from "react";
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

export function useTasks() {
  useEffect(() => {
    void seedIfEmpty();
  }, []);

  const tasks = useLiveQuery(() => listTasks(), [], []);
  const courses = useLiveQuery(() => listCourses(), [], []);
  const progress = useLiveQuery(() => getProgress(), []);

  const addTask = useCallback(async (input: TaskInput) => {
    await addTaskRecord(input);
    void syncRedactedRemindersFromLocalState();
  }, []);

  const updateTaskStatus = useCallback(async (taskId: string, status: TaskStatus) => {
    await updateTaskStatusRecord(taskId, status);
    void syncRedactedRemindersFromLocalState();
  }, []);

  const completeTask = useCallback(
    async (task: Task) => {
      await updateTaskStatus(task.id, "done");
    },
    [updateTaskStatus]
  );

  const updateTask = useCallback(async (task: Task) => {
    await updateTaskRecord(task);
    void syncRedactedRemindersFromLocalState();
  }, []);

  const deleteTask = useCallback(async (taskId: string) => {
    await deleteTaskRecord(taskId);
    void syncRedactedRemindersFromLocalState();
  }, []);

  const upsertCourse = useCallback(async (course: Parameters<typeof upsertCourseRecord>[0]) => {
    await upsertCourseRecord(course);
  }, []);

  const deleteCourse = useCallback(async (courseId: string) => {
    await deleteCourseRecord(courseId);
  }, []);

  return {
    tasks,
    courses,
    progress,
    loading: !tasks || !courses,
    addTask,
    updateTask,
    deleteTask,
    updateTaskStatus,
    completeTask,
    upsertCourse,
    deleteCourse
  };
}

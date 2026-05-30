import { z } from "zod";

export const taskStatuses = ["backlog", "ready", "doing", "blocked", "done"] as const;
export const priorities = ["low", "medium", "high", "critical"] as const;
export const rpgAttributes = ["focus", "memory", "discipline", "creativity", "wellness"] as const;
export const goalStatuses = ["active", "paused", "done"] as const;

export type TaskStatus = (typeof taskStatuses)[number];
export type Priority = (typeof priorities)[number];
export type RpgAttribute = (typeof rpgAttributes)[number];
export type GoalStatus = (typeof goalStatuses)[number];

export const kanbanColumns: Record<TaskStatus, string> = {
  backlog: "Backlog",
  ready: "Ready",
  doing: "Doing",
  blocked: "Blocked",
  done: "Done"
};

export const SubtaskSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1).max(140),
  completed: z.boolean().default(false)
});

export const CourseSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(80),
  code: z.string().max(24).optional(),
  color: z.string().min(3).max(32),
  icon: z.string().min(1).max(8),
  professor: z.string().max(80).optional(),
  semester: z.string().max(40).optional()
});

export const TaskSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1).max(140),
  description: z.string().max(1500).default(""),
  status: z.enum(taskStatuses).default("backlog"),
  courseId: z.string().min(1).optional(),
  goalId: z.string().min(1).optional(),
  order: z.number().int().min(0).default(0),
  dueAt: z.string().datetime().optional(),
  reminderAt: z.string().datetime().optional(),
  priority: z.enum(priorities).default("medium"),
  energy: z.number().int().min(1).max(5).default(2),
  difficulty: z.number().int().min(1).max(5).default(2),
  estimatedMinutes: z.number().int().min(5).max(720).default(45),
  xp: z.number().int().min(0).default(0),
  attributes: z.array(z.enum(rpgAttributes)).min(1).default(["focus"]),
  tags: z.array(z.string().min(1).max(32)).default([]),
  subtasks: z.array(SubtaskSchema).default([]),
  visualSeed: z.number().int().min(0).max(9999).default(0),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  completedAt: z.string().datetime().optional()
});

export const GoalSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1).max(140),
  summary: z.string().max(500).default(""),
  status: z.enum(goalStatuses).default("active"),
  targetDate: z.string().datetime().optional(),
  projectId: z.string().min(1).optional(),
  color: z.string().min(3).max(32).optional(),
  icon: z.string().min(1).max(8).optional(),
  priority: z.enum(priorities).default("medium"),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  completedAt: z.string().datetime().optional()
});

export const NoteSchema = z.object({
  id: z.string().min(1),
  title: z.string().max(140).default(""),
  body: z.string().max(20000).default(""),
  taskIds: z.array(z.string().min(1)).default([]),
  goalIds: z.array(z.string().min(1)).default([]),
  projectId: z.string().min(1).optional(),
  pinned: z.boolean().default(false),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});

export const UserProgressSchema = z.object({
  id: z.literal("local-player"),
  level: z.number().int().min(1),
  xp: z.number().int().min(0),
  streakDays: z.number().int().min(0),
  attributes: z.record(z.enum(rpgAttributes), z.number().int().min(0)),
  badges: z.array(z.string())
});

export const RedactedReminderSchema = z.object({
  reminderId: z.string().min(1),
  taskId: z.string().min(1),
  dueAt: z.string().datetime().optional(),
  notifyAt: z.string().datetime(),
  urgency: z.enum(["normal", "high", "critical"]),
  title: z.literal("Quest reminder"),
  body: z.literal("A study quest needs your attention."),
  createdAt: z.string().datetime()
});

export type Subtask = z.infer<typeof SubtaskSchema>;
export type Course = z.infer<typeof CourseSchema>;
export type Task = z.infer<typeof TaskSchema>;
export type Goal = z.infer<typeof GoalSchema>;
export type Note = z.infer<typeof NoteSchema>;
export type UserProgress = z.infer<typeof UserProgressSchema>;
export type RedactedReminder = z.infer<typeof RedactedReminderSchema>;

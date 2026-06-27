import { createCourse, createGoal, createNote, createTask } from "./factories";

const now = new Date();
const addDays = (days: number, hour = 18) => {
  const date = new Date(now);
  date.setDate(date.getDate() + days);
  date.setHours(hour, 0, 0, 0);
  return date.toISOString();
};

export const sampleCourses = [
  createCourse({
    id: "course_side_project",
    name: "Side project",
    color: "#6be4ff",
    icon: "S"
  }),
  createCourse({
    id: "course_home",
    name: "Home",
    color: "#ff9e7a",
    icon: "H"
  }),
  createCourse({
    id: "course_wellbeing",
    name: "Wellbeing",
    color: "#b59cff",
    icon: "W"
  })
];

export const sampleTasks = [
  createTask({
    id: "task_landing_page",
    title: "Wire up the landing page",
    description: "Hero, three key features, and one clear call to action.",
    status: "doing",
    courseId: "course_side_project",
    dueAt: addDays(1, 20),
    reminderAt: addDays(1, 18),
    priority: "high",
    energy: 4,
    difficulty: 4,
    estimatedMinutes: 95,
    attributes: ["focus", "discipline"],
    tags: ["focus"]
  }),
  createTask({
    id: "task_meal_plan",
    title: "Plan the week's meals",
    description: "Pick five dinners and build the shopping list.",
    status: "ready",
    courseId: "course_home",
    dueAt: addDays(3, 16),
    priority: "medium",
    energy: 2,
    difficulty: 2,
    estimatedMinutes: 30,
    attributes: ["discipline"],
    tags: ["errand"]
  }),
  createTask({
    id: "task_easy_runs",
    title: "Three easy runs this week",
    description: "Keep the pace gentle and protect the rest days.",
    status: "backlog",
    courseId: "course_wellbeing",
    dueAt: addDays(2, 12),
    priority: "medium",
    energy: 2,
    difficulty: 2,
    estimatedMinutes: 40,
    attributes: ["discipline", "focus"],
    tags: ["health"]
  }),
  createTask({
    id: "task_renew_passport",
    title: "Renew passport",
    description: "Fill the form and book a photo slot.",
    status: "done",
    courseId: "course_home",
    dueAt: addDays(-1, 22),
    priority: "low",
    energy: 1,
    difficulty: 1,
    estimatedMinutes: 25,
    attributes: ["discipline"],
    tags: ["done"]
  }),
  createTask({
    id: "task_goal_pitch",
    title: "Finalise the pitch",
    status: "done",
    courseId: "course_side_project",
    goalId: "goal_launch_side_project",
    order: 0,
    priority: "medium",
    energy: 2,
    difficulty: 2,
    attributes: ["creativity"]
  }),
  createTask({
    id: "task_goal_mvp",
    title: "Build the first working version",
    status: "doing",
    courseId: "course_side_project",
    goalId: "goal_launch_side_project",
    order: 1,
    dueAt: addDays(4, 19),
    priority: "high",
    energy: 4,
    difficulty: 4,
    attributes: ["focus", "discipline"]
  }),
  createTask({
    id: "task_goal_analytics",
    title: "Set up basic analytics",
    status: "ready",
    courseId: "course_side_project",
    goalId: "goal_launch_side_project",
    order: 2,
    dueAt: addDays(9, 16),
    priority: "medium",
    energy: 3,
    difficulty: 3,
    attributes: ["focus"]
  }),
  createTask({
    id: "task_goal_launch_note",
    title: "Write the launch note",
    status: "backlog",
    courseId: "course_side_project",
    goalId: "goal_launch_side_project",
    order: 3,
    priority: "medium",
    energy: 2,
    difficulty: 2,
    attributes: ["creativity", "discipline"]
  }),
  createTask({
    id: "task_daily_plan",
    title: "Plan tomorrow's schedule",
    description: "Review your notes and prepare tasks for the next day.",
    status: "backlog",
    courseId: "course_wellbeing",
    dueAt: addDays(0, 21),
    priority: "low",
    energy: 1,
    difficulty: 1,
    estimatedMinutes: 10,
    attributes: ["discipline"],
    tags: ["habit"],
    recurrence: { pattern: "daily" }
  }),
  createTask({
    id: "task_daily_review",
    title: "Review notes for 15 mins",
    description: "Read through recent notes to reinforce memory.",
    status: "backlog",
    courseId: "course_wellbeing",
    dueAt: addDays(0, 19),
    priority: "low",
    energy: 2,
    difficulty: 1,
    estimatedMinutes: 15,
    attributes: ["memory"],
    tags: ["habit"],
    recurrence: { pattern: "daily" }
  })
].map((task) =>
  task.status === "done" && !task.completedAt
    ? {
        ...task,
        completedAt: new Date().toISOString()
      }
    : task
);

export const sampleGoals = [
  createGoal({
    id: "goal_launch_side_project",
    title: "Launch my side project",
    summary: "Ship a small, honest v1 — steady pace, no late nights.",
    status: "active",
    targetDate: addDays(14, 9),
    projectId: "course_side_project",
    color: "#6be4ff",
    icon: "S",
    priority: "high"
  })
];

export const sampleNotes = [
  createNote({
    id: "note_landing_ideas",
    title: "Landing page ideas",
    body: "Lead with the one outcome it delivers. Keep the copy short.\n\nSections: hero, three features, a short quote, a clear call to action.",
    taskIds: ["task_landing_page"],
    goalIds: ["goal_launch_side_project"],
    projectId: "course_side_project"
  }),
  createNote({
    id: "note_weekly_intention",
    title: "This week's intention",
    body: "Protect two deep-focus blocks each day. Keep the evenings light and unhurried.",
    pinned: true
  })
];

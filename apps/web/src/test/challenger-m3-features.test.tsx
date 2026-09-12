import { fireEvent, render, screen, act } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import React, { useState } from "react";
import {
  GoalSchema,
  NoteSchema,
  TaskSchema,
  createGoal,
  createNote,
  createTask
} from "@throughline/domain";
import { TimelineView } from "../views/TimelineView";
import { GoalsView } from "../views/GoalsView";
import { TaskCard } from "../views/TaskCard";
import { BoardView } from "../views/BoardView";
import { renderWithPlanner } from "./planner-test-utils";

function stubMatchMedia(matchingQuery?: string) {
  const originalMatchMedia = window.matchMedia;
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: query === matchingQuery,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn()
    }))
  });
  return () => {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: originalMatchMedia
    });
  };
}

describe("Challenger M3 Features Adversarial Stress Suite", () => {
  beforeEach(() => {
    Element.prototype.scrollIntoView = vi.fn();
  });

  // =========================================================================
  // Feature 11: TimelineView Task Edit Affordance
  // =========================================================================
  describe("Feature 11: TimelineView Task Edit Affordance", () => {
    const todayAt = (hours: number, minutes = 0) => {
      const date = new Date();
      date.setHours(hours, minutes, 0, 0);
      return date.toISOString();
    };

    const makeTimelineTask = (overrides = {}) => {
      const task = createTask({
        id: "task-tl-1",
        title: "Timeline Chemistry Lab",
        status: "ready",
        dueAt: todayAt(10, 0),
        estimatedMinutes: 45
      });
      return TaskSchema.parse({ ...task, ...overrides });
    };

    it("handles rapid successive clicks on task title without crashing or dropping calls", () => {
      const onEdit = vi.fn();
      const task = makeTimelineTask();

      renderWithPlanner(
        <TimelineView onEdit={onEdit} onNewTask={vi.fn()} onStartFocus={vi.fn()} onUpdateTask={vi.fn()} />,
        {
          planner: {
            tasks: [task],
            courses: [],
            courseById: new Map()
          }
        }
      );

      const titleButton = screen.getByRole("button", { name: "Timeline Chemistry Lab" });
      expect(titleButton).toBeInTheDocument();
      expect(titleButton).toHaveClass("task-card-edit");

      // Adversarial burst: 15 rapid clicks in immediate succession
      for (let i = 0; i < 15; i++) {
        fireEvent.click(titleButton);
      }

      expect(onEdit).toHaveBeenCalledTimes(15);
      expect(onEdit).toHaveBeenLastCalledWith(expect.objectContaining({ id: task.id, title: task.title }));
    });

    it("stops pointer down propagation on task title to isolate clicking from dragging", () => {
      const onEdit = vi.fn();
      const task = makeTimelineTask();

      renderWithPlanner(
        <TimelineView onEdit={onEdit} />,
        {
          planner: {
            tasks: [task],
            courses: [],
            courseById: new Map()
          }
        }
      );

      const titleButton = screen.getByRole("button", { name: "Timeline Chemistry Lab" });
      const pointerDownEvent = new MouseEvent("pointerdown", { bubbles: true, cancelable: true });
      const stopPropagationSpy = vi.spyOn(pointerDownEvent, "stopPropagation");

      fireEvent(titleButton, pointerDownEvent);

      // Verify stopPropagation was called to prevent PointerSensor activation on drag parent
      expect(stopPropagationSpy).toHaveBeenCalled();
    });

    it("clicking outside the title button on the agenda card does not trigger onEdit", () => {
      const onEdit = vi.fn();
      const task = makeTimelineTask();

      const { container } = renderWithPlanner(
        <TimelineView onEdit={onEdit} />,
        {
          planner: {
            tasks: [task],
            courses: [],
            courseById: new Map()
          }
        }
      );

      const agendaCard = container.querySelector(".agenda-card");
      expect(agendaCard).toBeInTheDocument();
      if (agendaCard) {
        fireEvent.click(agendaCard);
      }

      expect(onEdit).not.toHaveBeenCalled();
    });

    it("gracefully falls back to plain text when onEdit is omitted", () => {
      const task = makeTimelineTask({ title: "Non-editable Timeline Task" });

      const { container } = renderWithPlanner(
        <TimelineView />,
        {
          planner: {
            tasks: [task],
            courses: [],
            courseById: new Map()
          }
        }
      );

      // No button with role="button" and name matching task title should exist
      expect(screen.queryByRole("button", { name: "Non-editable Timeline Task" })).not.toBeInTheDocument();

      // Heading exists with plain text inside
      const heading = screen.getByRole("heading", { level: 3, name: "Non-editable Timeline Task" });
      expect(heading).toBeInTheDocument();
      expect(container.querySelector(".task-card-edit")).not.toBeInTheDocument();

      // Clicking text node should not throw error
      expect(() => fireEvent.click(heading)).not.toThrow();
    });

    it("survives extreme task titles: maximum length (140 chars), special characters, and emojis", () => {
      const onEdit = vi.fn();
      // Maximum allowed by TaskSchema is 140 characters
      const maxTitle = ("A".repeat(120) + " <script> 🔥").slice(0, 140);
      const specialTitle = "Lab & Review / [Bio] (v2.0) — 'Quiz' #1";
      const taskMax = makeTimelineTask({ id: "task-max", title: maxTitle, dueAt: todayAt(9, 0) });
      const taskSpecial = makeTimelineTask({ id: "task-spec", title: specialTitle, dueAt: todayAt(11, 0) });

      renderWithPlanner(
        <TimelineView onEdit={onEdit} />,
        {
          planner: {
            tasks: [taskMax, taskSpecial],
            courses: [],
            courseById: new Map()
          }
        }
      );

      const maxButton = screen.getByRole("button", { name: maxTitle });
      expect(maxButton).toBeInTheDocument();
      fireEvent.click(maxButton);
      expect(onEdit).toHaveBeenCalledWith(expect.objectContaining({ id: "task-max" }));

      const specButton = screen.getByRole("button", { name: specialTitle });
      expect(specButton).toBeInTheDocument();
      fireEvent.click(specButton);
      expect(onEdit).toHaveBeenCalledWith(expect.objectContaining({ id: "task-spec" }));
    });

    it("handles multiple tasks with identical start times and minimum/default estimatedMinutes", () => {
      const onEdit = vi.fn();
      // Test minimum valid estimatedMinutes (5) and default/undefined estimatedMinutes
      const t1 = makeTimelineTask({ id: "t1", title: "Task Parallel 1", dueAt: todayAt(14, 0), estimatedMinutes: undefined });
      const t2 = makeTimelineTask({ id: "t2", title: "Task Parallel 2", dueAt: todayAt(14, 0), estimatedMinutes: 5 });

      renderWithPlanner(
        <TimelineView onEdit={onEdit} />,
        {
          planner: {
            tasks: [t1, t2],
            courses: [],
            courseById: new Map()
          }
        }
      );

      expect(screen.getByRole("button", { name: "Task Parallel 1" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Task Parallel 2" })).toBeInTheDocument();

      fireEvent.click(screen.getByRole("button", { name: "Task Parallel 1" }));
      expect(onEdit).toHaveBeenCalledWith(expect.objectContaining({ id: "t1" }));

      fireEvent.click(screen.getByRole("button", { name: "Task Parallel 2" }));
      expect(onEdit).toHaveBeenCalledWith(expect.objectContaining({ id: "t2" }));
    });
  });

  // =========================================================================
  // Feature 12: GoalsView Linked Notes Navigation
  // =========================================================================
  describe("Feature 12: GoalsView Linked Notes Navigation", () => {
    const makeGoalFixture = (overrides = {}) => {
      return GoalSchema.parse(
        createGoal({
          id: "goal-1",
          title: "Graduate with Honors",
          summary: "Complete thesis and maintain 3.8+ GPA",
          ...overrides
        })
      );
    };

    const makeNoteFixture = (overrides = {}) => {
      return NoteSchema.parse(
        createNote({
          id: "note-1",
          title: "Thesis Outline Draft",
          body: "Initial research notes on distributed agreement protocols.",
          goalIds: ["goal-1"],
          ...overrides
        })
      );
    };

    it("invokes onOpenNote with the exact note ID when linked note card is clicked", () => {
      const onOpenNote = vi.fn();
      const goal = makeGoalFixture();
      const note1 = makeNoteFixture({ id: "note-alpha", title: "Alpha Literature Review", goalIds: [goal.id] });
      const note2 = makeNoteFixture({ id: "note-beta", title: "Beta Experiment Results", goalIds: [goal.id] });

      render(
        <GoalsView
          goals={[goal]}
          tasks={[]}
          courses={[]}
          notes={[note1, note2]}
          selectedId={goal.id}
          onSelectGoal={vi.fn()}
          onNewGoal={vi.fn()}
          onSetGoalStatus={vi.fn().mockResolvedValue(undefined)}
          onDeleteGoal={vi.fn().mockResolvedValue(undefined)}
          onEditGoal={vi.fn()}
          onAddTask={vi.fn().mockResolvedValue(undefined)}
          onAddNote={vi.fn().mockResolvedValue(note1)}
          onCompleteTask={vi.fn()}
          onStatusChange={vi.fn()}
          onEditTask={vi.fn()}
          onOpenNote={onOpenNote}
          onReorderTask={vi.fn().mockResolvedValue(undefined)}
        />
      );

      const noteCards = screen.getAllByRole("button").filter((b) => b.classList.contains("goal-note-card"));
      expect(noteCards).toHaveLength(2);

      fireEvent.click(noteCards[0]);
      expect(onOpenNote).toHaveBeenCalledWith("note-alpha");

      fireEvent.click(noteCards[1]);
      expect(onOpenNote).toHaveBeenCalledWith("note-beta");
    });

    it("survives missing notes and renders empty state cleanly when goal has no matching notes", () => {
      const goal = makeGoalFixture();
      // Note exists but is linked to another goal
      const foreignNote = makeNoteFixture({ id: "note-other", goalIds: ["different-goal-id"] });

      render(
        <GoalsView
          goals={[goal]}
          tasks={[]}
          courses={[]}
          notes={[foreignNote]}
          selectedId={goal.id}
          onSelectGoal={vi.fn()}
          onNewGoal={vi.fn()}
          onSetGoalStatus={vi.fn().mockResolvedValue(undefined)}
          onDeleteGoal={vi.fn().mockResolvedValue(undefined)}
          onEditGoal={vi.fn()}
          onAddTask={vi.fn().mockResolvedValue(undefined)}
          onAddNote={vi.fn().mockResolvedValue(foreignNote)}
          onCompleteTask={vi.fn()}
          onStatusChange={vi.fn()}
          onEditTask={vi.fn()}
          onOpenNote={vi.fn()}
          onReorderTask={vi.fn().mockResolvedValue(undefined)}
        />
      );

      expect(screen.getByText("No notes linked yet")).toBeInTheDocument();
      expect(screen.getByText("Add one to capture context for this goal.")).toBeInTheDocument();
      const addNoteButtons = screen.getAllByRole("button", { name: /Add linked note/i });
      expect(addNoteButtons.length).toBeGreaterThanOrEqual(1);
    });

    it("survives completely empty notes array without throwing", () => {
      const goal = makeGoalFixture();

      render(
        <GoalsView
          goals={[goal]}
          tasks={[]}
          courses={[]}
          notes={[]}
          selectedId={goal.id}
          onSelectGoal={vi.fn()}
          onNewGoal={vi.fn()}
          onSetGoalStatus={vi.fn().mockResolvedValue(undefined)}
          onDeleteGoal={vi.fn().mockResolvedValue(undefined)}
          onEditGoal={vi.fn()}
          onAddTask={vi.fn().mockResolvedValue(undefined)}
          onAddNote={vi.fn().mockResolvedValue(makeNoteFixture())}
          onCompleteTask={vi.fn()}
          onStatusChange={vi.fn()}
          onEditTask={vi.fn()}
          onOpenNote={vi.fn()}
          onReorderTask={vi.fn().mockResolvedValue(undefined)}
        />
      );

      expect(screen.getByText("No notes linked yet")).toBeInTheDocument();
    });

    it("safely truncates massive 10,000 character note bodies and handles empty bodies", () => {
      const goal = makeGoalFixture();
      const massiveBody = "Paragraph text ".repeat(700); // > 10,000 chars
      const noteMassive = makeNoteFixture({ id: "note-massive", title: "Massive Note", body: massiveBody, goalIds: [goal.id] });
      const noteEmpty = makeNoteFixture({ id: "note-empty", title: "Empty Note", body: "", goalIds: [goal.id] });

      render(
        <GoalsView
          goals={[goal]}
          tasks={[]}
          courses={[]}
          notes={[noteMassive, noteEmpty]}
          selectedId={goal.id}
          onSelectGoal={vi.fn()}
          onNewGoal={vi.fn()}
          onSetGoalStatus={vi.fn().mockResolvedValue(undefined)}
          onDeleteGoal={vi.fn().mockResolvedValue(undefined)}
          onEditGoal={vi.fn()}
          onAddTask={vi.fn().mockResolvedValue(undefined)}
          onAddNote={vi.fn().mockResolvedValue(noteMassive)}
          onCompleteTask={vi.fn()}
          onStatusChange={vi.fn()}
          onEditTask={vi.fn()}
          onOpenNote={vi.fn()}
          onReorderTask={vi.fn().mockResolvedValue(undefined)}
        />
      );

      // Verify massive note excerpt is cleanly bounded
      const massiveCard = screen.getByText("Massive Note").closest("button");
      expect(massiveCard).toBeInTheDocument();
      const excerptParagraph = massiveCard?.querySelector("p");
      expect(excerptParagraph).toBeInTheDocument();
      expect(excerptParagraph?.textContent?.length).toBeLessThanOrEqual(105);

      // Verify empty body note falls back to default placeholder text
      expect(screen.getByText("Empty note — open Notes to write it.")).toBeInTheDocument();
    });

    it("gracefully falls back to goals list when selectedId is null, undefined, or non-existent", () => {
      const goal = makeGoalFixture();

      const { rerender } = render(
        <GoalsView
          goals={[goal]}
          tasks={[]}
          courses={[]}
          notes={[]}
          selectedId={null}
          onSelectGoal={vi.fn()}
          onNewGoal={vi.fn()}
          onSetGoalStatus={vi.fn().mockResolvedValue(undefined)}
          onDeleteGoal={vi.fn().mockResolvedValue(undefined)}
          onEditGoal={vi.fn()}
          onAddTask={vi.fn().mockResolvedValue(undefined)}
          onAddNote={vi.fn().mockResolvedValue(makeNoteFixture())}
          onCompleteTask={vi.fn()}
          onStatusChange={vi.fn()}
          onEditTask={vi.fn()}
          onOpenNote={vi.fn()}
          onReorderTask={vi.fn().mockResolvedValue(undefined)}
        />
      );

      expect(screen.getByRole("heading", { level: 1, name: "Goals" })).toBeInTheDocument();
      expect(screen.getByText("Graduate with Honors")).toBeInTheDocument();

      // Test with undefined selectedId
      rerender(
        <GoalsView
          goals={[goal]}
          tasks={[]}
          courses={[]}
          notes={[]}
          selectedId={undefined}
          onSelectGoal={vi.fn()}
          onNewGoal={vi.fn()}
          onSetGoalStatus={vi.fn().mockResolvedValue(undefined)}
          onDeleteGoal={vi.fn().mockResolvedValue(undefined)}
          onEditGoal={vi.fn()}
          onAddTask={vi.fn().mockResolvedValue(undefined)}
          onAddNote={vi.fn().mockResolvedValue(makeNoteFixture())}
          onCompleteTask={vi.fn()}
          onStatusChange={vi.fn()}
          onEditTask={vi.fn()}
          onOpenNote={vi.fn()}
          onReorderTask={vi.fn().mockResolvedValue(undefined)}
        />
      );
      expect(screen.getByRole("heading", { level: 1, name: "Goals" })).toBeInTheDocument();

      // Test with non-existent goal ID
      rerender(
        <GoalsView
          goals={[goal]}
          tasks={[]}
          courses={[]}
          notes={[]}
          selectedId="non-existent-goal-id-xyz-999"
          onSelectGoal={vi.fn()}
          onNewGoal={vi.fn()}
          onSetGoalStatus={vi.fn().mockResolvedValue(undefined)}
          onDeleteGoal={vi.fn().mockResolvedValue(undefined)}
          onEditGoal={vi.fn()}
          onAddTask={vi.fn().mockResolvedValue(undefined)}
          onAddNote={vi.fn().mockResolvedValue(makeNoteFixture())}
          onCompleteTask={vi.fn()}
          onStatusChange={vi.fn()}
          onEditTask={vi.fn()}
          onOpenNote={vi.fn()}
          onReorderTask={vi.fn().mockResolvedValue(undefined)}
        />
      );
      // Should not throw, should fall back to main goals view
      expect(screen.getByRole("heading", { level: 1, name: "Goals" })).toBeInTheDocument();
      expect(screen.getByText("Graduate with Honors")).toBeInTheDocument();
    });

    it("does not throw when onOpenNote callback is omitted and note card is clicked", () => {
      const goal = makeGoalFixture();
      const note = makeNoteFixture({ goalIds: [goal.id] });

      render(
        <GoalsView
          goals={[goal]}
          tasks={[]}
          courses={[]}
          notes={[note]}
          selectedId={goal.id}
          onSelectGoal={vi.fn()}
          onNewGoal={vi.fn()}
          onSetGoalStatus={vi.fn().mockResolvedValue(undefined)}
          onDeleteGoal={vi.fn().mockResolvedValue(undefined)}
          onEditGoal={vi.fn()}
          onAddTask={vi.fn().mockResolvedValue(undefined)}
          onAddNote={vi.fn().mockResolvedValue(note)}
          onCompleteTask={vi.fn()}
          onStatusChange={vi.fn()}
          onEditTask={vi.fn()}
          onOpenNote={undefined}
          onReorderTask={vi.fn().mockResolvedValue(undefined)}
        />
      );

      const noteCard = screen.getByText(note.title).closest("button");
      expect(noteCard).toBeInTheDocument();
      expect(() => {
        if (noteCard) fireEvent.click(noteCard);
      }).not.toThrow();
    });
  });

  // =========================================================================
  // Feature 13: Board View & TaskCard Celebration Trigger
  // =========================================================================
  describe("Feature 13: Board View & TaskCard Celebration Trigger", () => {
    const makeCardTask = (overrides = {}) => {
      const task = createTask({
        id: "task-burst-1",
        title: "Complete Final Presentation",
        status: "doing"
      });
      return TaskSchema.parse({ ...task, ...overrides });
    };

    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("fires both onStatusChange and onComplete when completing a task", () => {
      const onComplete = vi.fn();
      const onStatusChange = vi.fn();
      const task = makeCardTask();

      render(
        <TaskCard
          task={task}
          onComplete={onComplete}
          onStatusChange={onStatusChange}
          showGameLayer
        />
      );

      const completeBtn = screen.getByRole("button", { name: `Complete ${task.title}` });
      fireEvent.click(completeBtn);

      expect(onStatusChange).toHaveBeenCalledWith(task.id, "done");
      expect(onComplete).toHaveBeenCalledWith(expect.objectContaining({ id: task.id }));
    });

    it("triggers XP burst lifecycle with +XP display and auto-clears after 2000ms", () => {
      const task = makeCardTask();

      const { container } = render(
        <TaskCard
          task={task}
          onComplete={vi.fn()}
          onStatusChange={vi.fn()}
          showGameLayer
        />
      );

      // Prior to click: no completion burst
      expect(container.querySelector(".completion-burst")).toBeNull();
      expect(screen.queryByText(`+${task.xp} XP`)).not.toBeInTheDocument();

      const completeBtn = screen.getByRole("button", { name: `Complete ${task.title}` });
      fireEvent.click(completeBtn);

      // Immediately after completion: burst and XP chip appear
      expect(container.querySelector(".completion-burst")).toBeInTheDocument();
      expect(screen.getByText(`+${task.xp} XP`)).toBeInTheDocument();

      // Advance clock by 1999ms: burst still active
      act(() => {
        vi.advanceTimersByTime(1999);
      });
      expect(container.querySelector(".completion-burst")).toBeInTheDocument();

      // Advance past 2000ms: burst expires and clears
      act(() => {
        vi.advanceTimersByTime(50);
      });
      expect(container.querySelector(".completion-burst")).toBeNull();
    });

    it("handles rapid burst clicks on completion button without multiple completions once done", () => {
      const onComplete = vi.fn();
      const onStatusChange = vi.fn();
      const task = makeCardTask();

      // Test harness that updates task status upon onStatusChange
      function InteractiveHarness() {
        const [currentTask, setCurrentTask] = useState(task);
        return (
          <TaskCard
            task={currentTask}
            onComplete={onComplete}
            onStatusChange={(id, nextStatus) => {
              onStatusChange(id, nextStatus);
              setCurrentTask((prev) => ({ ...prev, status: nextStatus }));
            }}
          />
        );
      }

      render(<InteractiveHarness />);

      const completeBtn = screen.getByRole("button", { name: `Complete ${task.title}` });

      // Adversarial attack: 10 rapid clicks
      for (let i = 0; i < 10; i++) {
        fireEvent.click(completeBtn);
      }

      // Because the first click triggers onStatusChange which transitions task to "done",
      // the button immediately becomes disabled and subsequent clicks are suppressed
      expect(onStatusChange).toHaveBeenCalledTimes(1);
      expect(onComplete).toHaveBeenCalledTimes(1);
      expect(completeBtn).toBeDisabled();
      expect(completeBtn).toHaveClass("is-done");
    });

    it("disables completion button and suppresses callbacks when task is already done", () => {
      const onComplete = vi.fn();
      const onStatusChange = vi.fn();
      const doneTask = makeCardTask({ status: "done" });

      render(
        <TaskCard
          task={doneTask}
          onComplete={onComplete}
          onStatusChange={onStatusChange}
        />
      );

      const completeBtn = screen.getByRole("button", { name: `${doneTask.title} completed` });
      expect(completeBtn).toBeDisabled();
      expect(completeBtn).toHaveClass("is-done");

      fireEvent.click(completeBtn);

      expect(onComplete).not.toHaveBeenCalled();
      expect(onStatusChange).not.toHaveBeenCalled();
    });

    it("triggers celebratory burst when task status transitions to done externally", () => {
      const task = makeCardTask({ status: "doing" });

      function ExternalHarness() {
        const [t, setT] = useState(task);
        return (
          <div>
            <button onClick={() => setT((prev) => ({ ...prev, status: "done" }))}>External Done</button>
            <TaskCard task={t} showGameLayer />
          </div>
        );
      }

      const { container } = render(<ExternalHarness />);
      expect(container.querySelector(".completion-burst")).toBeNull();

      fireEvent.click(screen.getByText("External Done"));

      // useEffect detects transition to "done" and starts burst
      expect(container.querySelector(".completion-burst")).toBeInTheDocument();
      expect(screen.getByText(`+${task.xp} XP`)).toBeInTheDocument();

      // Clears after 2000ms
      act(() => {
        vi.advanceTimersByTime(2000);
      });
      expect(container.querySelector(".completion-burst")).toBeNull();
    });

    it("functions smoothly when only onComplete is provided without onStatusChange", () => {
      const onComplete = vi.fn();
      const task = makeCardTask();

      render(<TaskCard task={task} onComplete={onComplete} />);

      const completeBtn = screen.getByRole("button", { name: `Complete ${task.title}` });
      expect(() => fireEvent.click(completeBtn)).not.toThrow();
      expect(onComplete).toHaveBeenCalledWith(expect.objectContaining({ id: task.id }));
    });

    it("functions smoothly when only onStatusChange is provided without onComplete", () => {
      const onStatusChange = vi.fn();
      const task = makeCardTask();

      render(<TaskCard task={task} onStatusChange={onStatusChange} />);

      const completeBtn = screen.getByRole("button", { name: `Complete ${task.title}` });
      expect(() => fireEvent.click(completeBtn)).not.toThrow();
      expect(onStatusChange).toHaveBeenCalledWith(task.id, "done");
    });

    it("BoardView handleCompleteTask announces status to ARIA live region and drives justCompleted", () => {
      const restore = stubMatchMedia();
      const onComplete = vi.fn();
      const onStatusChange = vi.fn();
      const task = makeCardTask({ id: "board-t1", status: "ready" });

      renderWithPlanner(
        <BoardView
          onComplete={onComplete}
          onStatusChange={onStatusChange}
          onEdit={vi.fn()}
          showGameLayer
        />,
        {
          planner: {
            tasks: [task],
            courses: [],
            courseById: new Map()
          }
        }
      );

      const completeBtn = screen.getByRole("button", { name: `Complete ${task.title}` });
      fireEvent.click(completeBtn);

      expect(onComplete).toHaveBeenCalledWith(expect.objectContaining({ id: "board-t1" }));
      expect(screen.getByText(`Moved ${task.title} to Done.`)).toBeInTheDocument();

      restore();
    });
  });
});

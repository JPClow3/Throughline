import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { deriveUserProgress } from "@throughline/domain";
import { makeTask, renderWithPlanner } from "./planner-test-utils";
import { GameProgressCard } from "../views/GameProgressCard";
import { TodayView } from "../views/TodayView";

afterEach(() => {
  cleanup();
});

describe("GameProgressCard", () => {
  it("shows level, streak, attributes, and badges", () => {
    const done = makeTask({
      id: "done-1",
      status: "done",
      xp: 120,
      completedAt: new Date().toISOString(),
      attributes: ["focus"]
    });
    const progress = deriveUserProgress([done]);
    render(<GameProgressCard progress={progress} />);

    expect(screen.getByRole("heading", { name: new RegExp(`Level ${progress.level}`, "i") })).toBeInTheDocument();
    expect(screen.getByText(/total XP/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/RPG attributes/i)).toBeInTheDocument();
  });

  it("hides on Today when the game layer is off", () => {
    renderWithPlanner(<TodayView onNewTask={vi.fn()} onEdit={vi.fn()} showGameLayer={false} />, {
      planner: { progress: deriveUserProgress([]) }
    });
    expect(screen.queryByLabelText(/Game progress/i)).not.toBeInTheDocument();
  });

  it("shows on Today when the game layer is on", () => {
    renderWithPlanner(<TodayView onNewTask={vi.fn()} onEdit={vi.fn()} showGameLayer />, {
      planner: { progress: deriveUserProgress([]) }
    });
    expect(screen.getByLabelText(/Game progress/i)).toBeInTheDocument();
    expect(screen.getByText(/Start a streak/i)).toBeInTheDocument();
  });
});

import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { OnboardingOverlay } from "../views/OnboardingOverlay";

describe("OnboardingOverlay", () => {
  afterEach(() => {
    sessionStorage.clear();
  });

  it("creates a first useful setup", () => {
    const onSetup = vi.fn();
    const onComplete = vi.fn();
    render(<OnboardingOverlay onSetup={onSetup} onComplete={onComplete} />);

    expect(screen.getByRole("heading", { name: "What are you planning for?" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Work" }));
    fireEvent.click(screen.getByRole("button", { name: "Next" }));

    expect(screen.getByRole("heading", { name: "Name your projects" })).toBeInTheDocument();
    const projectInput = screen.getByLabelText("Project 1");
    fireEvent.change(projectInput, { target: { value: "Client launch" } });
    fireEvent.click(screen.getByRole("button", { name: "Next" }));

    expect(screen.getByRole("heading", { name: "Capture one real task" })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("First task"), { target: { value: "Draft kickoff notes" } });
    fireEvent.click(screen.getByRole("button", { name: "Next" }));

    expect(screen.getByRole("heading", { name: "Optional finishing touches" })).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText("Open Settings next so I can enable encrypted sync"));
    fireEvent.click(screen.getByRole("button", { name: /Finish setup/i }));

    expect(onSetup).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: "work",
        projectNames: ["Client launch"],
        taskTitle: "Draft kickoff notes",
        openSyncSettings: true
      })
    );
    expect(onComplete).toHaveBeenCalled();
    expect(sessionStorage.getItem("throughline:onboarding-draft")).toBeNull();
  });

  it("restores the current setup step after a remount", () => {
    const { unmount } = render(<OnboardingOverlay onSetup={vi.fn()} onComplete={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByRole("heading", { name: "Add your courses" })).toBeInTheDocument();
    unmount();

    render(<OnboardingOverlay onSetup={vi.fn()} onComplete={vi.fn()} />);
    expect(screen.getByRole("heading", { name: "Add your courses" })).toBeInTheDocument();
    expect(screen.getByText("Setup · 2 of 4")).toBeInTheDocument();
  });
});


import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { OnboardingOverlay } from "../components/OnboardingOverlay";

describe("OnboardingOverlay", () => {
  it("creates a first useful setup", () => {
    const onSetup = vi.fn();
    const onComplete = vi.fn();
    render(<OnboardingOverlay onSetup={onSetup} onComplete={onComplete} />);

    fireEvent.click(screen.getByRole("button", { name: "Work" }));
    fireEvent.click(screen.getByRole("button", { name: "Next" }));

    const projectInput = screen.getByLabelText("Project 1");
    fireEvent.change(projectInput, { target: { value: "Client launch" } });
    fireEvent.click(screen.getByRole("button", { name: "Next" }));

    fireEvent.change(screen.getByLabelText("First task"), { target: { value: "Draft kickoff notes" } });
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
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
  });
});

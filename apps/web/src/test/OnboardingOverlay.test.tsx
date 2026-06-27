import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { OnboardingOverlay } from "../components/OnboardingOverlay";

describe("OnboardingOverlay", () => {
  it("renders when active and allows skipping", () => {
    const onComplete = vi.fn();
    render(<OnboardingOverlay onComplete={onComplete} />);
    
    // Should render the overlay initially
    expect(screen.getByText("Welcome to Throughline")).toBeInTheDocument();
    
    // Find skip button
    const skipButton = screen.getByRole("button", { name: /skip/i });
    expect(skipButton).toBeInTheDocument();
    
    // Click skip
    fireEvent.click(skipButton);
    
    expect(onComplete).toHaveBeenCalled();
  });
});

import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Sheet } from "../components/Sheet";
import React from "react";

describe("Sheet", () => {
  it("renders when open and handles close", () => {
    const onClose = vi.fn();
    render(
      <Sheet open={true} title="Test Sheet" onClose={onClose}>
        <div>Sheet content</div>
      </Sheet>
    );

    expect(screen.getByText("Test Sheet")).toBeInTheDocument();
    expect(screen.getByText("Sheet content")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(onClose).toHaveBeenCalled();
  });

  it("handles Escape key to close", () => {
    const onClose = vi.fn();
    render(
      <Sheet open={true} title="Escape Sheet" onClose={onClose}>
        <input type="text" data-testid="sheet-input" />
      </Sheet>
    );

    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalled();
  });

  it("returns null when not open", () => {
    render(
      <Sheet open={false} title="Closed Sheet" onClose={vi.fn()}>
        <div>Hidden content</div>
      </Sheet>
    );

    expect(screen.queryByText("Closed Sheet")).not.toBeInTheDocument();
  });
});

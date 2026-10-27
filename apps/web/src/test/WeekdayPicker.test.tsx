import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { WeekdayPicker } from "../ui/WeekdayPicker";

describe("WeekdayPicker", () => {
  it("toggles weekdays and reports sorted selection", () => {
    const onChange = vi.fn();
    render(<WeekdayPicker value={[1, 3]} onChange={onChange} />);

    fireEvent.click(screen.getByRole("button", { name: "Friday" }));
    expect(onChange).toHaveBeenCalledWith([1, 3, 5]);

    fireEvent.click(screen.getByRole("button", { name: "Monday" }));
    expect(onChange).toHaveBeenCalledWith([3]);
  });

  it("exposes pressed state for selected days", () => {
    render(<WeekdayPicker value={[0, 6]} onChange={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Sunday" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Saturday" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Tuesday" })).toHaveAttribute("aria-pressed", "false");
  });
});

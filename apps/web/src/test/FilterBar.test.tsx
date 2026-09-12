import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CourseSchema } from "@throughline/domain";
import { FilterBar } from "../views/FilterBar";
import { defaultFilterPresets, defaultFilterState } from "../data/repositories";

describe("FilterBar", () => {
  it("renders presets, tag chips, and clear filters", () => {
    const setFilter = vi.fn();
    const onApplyPreset = vi.fn();
    const onClearFilters = vi.fn();
    const onSavePreset = vi.fn();

    render(
      <FilterBar
        courses={[
          CourseSchema.parse({
            id: "course_1",
            name: "Biology",
            color: "#2fa980",
            icon: "B",
            createdAt: "2026-06-28T12:00:00.000Z",
            updatedAt: "2026-06-28T12:00:00.000Z"
          })
        ]}
        filters={{ ...defaultFilterState, tags: ["lab"], dateRange: "today" }}
        setFilter={setFilter}
        presets={defaultFilterPresets}
        availableTags={["lab", "reading"]}
        onApplyPreset={onApplyPreset}
        onClearFilters={onClearFilters}
        onSavePreset={onSavePreset}
      />
    );

    fireEvent.click(screen.getAllByRole("button", { name: "Overdue" })[0]);
    expect(onApplyPreset).toHaveBeenCalledWith(defaultFilterPresets[0]);

    fireEvent.click(screen.getByRole("button", { name: "Biology" }));
    expect(setFilter).toHaveBeenCalledWith("projectId", "course_1");

    fireEvent.click(screen.getByRole("button", { name: "reading" }));
    expect(setFilter).toHaveBeenCalledWith("tags", ["lab", "reading"]);

    fireEvent.click(screen.getByRole("button", { name: /Clear filters/i }));
    expect(onClearFilters).toHaveBeenCalled();

    // Open the accessible save preset modal
    fireEvent.click(screen.getByRole("button", { name: /Save preset/i }));
    const dialog = screen.getByRole("dialog", { name: /Save filter preset/i });
    expect(dialog).toBeInTheDocument();

    const input = within(dialog).getByLabelText(/Filter preset name/i);
    fireEvent.change(input, { target: { value: "Lab day" } });

    // Submit the modal form
    fireEvent.click(within(dialog).getByRole("button", { name: /^Save preset$/i }));
    expect(onSavePreset).toHaveBeenCalledWith("Lab day");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("collapses advanced filters behind a compact filter toggle", () => {
    const originalMatchMedia = window.matchMedia;
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: query === "(max-width: 720px)",
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn()
      }))
    });

    render(
      <FilterBar
        courses={[
          CourseSchema.parse({
            id: "course_1",
            name: "Biology",
            color: "#2fa980",
            icon: "B",
            createdAt: "2026-06-28T12:00:00.000Z",
            updatedAt: "2026-06-28T12:00:00.000Z"
          })
        ]}
        filters={{ ...defaultFilterState, dateRange: "today" }}
        setFilter={vi.fn()}
        presets={defaultFilterPresets}
        availableTags={["lab"]}
      />
    );

    expect(screen.queryByRole("button", { name: "Biology" })).not.toBeInTheDocument();
    const toggle = screen.getByRole("button", { name: /Filters/i });
    expect(toggle).toHaveTextContent("1");
    fireEvent.click(toggle);
    expect(screen.getByRole("button", { name: "Biology" })).toBeInTheDocument();

    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: originalMatchMedia
    });
  });

  it("renders presets cleanly in compact mobile mode and allows application", () => {
    const originalMatchMedia = window.matchMedia;
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: query === "(max-width: 720px)",
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn()
      }))
    });

    const onApplyPreset = vi.fn();
    render(
      <FilterBar
        courses={[]}
        filters={defaultFilterState}
        setFilter={vi.fn()}
        presets={defaultFilterPresets}
        onApplyPreset={onApplyPreset}
      />
    );

    // Presets must be visible even when compact/mobile
    const overduePreset = screen.getByRole("button", { name: "Overdue" });
    expect(overduePreset).toBeInTheDocument();
    fireEvent.click(overduePreset);
    expect(onApplyPreset).toHaveBeenCalledWith(defaultFilterPresets[0]);

    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: originalMatchMedia
    });
  });

  it("allows dismissing save preset modal without saving", () => {
    const onSavePreset = vi.fn();
    render(
      <FilterBar
        courses={[]}
        filters={{ ...defaultFilterState, search: "exam" }}
        setFilter={vi.fn()}
        onSavePreset={onSavePreset}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /Save preset/i }));
    const dialog = screen.getByRole("dialog", { name: /Save filter preset/i });
    expect(dialog).toBeInTheDocument();

    fireEvent.click(within(dialog).getByRole("button", { name: /Cancel/i }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(onSavePreset).not.toHaveBeenCalled();
  });
});

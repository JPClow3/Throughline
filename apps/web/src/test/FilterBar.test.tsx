import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CourseSchema } from "@throughline/domain";
import { FilterBar } from "../components/FilterBar";
import { defaultFilterPresets, defaultFilterState } from "../data/repositories";

describe("FilterBar", () => {
  it("renders presets, tag chips, and clear filters", () => {
    const setFilter = vi.fn();
    const onApplyPreset = vi.fn();
    const onClearFilters = vi.fn();
    const onSavePreset = vi.fn();
    vi.spyOn(window, "prompt").mockReturnValue("Lab day");

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

    fireEvent.click(screen.getByRole("button", { name: /Save preset/i }));
    expect(onSavePreset).toHaveBeenCalledWith("Lab day");
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
});

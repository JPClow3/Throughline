import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { GoalComposer } from "../components/GoalComposer";
import React from "react";

describe("GoalComposer", () => {
  it("renders correctly", () => {
    render(
      <GoalComposer courses={[]} onSubmit={vi.fn()} />
    );
    expect(screen.getByRole("button", { name: /Create goal/i })).toBeInTheDocument();
  });
});

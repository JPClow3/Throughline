import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Skeleton, ViewSkeleton } from "../components/Skeleton";
import React from "react";

describe("Skeleton", () => {
  it("renders a basic skeleton", () => {
    const { container } = render(<Skeleton />);
    expect(container.querySelector(".skeleton")).not.toBeNull();
  });

  it("renders a skeleton with custom class", () => {
    const { container } = render(<Skeleton className="custom" />);
    expect(container.querySelector(".custom")).not.toBeNull();
  });
});

describe("ViewSkeleton", () => {
  it("renders a view skeleton layout", () => {
    const { container } = render(<ViewSkeleton />);
    expect(container.querySelector(".skeleton-view")).not.toBeNull();
  });
});

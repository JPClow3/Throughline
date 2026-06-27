import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Spinner } from "../components/Spinner";
import React from "react";

describe("Spinner", () => {
  it("renders with default size", () => {
    const { container } = render(<Spinner />);
    const svg = container.querySelector("svg");
    expect(svg).not.toBeNull();
  });

  it("renders with custom size and class", () => {
    const { container } = render(<Spinner size={48} className="my-spin" />);
    const svg = container.querySelector("svg");
    expect(svg?.classList.contains("my-spin")).toBe(true);
  });
});

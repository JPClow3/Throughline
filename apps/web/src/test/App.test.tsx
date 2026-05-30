import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { App } from "../App";

describe("App", () => {
  it("renders the planner shell", async () => {
    render(<App />);

    expect(await screen.findByRole("button", { name: "Today" })).toBeInTheDocument();
    expect(screen.getByLabelText("Board")).toBeInTheDocument();
  });
});

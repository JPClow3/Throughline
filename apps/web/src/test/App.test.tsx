import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { App } from "../App";
import { AuthProvider } from "../auth/AuthProvider";

describe("App", () => {
  it("renders the planner shell", async () => {
    render(
      <AuthProvider>
        <App />
      </AuthProvider>
    );

    const todayButtons = await screen.findAllByRole("button", { name: "Today" });
    expect(todayButtons.length).toBeGreaterThan(0);
    const boardButtons = screen.getAllByLabelText("Board");
    expect(boardButtons.length).toBeGreaterThan(0);
  });
});

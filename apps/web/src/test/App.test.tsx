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

    expect(await screen.findByRole("button", { name: "Today" })).toBeInTheDocument();
    expect(screen.getByLabelText("Board")).toBeInTheDocument();
  });
});

import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { RequireAuth } from "../auth/RequireAuth";
import * as AuthProvider from "../auth/AuthProvider";
import { MemoryRouter } from "react-router-dom";
import React from "react";

describe("RequireAuth", () => {
  it("renders children when authed", () => {
    vi.spyOn(AuthProvider, "useAuth").mockReturnValue({ status: "authed" } as any);
    const { container } = render(
      <MemoryRouter>
        <RequireAuth><div>Content</div></RequireAuth>
      </MemoryRouter>
    );
    expect(container.textContent).toBe("Content");
  });

  it("renders spinner when loading", () => {
    vi.spyOn(AuthProvider, "useAuth").mockReturnValue({ status: "loading" } as any);
    const { container } = render(
      <MemoryRouter>
        <RequireAuth><div>Content</div></RequireAuth>
      </MemoryRouter>
    );
    expect(container.querySelector("svg")).not.toBeNull();
  });

  it("redirects when anon", () => {
    vi.spyOn(AuthProvider, "useAuth").mockReturnValue({ status: "anon" } as any);
    const { container } = render(
      <MemoryRouter>
        <RequireAuth><div>Content</div></RequireAuth>
      </MemoryRouter>
    );
    expect(container.textContent).toBe("");
  });
});

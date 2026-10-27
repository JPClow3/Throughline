import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { VerifyEmail } from "../pages/VerifyEmail";

describe("VerifyEmail page", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("shows an error when the token is missing", async () => {
    render(
      <MemoryRouter initialEntries={["/verify-email"]}>
        <Routes>
          <Route path="/verify-email" element={<VerifyEmail />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText(/missing a token/i)).toBeInTheDocument();
  });

  it("verifies a token from the query string", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ email: "student@example.com", emailVerified: true })
      })
    );

    render(
      <MemoryRouter initialEntries={["/verify-email?token=abc123tokenvalue"]}>
        <Routes>
          <Route path="/verify-email" element={<VerifyEmail />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText(/you're all set/i)).toBeInTheDocument();
    expect(screen.getByText(/student@example.com/i)).toBeInTheDocument();
    await waitFor(() => expect(fetch).toHaveBeenCalled());
  });
});

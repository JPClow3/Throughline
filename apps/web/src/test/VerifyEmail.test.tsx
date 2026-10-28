import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { VerifyEmail } from "../pages/VerifyEmail";

const verifyEmailToken = vi.fn();

vi.mock("../auth/AuthProvider", () => ({
  useAuth: () => ({
    verifyEmailToken,
    email: null,
    emailVerified: null,
    status: "anon"
  })
}));

describe("VerifyEmail page", () => {
  afterEach(() => {
    verifyEmailToken.mockReset();
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
    expect(verifyEmailToken).not.toHaveBeenCalled();
  });

  it("verifies a token through AuthProvider so the session updates", async () => {
    verifyEmailToken.mockResolvedValue({ email: "student@example.com", alreadyVerified: false });

    render(
      <MemoryRouter initialEntries={["/verify-email?token=abc123tokenvalue"]}>
        <Routes>
          <Route path="/verify-email" element={<VerifyEmail />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText(/you're all set/i)).toBeInTheDocument();
    expect(screen.getByText(/student@example.com/i)).toBeInTheDocument();
    await waitFor(() => expect(verifyEmailToken).toHaveBeenCalledWith("abc123tokenvalue"));
  });
});

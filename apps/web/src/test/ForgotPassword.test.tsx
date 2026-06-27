import { render, fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ForgotPassword } from "../pages/ForgotPassword";
import * as AuthProvider from "../auth/AuthProvider";
import { MemoryRouter } from "react-router-dom";
import React from "react";

describe("ForgotPassword", () => {
  it("redirects if already authed", () => {
    vi.spyOn(AuthProvider, "useAuth").mockReturnValue({ status: "authed" } as any);
    const { container } = render(<MemoryRouter><ForgotPassword /></MemoryRouter>);
    expect(container.textContent).toBe("");
  });

  it("renders the form when anon", () => {
    vi.spyOn(AuthProvider, "useAuth").mockReturnValue({ status: "anon" } as any);
    const { getByText } = render(<MemoryRouter><ForgotPassword /></MemoryRouter>);
    expect(getByText("Recover Account")).not.toBeNull();
  });

  it("validates short passwords", async () => {
    vi.spyOn(AuthProvider, "useAuth").mockReturnValue({ status: "anon" } as any);
    const { getByText, getByRole, getByLabelText } = render(<MemoryRouter><ForgotPassword /></MemoryRouter>);
    
    fireEvent.change(getByLabelText("Email"), { target: { value: "test@test.com" } });
    fireEvent.change(getByLabelText("Recovery Key"), { target: { value: "abc" } });
    fireEvent.change(getByLabelText("New Password"), { target: { value: "short" } });

    const button = getByRole("button", { name: "Reset Password" });
    fireEvent.click(button);
    await waitFor(() => {
      expect(getByText("Use at least 8 characters for your new password.")).not.toBeNull();
    });
  });

  it("calls resetPassword on submit", async () => {
    const resetPassword = vi.fn().mockResolvedValue(undefined);
    vi.spyOn(AuthProvider, "useAuth").mockReturnValue({ status: "anon", resetPassword } as any);
    
    // Create wrapper element so we can find things by label text easily
    const { getByRole, getByLabelText } = render(<MemoryRouter><ForgotPassword /></MemoryRouter>);
    
    fireEvent.change(getByLabelText("Email"), { target: { value: "test@test.com" } });
    fireEvent.change(getByLabelText("Recovery Key"), { target: { value: "abc" } });
    fireEvent.change(getByLabelText("New Password"), { target: { value: "password123" } });
    
    fireEvent.click(getByRole("button", { name: "Reset Password" }));
    await waitFor(() => {
      expect(resetPassword).toHaveBeenCalledWith("test@test.com", "abc", "password123");
    });
  });
});

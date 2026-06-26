import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Login } from "../pages/Login";
import { Signup } from "../pages/Signup";
import { BrowserRouter } from "react-router-dom";


import { AuthProvider } from "../auth/AuthProvider";

describe("Auth Pages", () => {
  it("renders Login page correctly", () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <Login />
        </AuthProvider>
      </BrowserRouter>
    );
    expect(screen.getByRole("heading", { name: /Login/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Master Password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Login/i })).toBeInTheDocument();
  });

  it("renders Signup page correctly", () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <Signup />
        </AuthProvider>
      </BrowserRouter>
    );
    expect(screen.getByRole("heading", { name: /Create an account/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Master Password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Confirm Password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Create Account/i })).toBeInTheDocument();
  });
});

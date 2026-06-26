import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
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
    expect(screen.getByRole("heading", { name: /Welcome back/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Password or Recovery Key/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Sign in/i })).toBeInTheDocument();
  });

  it("renders Signup page correctly", () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <Signup />
        </AuthProvider>
      </BrowserRouter>
    );
    expect(screen.getByRole("heading", { name: /Create your account/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/^Password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Confirm password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Create account/i })).toBeInTheDocument();
  });
});

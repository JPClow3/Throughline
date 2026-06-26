import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Landing } from "../pages/Landing";
import { BrowserRouter } from "react-router-dom";

describe("Landing Page", () => {
  it("renders main headings and call to action", () => {
    vi.stubGlobal('IntersectionObserver', class {
      observe() {}
      unobserve() {}
      disconnect() {}
    });
    render(
      <BrowserRouter>
        <Landing />
      </BrowserRouter>
    );
    
    // Test for some basic expected content on the landing page
    expect(screen.getAllByText(/Throughline/i)[0]).toBeInTheDocument();
  });
});

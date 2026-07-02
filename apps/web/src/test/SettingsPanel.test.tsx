import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SettingsPanel } from "../components/SettingsPanel";
import React from "react";

describe("SettingsPanel", () => {
  it("renders settings sections", () => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });

    render(
      <SettingsPanel
        tasks={[]}
        courses={[]}
        onAppearanceChange={vi.fn()}
      />
    );
    expect(screen.getByRole("heading", { name: "Settings" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Appearance" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "App readiness" })).toBeInTheDocument();
  });

  it("regenerates and confirms a recovery key for signed-in accounts", async () => {
    render(
      <SettingsPanel
        tasks={[]}
        courses={[]}
        onAppearanceChange={vi.fn()}
        account={{ email: "student@example.com", syncStatus: "idle", lastSyncAt: null }}
        onRegenerateRecoveryKey={vi.fn().mockResolvedValue("abcd-efgh-ijkl-mnop")}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /Regenerate recovery key/i }));

    expect(await screen.findByText("abcd-efgh-ijkl-mnop")).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText(/I saved this recovery key/i));
    fireEvent.change(screen.getByLabelText(/Confirm last 4 characters/i), { target: { value: "mnop" } });
    expect(screen.getByText(/Saved confirmation complete/i)).toBeInTheDocument();
  });
});

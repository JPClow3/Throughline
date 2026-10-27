import { describe, expect, it } from "vitest";
import { buildVerifyEmailLink } from "../lib/verifyEmailLink";

describe("buildVerifyEmailLink", () => {
  it("builds an absolute verify URL without planner content", () => {
    const url = buildVerifyEmailLink("tokentokentoken", "https://app.example.com/");
    expect(url).toBe("https://app.example.com/verify-email?token=tokentokentoken");
    expect(url).not.toMatch(/task|note|homework/i);
  });
});

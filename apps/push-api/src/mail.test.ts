// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import { buildVerifyEmailUrl, sendVerificationEmail } from "./mail";

describe("mail verification helpers", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("builds verify URLs without leaking planner content", () => {
    const url = buildVerifyEmailUrl({ publicAppUrl: "https://app.example.com/" }, "abc123token");
    expect(url).toBe("https://app.example.com/verify-email?token=abc123token");
    expect(url).not.toMatch(/task|quest|note/i);
  });

  it("logs and skips send when Resend is not configured", async () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => undefined);
    const result = await sendVerificationEmail(
      { publicAppUrl: "http://127.0.0.1:5173" },
      { to: "a@example.com", token: "tokentokentokentoken" }
    );
    expect(result.sent).toBe(false);
    expect(result.verifyUrl).toContain("/verify-email?token=");
    expect(info).toHaveBeenCalled();
  });

  it("posts to Resend when configured", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, text: async () => "" });
    vi.stubGlobal("fetch", fetchMock);

    const result = await sendVerificationEmail(
      {
        resendApiKey: "re_test",
        emailFrom: "Throughline <noreply@example.com>",
        publicAppUrl: "https://app.example.com"
      },
      { to: "a@example.com", token: "tokentokentokentoken" }
    );

    expect(result.sent).toBe(true);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.resend.com/emails",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ Authorization: "Bearer re_test" })
      })
    );
    const body = JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string) as {
      text: string;
      to: string[];
    };
    expect(body.to).toEqual(["a@example.com"]);
    expect(body.text).toContain("verify-email?token=");
    expect(body.text).not.toMatch(/task title|homework|CS101/i);
  });
});

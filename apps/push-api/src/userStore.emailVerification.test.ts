// @vitest-environment node
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { createUserStore } from "./userStore";

describe("userStore email verification", () => {
  const dirs: string[] = [];

  afterEach(() => {
    while (dirs.length) {
      const dir = dirs.pop();
      if (dir) rmSync(dir, { recursive: true, force: true });
    }
  });

  function store() {
    const dir = mkdtempSync(join(tmpdir(), "tl-verify-"));
    dirs.push(dir);
    return createUserStore(join(dir, "test.db"));
  }

  const signupInput = {
    email: "student@example.com",
    salt: "salt",
    authKey: "auth",
    wrappedDek: "wrap",
    recoveryAuthKey: "rec-auth",
    recoveryWrappedDek: "rec-wrap"
  };

  it("creates password users unverified and consumes one-time tokens", () => {
    const users = store();
    const user = users.createUser(signupInput);
    expect(user).toBeTruthy();
    expect(users.isEmailVerified(user!.id)).toBe(false);

    const token = users.createEmailVerificationToken(user!.id);
    expect(token.length).toBeGreaterThan(16);

    const session = users.createSession(user!.id);
    expect(users.getSessionUser(session)).toMatchObject({
      email: "student@example.com",
      emailVerified: false
    });

    const verified = users.verifyEmailWithToken(token);
    expect(verified).toEqual({ userId: user!.id, email: "student@example.com" });
    expect(users.isEmailVerified(user!.id)).toBe(true);
    expect(users.getSessionUser(session)?.emailVerified).toBe(true);

    // Token is one-time
    expect(users.verifyEmailWithToken(token)).toBeNull();
  });

  it("replaces prior tokens on resend", () => {
    const users = store();
    const user = users.createUser({ ...signupInput, email: "resend@example.com" });
    const first = users.createEmailVerificationToken(user!.id);
    const second = users.createEmailVerificationToken(user!.id);
    expect(users.verifyEmailWithToken(first)).toBeNull();
    expect(users.verifyEmailWithToken(second)?.email).toBe("resend@example.com");
  });

  it("marks Google users verified at creation", () => {
    const users = store();
    const user = users.createGoogleUser({
      email: "google@example.com",
      googleId: "gid-1",
      dek: "dek-blob"
    });
    expect(user?.emailVerifiedAt).toBeTruthy();
    expect(users.isEmailVerified(user!.id)).toBe(true);
  });
});

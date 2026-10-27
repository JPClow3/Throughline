// @vitest-environment node
import { describe, expect, it } from "vitest";
import { ensureD1EmailVerificationSchema, type D1Database } from "./d1Store";

function mockDb(options?: { alterFails?: boolean }): D1Database & { execCalls: string[] } {
  const execCalls: string[] = [];
  return {
    execCalls,
    prepare() {
      throw new Error("unused");
    },
    batch: async () => [],
    async exec(query: string) {
      execCalls.push(query);
      if (options?.alterFails && query.includes("ALTER TABLE users ADD COLUMN email_verified_at")) {
        throw new Error("duplicate column name: email_verified_at");
      }
      return { count: 1, duration: 1 };
    }
  };
}

describe("ensureD1EmailVerificationSchema", () => {
  it("adds email_verified_at and creates the tokens table", async () => {
    const db = mockDb();
    await ensureD1EmailVerificationSchema(db);
    expect(db.execCalls[0]).toContain("ALTER TABLE users ADD COLUMN email_verified_at");
    expect(db.execCalls[1]).toContain("CREATE TABLE IF NOT EXISTS email_verification_tokens");
  });

  it("ignores duplicate-column errors so catch-up stays idempotent", async () => {
    const db = mockDb({ alterFails: true });
    await expect(ensureD1EmailVerificationSchema(db)).resolves.toBeUndefined();
    expect(db.execCalls.some((q) => q.includes("email_verification_tokens"))).toBe(true);
  });
});

// @vitest-environment node
import { afterEach, describe, expect, it } from "vitest";
import { consumeAuthRateLimit, resetAuthRateLimits } from "./authRateLimit";

describe("authRateLimit", () => {
  afterEach(() => {
    resetAuthRateLimits();
  });

  it("allows requests under the max then returns 429-shaped denial", () => {
    const request = new Request("http://localhost/auth/signup", {
      headers: { "cf-connecting-ip": "1.2.3.4" }
    });

    for (let i = 0; i < 3; i += 1) {
      expect(consumeAuthRateLimit(request, { max: 3, key: "signup" }).ok).toBe(true);
    }
    const denied = consumeAuthRateLimit(request, { max: 3, key: "signup" });
    expect(denied.ok).toBe(false);
    if (!denied.ok) {
      expect(denied.retryAfterSec).toBeGreaterThan(0);
    }
  });

  it("isolates buckets by key and IP", () => {
    const a = new Request("http://localhost/auth/signup", {
      headers: { "cf-connecting-ip": "1.2.3.4" }
    });
    const b = new Request("http://localhost/auth/signup", {
      headers: { "cf-connecting-ip": "9.9.9.9" }
    });
    expect(consumeAuthRateLimit(a, { max: 1, key: "signup" }).ok).toBe(true);
    expect(consumeAuthRateLimit(a, { max: 1, key: "signup" }).ok).toBe(false);
    expect(consumeAuthRateLimit(b, { max: 1, key: "signup" }).ok).toBe(true);
    expect(consumeAuthRateLimit(a, { max: 1, key: "resend" }).ok).toBe(true);
  });
});

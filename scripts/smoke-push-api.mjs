import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { setTimeout } from "node:timers/promises";

const defaultBaseUrl = "https://throughline.joaopaulo-grv4.workers.dev";

export async function checkProduction({
  baseUrl = defaultBaseUrl,
  request = fetch,
  attempts = 6,
  retryDelayMs = 5_000,
  pause = setTimeout,
} = {}) {
  const base = new URL(baseUrl);
  assert.equal(base.protocol, "https:", "Production smoke requires HTTPS.");
  assert.ok(!base.username && !base.password && !base.search && !base.hash,
    "Production smoke URL must not contain credentials, query parameters or a fragment.");
  const origin = base.href.replace(/\/+$/, "");

  async function check(path, expectedStatus, options = {}) {
    const response = await request(`${origin}${path}`, {
      ...options,
      headers: { Accept: "application/json", ...options.headers },
      credentials: "omit",
      redirect: "error",
      signal: AbortSignal.timeout(15_000),
    });
    assert.equal(response.status, expectedStatus,
      `${options.method || "GET"} ${path}: expected HTTP ${expectedStatus}, received ${response.status}.`);
    return response;
  }

  assert.ok(Number.isSafeInteger(attempts) && attempts > 0, "At least one attempt is required.");
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const response = await check("/health", 200);
      const health = await response.json();
      assert.equal(health.ok, true, "Production database health must be ok.");
      for (const field of ["subscriptions", "reminders"]) {
        assert.ok(Number.isSafeInteger(health[field]) && health[field] >= 0,
          `Production health must include a valid ${field} count.`);
      }
      await check("/auth/me", 401);
      await check("/sync/pull", 401);
      // Read-only lookup of a unique, nonexistent account exercises the users
      // table without creating accounts, sessions, reminders or notifications.
      await check("/auth/salt", 404, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: `release-${randomUUID()}@example.invalid` }),
      });
      const preflight = await check("/health", 204, {
        method: "OPTIONS",
        headers: { Origin: "https://throughline-web.pages.dev", "Access-Control-Request-Method": "GET" },
      });
      assert.equal(preflight.headers.get("Access-Control-Allow-Origin"), "https://throughline-web.pages.dev");
      return { ok: true, baseUrl: origin, checks: 5 };
    } catch (error) {
      if (attempt === attempts) throw error;
      await pause(retryDelayMs);
    }
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  try {
    console.log(JSON.stringify(await checkProduction({ baseUrl: process.env.THROUGHLINE_API_URL || defaultBaseUrl })));
  } catch (error) {
    console.error("Production API smoke failed:", error instanceof Error ? error.message : "Unknown failure");
    process.exitCode = 1;
  }
}

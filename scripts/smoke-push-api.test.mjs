import assert from "node:assert/strict";
import { test } from "node:test";
import { checkProduction } from "./smoke-push-api.mjs";

function healthyResponse(url, options) {
  const path = new URL(url).pathname;
  if (options.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: { "Access-Control-Allow-Origin": "https://throughline-web.pages.dev" } });
  }
  if (path === "/health") {
    return Response.json({ ok: true, subscriptions: 0, reminders: 0, vapidConfigured: false });
  }
  return Response.json({}, { status: path === "/auth/salt" ? 404 : 401 });
}

test("checks database health, private routes, a read-only user lookup and Pages preflight", async () => {
  const calls = [];
  const result = await checkProduction({
    baseUrl: "https://api.example/api/",
    attempts: 1,
    request: async (url, options) => {
      calls.push({ url, options });
      return healthyResponse(url.replace("/api/", "/"), options);
    },
  });
  assert.equal(result.checks, 5);
  assert.deepEqual(calls.map(({ url, options }) => [options.method || "GET", new URL(url).pathname]), [
    ["GET", "/api/health"], ["GET", "/api/auth/me"], ["GET", "/api/sync/pull"],
    ["POST", "/api/auth/salt"], ["OPTIONS", "/api/health"],
  ]);
  assert.ok(calls.every(({ options }) => options.credentials === "omit" && options.redirect === "error"));
  assert.match(JSON.parse(calls[3].options.body).email, /^release-[a-f0-9-]+@example\.invalid$/);
});

test("rejects HTTP 500 instead of accepting a completed deployment", async () => {
  await assert.rejects(checkProduction({ attempts: 1, request: async () => Response.json({}, { status: 500 }) }), /received 500/);
});

test("rejects a nominal HTTP 200 with unavailable database health or invalid counters", async () => {
  for (const body of [
    { ok: false, subscriptions: 0, reminders: 0 },
    { ok: true, subscriptions: -1, reminders: 0 },
    { ok: true, subscriptions: 0, reminders: "0" },
  ]) {
    await assert.rejects(checkProduction({ attempts: 1, request: async () => Response.json(body) }));
  }
});

test("rejects an unauthenticated private endpoint returning success", async () => {
  await assert.rejects(checkProduction({
    attempts: 1,
    request: async (url, options) => new URL(url).pathname === "/auth/me"
      ? Response.json({}) : healthyResponse(url, options),
  }), /GET \/auth\/me: expected HTTP 401/);
});

test("retries transient failures while a deployment propagates", async () => {
  let attempts = 0;
  let pauses = 0;
  const result = await checkProduction({
    attempts: 2,
    pause: async () => { pauses++; },
    request: async (url, options) => {
      if (new URL(url).pathname === "/health" && options.method !== "OPTIONS" && ++attempts === 1) {
        return Response.json({}, { status: 503 });
      }
      return healthyResponse(url, options);
    },
  });
  assert.equal(result.ok, true);
  assert.equal(pauses, 1);
});

test("rejects credential-bearing base URLs before making requests", async () => {
  let called = false;
  await assert.rejects(checkProduction({
    baseUrl: "https://user:password@api.example/",
    request: async () => { called = true; return Response.json({}); },
  }), /must not contain credentials/);
  assert.equal(called, false);
});

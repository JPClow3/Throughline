// @vitest-environment node
import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PushApiConfig } from "./config";
import { createServer } from "./server";
import { fakeReminder, fakeSubscription } from "./test-helpers";
import { JsonPushStore } from "./store";

let directory: string;
let config: PushApiConfig;
let store: JsonPushStore;

beforeEach(async () => {
  directory = await mkdtemp(join(tmpdir(), "liquidglass-push-api-"));
  config = {
    host: "127.0.0.1",
    port: 0,
    storePath: join(directory, "push-store.json"),
    dbPath: ":memory:"
  };
  store = new JsonPushStore(config.storePath);
});

afterEach(async () => {
  await rm(directory, { recursive: true, force: true });
});

describe("push API", () => {
  it("reports health and creates subscriptions", async () => {
    const app = await createServer({ config, store, configureWebPush: false });
    const health = await app.inject({ method: "GET", url: "/health" });
    const created = await app.inject({ method: "POST", url: "/subscriptions", payload: fakeSubscription() });

    expect(health.statusCode).toBe(200);
    expect(health.json()).toMatchObject({ ok: true, vapidConfigured: false });
    expect(created.statusCode).toBe(201);
    expect(created.json().endpointHash).toHaveLength(64);

    await app.close();
  });

  it("bulk replaces reminders by endpoint hash", async () => {
    const app = await createServer({ config, store, configureWebPush: false });
    const created = await app.inject({ method: "POST", url: "/subscriptions", payload: fakeSubscription() });
    const endpointHash = created.json().endpointHash as string;
    const synced = await app.inject({
      method: "PUT",
      url: `/subscriptions/${endpointHash}/reminders`,
      payload: { reminders: [fakeReminder()] }
    });

    expect(synced.statusCode).toBe(200);
    expect(synced.json()).toEqual({ endpointHash, reminderCount: 1 });
    expect(await store.counts()).toEqual({ subscriptions: 1, reminders: 1 });

    await app.close();
  });

  it("deletes subscriptions and their reminders", async () => {
    const app = await createServer({ config, store, configureWebPush: false });
    const created = await app.inject({ method: "POST", url: "/subscriptions", payload: fakeSubscription() });
    const endpointHash = created.json().endpointHash as string;
    await app.inject({
      method: "PUT",
      url: `/subscriptions/${endpointHash}/reminders`,
      payload: { reminders: [fakeReminder()] }
    });
    const deleted = await app.inject({ method: "DELETE", url: `/subscriptions/${endpointHash}` });

    expect(deleted.statusCode).toBe(204);
    expect(await store.counts()).toEqual({ subscriptions: 0, reminders: 0 });

    await app.close();
  });

  it("keeps dispatch unavailable without VAPID configuration", async () => {
    const app = await createServer({ config, store, configureWebPush: false });
    const response = await app.inject({ method: "POST", url: "/dispatch-due" });

    expect(response.statusCode).toBe(503);
    expect(response.json()).toEqual({ sent: 0, skipped: "missing-vapid" });

    await app.close();
  });

  it("accepts a body-less form-encoded dispatch (cron style)", async () => {
    const app = await createServer({
      config: {
        ...config,
        vapidPublicKey: "public",
        vapidPrivateKey: "private",
        vapidSubject: "mailto:test@example.com"
      },
      store,
      configureWebPush: false,
      sendNotification: vi.fn().mockResolvedValue(undefined)
    });

    const response = await app.inject({
      method: "POST",
      url: "/dispatch-due",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      payload: ""
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ sent: 0 });

    await app.close();
  });

  it("rate limits once the per-window cap is exceeded", async () => {
    const app = await createServer({ config: { ...config, rateLimitMax: 2 }, store, configureWebPush: false });

    const ip = "203.0.113.7";
    const first = await app.inject({ method: "GET", url: "/health", remoteAddress: ip });
    const second = await app.inject({ method: "GET", url: "/health", remoteAddress: ip });
    const third = await app.inject({ method: "GET", url: "/health", remoteAddress: ip });

    expect(first.statusCode).toBe(200);
    expect(second.statusCode).toBe(200);
    expect(third.statusCode).toBe(429);

    await app.close();
  });

  it("guards dispatch with a bearer token when configured", async () => {
    const sendNotification = vi.fn().mockResolvedValue(undefined);
    const app = await createServer({
      config: {
        ...config,
        vapidPublicKey: "public",
        vapidPrivateKey: "private",
        vapidSubject: "mailto:test@example.com",
        dispatchToken: "secret-token"
      },
      store,
      configureWebPush: false,
      sendNotification
    });

    const unauthorized = await app.inject({ method: "POST", url: "/dispatch-due" });
    expect(unauthorized.statusCode).toBe(401);

    const authorized = await app.inject({
      method: "POST",
      url: "/dispatch-due",
      headers: { authorization: "Bearer secret-token" }
    });
    expect(authorized.statusCode).toBe(200);
    expect(authorized.json()).toEqual({ sent: 0 });

    await app.close();
  });

  it("dispatches due reminders and marks them sent", async () => {
    const sendNotification = vi.fn().mockResolvedValue(undefined);
    const app = await createServer({
      config: {
        ...config,
        vapidPublicKey: "public",
        vapidPrivateKey: "private",
        vapidSubject: "mailto:test@example.com"
      },
      store,
      configureWebPush: false,
      sendNotification
    });
    const created = await app.inject({ method: "POST", url: "/subscriptions", payload: fakeSubscription() });
    const endpointHash = created.json().endpointHash as string;
    await app.inject({
      method: "PUT",
      url: `/subscriptions/${endpointHash}/reminders`,
      payload: { reminders: [fakeReminder({ notifyAt: "2020-01-01T00:00:00.000Z" })] }
    });

    const first = await app.inject({ method: "POST", url: "/dispatch-due" });
    const second = await app.inject({ method: "POST", url: "/dispatch-due" });

    expect(first.json()).toEqual({ sent: 1 });
    expect(second.json()).toEqual({ sent: 0 });
    expect(sendNotification).toHaveBeenCalledTimes(1);

    await app.close();
  });
});

describe("auth", () => {
  const account = { email: "user@example.com", salt: "salt-blob", authKey: "auth-blob", wrappedDek: "wrapped-blob" };

  function cookieFrom(response: { cookies: Array<{ name: string; value: string }> }) {
    return response.cookies.find((c) => c.name === "tl_session")?.value;
  }

  it("signs up, authenticates the session, and logs out", async () => {
    const app = await createServer({ config, store, configureWebPush: false });

    const signup = await app.inject({ method: "POST", url: "/auth/signup", payload: account });
    expect(signup.statusCode).toBe(201);
    expect(signup.json()).toEqual({ email: account.email });
    const token = cookieFrom(signup);
    expect(token).toBeTruthy();

    const me = await app.inject({ method: "GET", url: "/auth/me", cookies: { tl_session: token! } });
    expect(me.statusCode).toBe(200);
    expect(me.json()).toEqual({ email: account.email });

    const meAnon = await app.inject({ method: "GET", url: "/auth/me" });
    expect(meAnon.statusCode).toBe(401);

    const logout = await app.inject({ method: "POST", url: "/auth/logout", cookies: { tl_session: token! } });
    expect(logout.statusCode).toBe(204);
    const meAfter = await app.inject({ method: "GET", url: "/auth/me", cookies: { tl_session: token! } });
    expect(meAfter.statusCode).toBe(401);

    await app.close();
  });

  it("rejects duplicate signup and returns salt + wrappedDek on login", async () => {
    const app = await createServer({ config, store, configureWebPush: false });
    await app.inject({ method: "POST", url: "/auth/signup", payload: account });

    const dup = await app.inject({ method: "POST", url: "/auth/signup", payload: account });
    expect(dup.statusCode).toBe(409);

    const salt = await app.inject({ method: "POST", url: "/auth/salt", payload: { email: account.email } });
    expect(salt.json()).toEqual({ salt: account.salt });

    const login = await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: { email: account.email, authKey: account.authKey }
    });
    expect(login.statusCode).toBe(200);
    expect(login.json()).toEqual({ email: account.email, salt: account.salt, wrappedDek: account.wrappedDek });

    const bad = await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: { email: account.email, authKey: "wrong" }
    });
    expect(bad.statusCode).toBe(401);

    await app.close();
  });
});

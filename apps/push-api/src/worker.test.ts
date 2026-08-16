import { DatabaseSync } from "node:sqlite";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it, vi } from "vitest";
import webpush from "web-push";
import { D1Database, D1PreparedStatement, D1PushStore } from "./d1Store";
import { dispatchDueReminders, handleRequest, SESSION_COOKIE, WorkerEnv } from "./worker";

function createTestD1(): D1Database {
  const db = new DatabaseSync(":memory:");
  const migrationSql = readFileSync(resolve(__dirname, "../migrations/0001_initial.sql"), "utf8");
  db.exec(migrationSql);

  const makeStmt = (query: string, params: unknown[] = []): D1PreparedStatement => ({
    bind(...values: unknown[]) {
      return makeStmt(query, values);
    },
    async first<T = Record<string, unknown>>(colName?: string): Promise<T | null> {
      const stmt = db.prepare(query);
      const row = stmt.get(...(params as (string | number | bigint | null | Uint8Array | Buffer)[])) as Record<string, unknown> | undefined;
      if (!row) return null;
      if (colName) return (row[colName] as T) ?? null;
      return row as T;
    },
    async all<T = Record<string, unknown>>(): Promise<{ results: T[]; success: boolean }> {
      const stmt = db.prepare(query);
      const results = stmt.all(...(params as (string | number | bigint | null | Uint8Array | Buffer)[])) as T[];
      return { results, success: true };
    },
    async run(): Promise<{ success: boolean }> {
      const stmt = db.prepare(query);
      stmt.run(...(params as (string | number | bigint | null | Uint8Array | Buffer)[]));
      return { success: true };
    }
  });

  return {
    prepare(query: string) {
      return makeStmt(query);
    },
    async batch<T = unknown>(statements: D1PreparedStatement[]) {
      const results: { results?: T[]; success: boolean }[] = [];
      for (const s of statements) {
        await s.run();
        results.push({ success: true });
      }
      return results;
    },
    async exec(query: string) {
      db.exec(query);
      return { count: 1, duration: 0 };
    }
  };
}

describe("Cloudflare Worker API", () => {
  const env: WorkerEnv = {
    DB: createTestD1() as unknown as D1Database,
    COOKIE_SECURE: "false",
    VAPID_PUBLIC_KEY: "test-pub-key",
    VAPID_PRIVATE_KEY: "test-priv-key",
    VAPID_SUBJECT: "mailto:test@example.com"
  };

  it("handles GET /health and CORS preflight", async () => {
    const corsRes = await handleRequest(
      new Request("http://localhost/health", {
        method: "OPTIONS",
        headers: { Origin: "http://localhost:5173" }
      }),
      env
    );
    expect(corsRes.status).toBe(204);
    expect(corsRes.headers.get("Access-Control-Allow-Origin")).toBe("http://localhost:5173");

    const healthRes = await handleRequest(
      new Request("http://localhost/health", { method: "GET" }),
      env
    );
    expect(healthRes.status).toBe(200);
    const health = await healthRes.json() as { ok: boolean; subscriptions: number; reminders: number };
    expect(health.ok).toBe(true);
    expect(health.subscriptions).toBe(0);
    expect(health.reminders).toBe(0);
  });

  it("manages push subscriptions and reminders", async () => {
    const subBody = {
      endpoint: "https://push.example.com/sub/123",
      keys: {
        p256dh: "BLc4...",
        auth: "5K4..."
      }
    };

    const subRes = await handleRequest(
      new Request("http://localhost/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subBody)
      }),
      env
    );
    expect(subRes.status).toBe(201);
    const { endpointHash } = await subRes.json() as { endpointHash: string };
    expect(endpointHash).toBeDefined();

    // Create a reminder
    const now = new Date().toISOString();
    const reminderRes = await handleRequest(
      new Request("http://localhost/reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscriptionEndpoint: subBody.endpoint,
          reminder: {
            reminderId: "rem_1",
            taskId: "task_1",
            notifyAt: new Date(Date.now() + 60000).toISOString(),
            urgency: "normal",
            title: "Quest reminder",
            body: "A study quest needs your attention.",
            createdAt: now
          }
        })
      }),
      env
    );
    expect(reminderRes.status).toBe(201);

    // Bulk replace reminders
    const replaceRes = await handleRequest(
      new Request(`http://localhost/subscriptions/${endpointHash}/reminders`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reminders: [
            {
              reminderId: "rem_2",
              taskId: "task_2",
              notifyAt: new Date(Date.now() + 120000).toISOString(),
              urgency: "high",
              title: "Quest reminder",
              body: "A study quest needs your attention.",
              createdAt: now
            }
          ]
        })
      }),
      env
    );
    expect(replaceRes.status).toBe(200);
    const replaceData = await replaceRes.json() as { reminderCount: number };
    expect(replaceData.reminderCount).toBe(1);

    // Delete subscription
    const delRes = await handleRequest(
      new Request(`http://localhost/subscriptions/${endpointHash}`, { method: "DELETE" }),
      env
    );
    expect(delRes.status).toBe(204);
  });

  it("handles auth signup, login, logout, password change and recovery key rotation", async () => {
    const signupData = {
      email: "student@example.com",
      salt: "salt_123",
      authKey: "auth_key_123",
      wrappedDek: "wrapped_dek_123",
      recoveryAuthKey: "recovery_auth_123",
      recoveryWrappedDek: "recovery_dek_123"
    };

    // Signup
    const signupRes = await handleRequest(
      new Request("http://localhost/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(signupData)
      }),
      env
    );
    expect(signupRes.status).toBe(201);
    const cookieHeader = signupRes.headers.get("Set-Cookie");
    expect(cookieHeader).toContain(SESSION_COOKIE);
    const sessionToken = cookieHeader?.match(new RegExp(`${SESSION_COOKIE}=([^;]+)`))?.[1];

    // Auth Me
    const meRes = await handleRequest(
      new Request("http://localhost/auth/me", {
        headers: { Cookie: `${SESSION_COOKIE}=${sessionToken}` }
      }),
      env
    );
    expect(meRes.status).toBe(200);
    const me = await meRes.json() as { email: string };
    expect(me.email).toBe("student@example.com");

    // Fetch Salt
    const saltRes = await handleRequest(
      new Request("http://localhost/auth/salt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "student@example.com" })
      }),
      env
    );
    expect(saltRes.status).toBe(200);
    const { salt } = await saltRes.json() as { salt: string };
    expect(salt).toBe("salt_123");

    // Login with password authKey
    const loginRes = await handleRequest(
      new Request("http://localhost/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "student@example.com", authKey: "auth_key_123" })
      }),
      env
    );
    expect(loginRes.status).toBe(200);
    const loginData = await loginRes.json() as { wrappedDek: string };
    expect(loginData.wrappedDek).toBe("wrapped_dek_123");

    // Login with recovery authKey
    const recoveryLoginRes = await handleRequest(
      new Request("http://localhost/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "student@example.com", authKey: "recovery_auth_123" })
      }),
      env
    );
    expect(recoveryLoginRes.status).toBe(200);
    const recData = await recoveryLoginRes.json() as { wrappedDek: string };
    expect(recData.wrappedDek).toBe("recovery_dek_123");

    // Update password
    const updatePwRes = await handleRequest(
      new Request("http://localhost/auth/update-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `${SESSION_COOKIE}=${sessionToken}`
        },
        body: JSON.stringify({ authKey: "new_auth_key", wrappedDek: "new_wrapped_dek" })
      }),
      env
    );
    expect(updatePwRes.status).toBe(204);

    // Update recovery key
    const updateRecRes = await handleRequest(
      new Request("http://localhost/auth/update-recovery-key", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `${SESSION_COOKIE}=${sessionToken}`
        },
        body: JSON.stringify({ recoveryAuthKey: "new_rec_auth", recoveryWrappedDek: "new_rec_dek" })
      }),
      env
    );
    expect(updateRecRes.status).toBe(204);

    // Logout
    const logoutRes = await handleRequest(
      new Request("http://localhost/auth/logout", {
        method: "POST",
        headers: { Cookie: `${SESSION_COOKIE}=${sessionToken}` }
      }),
      env
    );
    expect(logoutRes.status).toBe(204);
  });

  it("handles E2EE encrypted sync push and pull", async () => {
    // Signup user
    const signupRes = await handleRequest(
      new Request("http://localhost/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "sync_user@example.com",
          salt: "s1",
          authKey: "k1",
          wrappedDek: "w1",
          recoveryAuthKey: "r1",
          recoveryWrappedDek: "rw1"
        })
      }),
      env
    );
    const cookieHeader = signupRes.headers.get("Set-Cookie");
    const sessionToken = cookieHeader?.match(new RegExp(`${SESSION_COOKIE}=([^;]+)`))?.[1];

    const changeTime = new Date().toISOString();

    // Push encrypted records
    const pushRes = await handleRequest(
      new Request("http://localhost/sync/push", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `${SESSION_COOKIE}=${sessionToken}`
        },
        body: JSON.stringify({
          changes: [
            {
              entity: "task",
              id: "task_100",
              changedAt: changeTime,
              deleted: false,
              ciphertext: "AES_GCM_CIPHERTEXT_BASE64",
              iv: "AES_IV_BASE64"
            }
          ]
        })
      }),
      env
    );
    expect(pushRes.status).toBe(200);
    const pushData = await pushRes.json() as { applied: number; cursor: string };
    expect(pushData.applied).toBe(1);
    expect(pushData.cursor).toBe(changeTime);

    // Pull encrypted records
    const pullRes = await handleRequest(
      new Request("http://localhost/sync/pull", {
        headers: { Cookie: `${SESSION_COOKIE}=${sessionToken}` }
      }),
      env
    );
    expect(pullRes.status).toBe(200);
    const pullData = await pullRes.json() as {
      changes: { entity: string; id: string; ciphertext?: string; iv?: string }[];
      cursor: string;
    };
    expect(pullData.changes.length).toBe(1);
    expect(pullData.changes[0].id).toBe("task_100");
    expect(pullData.changes[0].ciphertext).toBe("AES_GCM_CIPHERTEXT_BASE64");
  });

  it("handles dispatch-due authentication and missing VAPID", async () => {
    const authEnv: WorkerEnv = {
      ...env,
      DISPATCH_TOKEN: "secret-token",
      VAPID_PUBLIC_KEY: undefined
    };

    // Unauthorized without token
    const unauthRes = await handleRequest(
      new Request("http://localhost/dispatch-due", { method: "POST" }),
      authEnv
    );
    expect(unauthRes.status).toBe(401);

    // Missing VAPID returns 503
    const missingVapidRes = await handleRequest(
      new Request("http://localhost/dispatch-due", {
        method: "POST",
        headers: { Authorization: "Bearer secret-token" }
      }),
      authEnv
    );
    expect(missingVapidRes.status).toBe(503);
    const body = await missingVapidRes.json() as { skipped: string };
    expect(body.skipped).toBe("missing-vapid");
  });

  it("handles auth edge cases and unauthenticated requests", async () => {
    // Unknown salt
    const unknownSaltRes = await handleRequest(
      new Request("http://localhost/auth/salt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "nonexistent@example.com" })
      }),
      env
    );
    expect(unknownSaltRes.status).toBe(404);

    // Invalid login credentials
    const invalidLoginRes = await handleRequest(
      new Request("http://localhost/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "nonexistent@example.com", authKey: "bad_key" })
      }),
      env
    );
    expect(invalidLoginRes.status).toBe(401);

    // Unauthenticated /auth/me
    const unauthMeRes = await handleRequest(
      new Request("http://localhost/auth/me", { method: "GET" }),
      env
    );
    expect(unauthMeRes.status).toBe(401);

    // Unauthenticated sync pull
    const unauthPullRes = await handleRequest(
      new Request("http://localhost/sync/pull", { method: "GET" }),
      env
    );
    expect(unauthPullRes.status).toBe(401);

    // Unauthenticated sync push
    const unauthPushRes = await handleRequest(
      new Request("http://localhost/sync/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ changes: [] })
      }),
      env
    );
    expect(unauthPushRes.status).toBe(401);

    // 404 Route
    const notFoundRes = await handleRequest(
      new Request("http://localhost/nonexistent-route", { method: "GET" }),
      env
    );
    expect(notFoundRes.status).toBe(404);
  });

  it("preserves createdAt and dueAt timestamps in D1PushStore", async () => {
    const db = createTestD1();
    const store = new D1PushStore(db);
    const subBody = {
      endpoint: "https://push.example.com/sub/preserve-time",
      keys: {
        p256dh: "BLc4...",
        auth: "5K4..."
      }
    };
    const endpointHash = await store.upsertSubscription(subBody);

    const originalCreatedAt = "2026-01-01T12:00:00.000Z";
    const originalDueAt = "2026-01-05T18:00:00.000Z";
    const notifyAt = "2026-01-02T10:00:00.000Z";

    await store.saveReminder(subBody.endpoint, {
      reminderId: "rem_preserve_1",
      taskId: "task_preserve_1",
      notifyAt,
      dueAt: originalDueAt,
      urgency: "high",
      title: "Quest reminder",
      body: "A study quest needs your attention.",
      createdAt: originalCreatedAt
    });

    const dueList = await store.dueReminders(new Date("2026-01-03T00:00:00.000Z"));
    expect(dueList).toHaveLength(1);
    expect(dueList[0].createdAt).toBe(originalCreatedAt);
    expect(dueList[0].dueAt).toBe(originalDueAt);

    // Also verify replaceReminders preserves createdAt and dueAt
    const replacedCreatedAt = "2026-01-01T08:00:00.000Z";
    const replacedDueAt = "2026-01-04T12:00:00.000Z";
    await store.replaceReminders(endpointHash, [
      {
        reminderId: "rem_preserve_2",
        taskId: "task_preserve_2",
        notifyAt,
        dueAt: replacedDueAt,
        urgency: "critical",
        title: "Quest reminder",
        body: "A study quest needs your attention.",
        createdAt: replacedCreatedAt
      }
    ]);

    const dueReplaced = await store.dueReminders(new Date("2026-01-03T00:00:00.000Z"));
    expect(dueReplaced).toHaveLength(1);
    expect(dueReplaced[0].reminderId).toBe("rem_preserve_2");
    expect(dueReplaced[0].createdAt).toBe(replacedCreatedAt);
    expect(dueReplaced[0].dueAt).toBe(replacedDueAt);
  });

  it("retains reminders for retry upon transient push errors, and unsubscribes on 410 Gone", async () => {
    const db = createTestD1();
    const testEnv: WorkerEnv = {
      DB: db,
      COOKIE_SECURE: "false",
      VAPID_PUBLIC_KEY: "test-pub-key",
      VAPID_PRIVATE_KEY: "test-priv-key",
      VAPID_SUBJECT: "mailto:test@example.com"
    };

    const store = new D1PushStore(db);
    const subBody = {
      endpoint: "https://push.example.com/sub/retry-test",
      keys: {
        p256dh: "BLc4...",
        auth: "5K4..."
      }
    };
    const endpointHash = await store.upsertSubscription(subBody);

    await store.saveReminder(subBody.endpoint, {
      reminderId: "rem_retry_1",
      taskId: "task_retry_1",
      notifyAt: "2020-01-01T00:00:00.000Z",
      urgency: "normal",
      title: "Quest reminder",
      body: "A study quest needs your attention.",
      createdAt: "2020-01-01T00:00:00.000Z"
    });

    const vapidSpy = vi.spyOn(webpush, "setVapidDetails").mockImplementation(() => {});
    // 1. Transient failure (503 Service Unavailable): reminder should NOT be marked as dispatched
    const sendSpy = vi.spyOn(webpush, "sendNotification").mockRejectedValueOnce({
      statusCode: 503,
      message: "Push service overloaded"
    });

    const dispatchResult1 = await dispatchDueReminders(testEnv);
    expect(dispatchResult1.sent).toBe(0);

    const remainingDue = await store.dueReminders(new Date());
    expect(remainingDue).toHaveLength(1);
    expect(remainingDue[0].reminderId).toBe("rem_retry_1");

    // 2. Unregistered / Gone (410): subscription and its reminders should be removed
    sendSpy.mockRejectedValueOnce({
      statusCode: 410,
      message: "Subscription gone"
    });

    const dispatchResult2 = await dispatchDueReminders(testEnv);
    expect(dispatchResult2.sent).toBe(0);

    expect(await store.subscriptionFor(endpointHash)).toBeUndefined();
    expect(await store.dueReminders(new Date())).toHaveLength(0);

    sendSpy.mockRestore();
    vapidSpy.mockRestore();
  });
});

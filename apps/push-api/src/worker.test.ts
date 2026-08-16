import { DatabaseSync } from "node:sqlite";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it, vi } from "vitest";
import type { Sql } from "postgres";
import webpush from "web-push";
import { PostgresPushStore } from "./postgresStore";
import { dispatchDueReminders, handleRequest, SESSION_COOKIE, WorkerEnv } from "./worker";

function createTestSql(): Sql {
  const db = new DatabaseSync(":memory:");
  const migrationSql = readFileSync(resolve(__dirname, "../migrations/0001_initial.sql"), "utf8");
  db.exec(migrationSql);

  const sqlFn = (strings: TemplateStringsArray, ...values: unknown[]) => {
    let query = "";
    for (let i = 0; i < strings.length; i++) {
      query += strings[i];
      if (i < values.length) {
        query += "?";
      }
    }
    const stmt = db.prepare(query);
    const trimmed = query.trim().toUpperCase();
    if (trimmed.startsWith("SELECT") || trimmed.startsWith("WITH")) {
      const results = stmt.all(...(values as (string | number | bigint | null | Uint8Array | Buffer)[]));
      return Promise.resolve(results);
    } else {
      stmt.run(...(values as (string | number | bigint | null | Uint8Array | Buffer)[]));
      return Promise.resolve([]);
    }
  };

  return sqlFn as unknown as Sql;
}

describe("Cloudflare Worker API (PostgreSQL / Neon)", () => {
  const env: WorkerEnv = {
    SQL: createTestSql(),
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

    // Health count should reflect 1 subscription
    const healthRes1 = await handleRequest(new Request("http://localhost/health"), env);
    const health1 = await healthRes1.json() as { subscriptions: number };
    expect(health1.subscriptions).toBe(1);

    // Save reminder
    const remRes = await handleRequest(
      new Request("http://localhost/reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscriptionEndpoint: subBody.endpoint,
          reminder: {
            reminderId: "rem_1",
            taskId: "task_1",
            notifyAt: "2026-02-15T09:00:00.000Z",
            urgency: "high",
            title: "Quest reminder",
            body: "A study quest needs your attention.",
            createdAt: "2026-02-14T09:00:00.000Z"
          }
        })
      }),
      env
    );
    expect(remRes.status).toBe(201);

    // Bulk replace reminders
    const bulkRes = await handleRequest(
      new Request(`http://localhost/subscriptions/${endpointHash}/reminders`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reminders: [
            {
              reminderId: "rem_2",
              taskId: "task_2",
              notifyAt: "2026-02-15T10:00:00.000Z",
              urgency: "normal",
              title: "Quest reminder",
              body: "A study quest needs your attention.",
              createdAt: "2026-02-14T09:00:00.000Z"
            }
          ]
        })
      }),
      env
    );
    expect(bulkRes.status).toBe(200);
    const bulk = await bulkRes.json() as { count: number };
    expect(bulk.count).toBe(1);

    // Delete subscription
    const delRes = await handleRequest(
      new Request(`http://localhost/subscriptions/${endpointHash}`, { method: "DELETE" }),
      env
    );
    expect(delRes.status).toBe(204);

    // Health counts should be 0
    const healthRes2 = await handleRequest(new Request("http://localhost/health"), env);
    const health2 = await healthRes2.json() as { subscriptions: number; reminders: number };
    expect(health2.subscriptions).toBe(0);
    expect(health2.reminders).toBe(0);
  });

  it("handles auth signup, login, logout, password change and recovery key rotation", async () => {
    const signupData = {
      email: "student@example.com",
      salt: "salt_abc123",
      authKey: "authKey_secret",
      wrappedDek: "wrappedDek_payload",
      recoveryAuthKey: "recovery_authKey_secret",
      recoveryWrappedDek: "recovery_wrappedDek_payload"
    };

    // 1. Signup
    const signupRes = await handleRequest(
      new Request("http://localhost/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(signupData)
      }),
      env
    );
    expect(signupRes.status).toBe(201);
    const cookie = signupRes.headers.get("Set-Cookie");
    expect(cookie).toContain(SESSION_COOKIE);
    const { userId, email } = await signupRes.json() as { userId: string; email: string };
    expect(userId).toBeDefined();
    expect(email).toBe("student@example.com");

    // Duplicate signup should fail with 409
    const dupRes = await handleRequest(
      new Request("http://localhost/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(signupData)
      }),
      env
    );
    expect(dupRes.status).toBe(409);

    // 2. Fetch salt
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
    expect(salt).toBe("salt_abc123");

    // Salt for non-existent email returns 404
    const noSaltRes = await handleRequest(
      new Request("http://localhost/auth/salt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "unknown@example.com" })
      }),
      env
    );
    expect(noSaltRes.status).toBe(404);

    // 3. Login with correct authKey
    const loginRes = await handleRequest(
      new Request("http://localhost/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "student@example.com", authKey: "authKey_secret" })
      }),
      env
    );
    expect(loginRes.status).toBe(200);
    const loginData = await loginRes.json() as { userId: string; salt: string; wrappedDek: string };
    expect(loginData.userId).toBe(userId);
    expect(loginData.salt).toBe("salt_abc123");
    expect(loginData.wrappedDek).toBe("wrappedDek_payload");

    // Login with invalid credentials returns 401
    const badLoginRes = await handleRequest(
      new Request("http://localhost/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "student@example.com", authKey: "wrong_key" })
      }),
      env
    );
    expect(badLoginRes.status).toBe(401);

    // 4. GET /auth/me with session cookie
    const token = cookie?.split(";")[0];
    const meRes = await handleRequest(
      new Request("http://localhost/auth/me", {
        headers: { Cookie: token || "" }
      }),
      env
    );
    expect(meRes.status).toBe(200);
    const me = await meRes.json() as { userId: string; email: string };
    expect(me.userId).toBe(userId);

    // GET /auth/me without session cookie returns 401
    const unauthMe = await handleRequest(new Request("http://localhost/auth/me"), env);
    expect(unauthMe.status).toBe(401);

    // 5. Update Password
    const updatePassRes = await handleRequest(
      new Request("http://localhost/auth/update-password", {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: token || "" },
        body: JSON.stringify({ authKey: "new_authKey", wrappedDek: "new_wrappedDek" })
      }),
      env
    );
    expect(updatePassRes.status).toBe(204);

    // Old password should now fail
    const oldLogin = await handleRequest(
      new Request("http://localhost/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "student@example.com", authKey: "authKey_secret" })
      }),
      env
    );
    expect(oldLogin.status).toBe(401);

    // New password succeeds
    const newLogin = await handleRequest(
      new Request("http://localhost/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "student@example.com", authKey: "new_authKey" })
      }),
      env
    );
    expect(newLogin.status).toBe(200);

    // 6. Update Recovery Key
    const updateRecRes = await handleRequest(
      new Request("http://localhost/auth/update-recovery-key", {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: token || "" },
        body: JSON.stringify({
          recoveryAuthKey: "new_rec_authKey",
          recoveryWrappedDek: "new_rec_wrappedDek"
        })
      }),
      env
    );
    expect(updateRecRes.status).toBe(204);

    // Recovery login with updated recovery key works
    const recLogin = await handleRequest(
      new Request("http://localhost/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "student@example.com", authKey: "new_rec_authKey" })
      }),
      env
    );
    expect(recLogin.status).toBe(200);
    const recData = await recLogin.json() as { wrappedDek: string };
    expect(recData.wrappedDek).toBe("new_rec_wrappedDek");

    // 7. Logout
    const logoutRes = await handleRequest(
      new Request("http://localhost/auth/logout", {
        method: "POST",
        headers: { Cookie: token || "" }
      }),
      env
    );
    expect(logoutRes.status).toBe(204);

    // Session is now invalidated
    const postLogoutMe = await handleRequest(
      new Request("http://localhost/auth/me", {
        headers: { Cookie: token || "" }
      }),
      env
    );
    expect(postLogoutMe.status).toBe(401);
  });

  it("handles E2EE encrypted sync (pull and push)", async () => {
    // Signup user
    const signupRes = await handleRequest(
      new Request("http://localhost/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "sync_user@example.com",
          salt: "salt_sync",
          authKey: "sync_key",
          wrappedDek: "wrappedDek_sync",
          recoveryAuthKey: "rec_key",
          recoveryWrappedDek: "rec_wrapped"
        })
      }),
      env
    );
    const cookie = signupRes.headers.get("Set-Cookie")?.split(";")[0] || "";

    // 1. Initial pull (empty)
    const pull1 = await handleRequest(
      new Request("http://localhost/sync/pull", { headers: { Cookie: cookie } }),
      env
    );
    expect(pull1.status).toBe(200);
    const pullData1 = await pull1.json() as { changes: unknown[]; cursor: string };
    expect(pullData1.changes).toHaveLength(0);

    // 2. Push 2 changes
    const pushRes = await handleRequest(
      new Request("http://localhost/sync/push", {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: cookie },
        body: JSON.stringify({
          changes: [
            {
              entity: "task",
              id: "task_100",
              changedAt: "2026-02-14T10:00:00.000Z",
              deleted: false,
              ciphertext: "enc_task_data_1",
              iv: "iv_1"
            },
            {
              entity: "course",
              id: "course_1",
              changedAt: "2026-02-14T10:01:00.000Z",
              deleted: false,
              ciphertext: "enc_course_data_1",
              iv: "iv_2"
            }
          ]
        })
      }),
      env
    );
    expect(pushRes.status).toBe(200);
    const pushData = await pushRes.json() as { applied: number; cursor: string };
    expect(pushData.applied).toBe(2);

    // 3. Pull changes
    const pull2 = await handleRequest(
      new Request("http://localhost/sync/pull", { headers: { Cookie: cookie } }),
      env
    );
    const pullData2 = await pull2.json() as { changes: Array<{ id: string; ciphertext: string }>; cursor: string };
    expect(pullData2.changes).toHaveLength(2);
    expect(pullData2.changes[0].id).toBe("task_100");
    expect(pullData2.changes[0].ciphertext).toBe("enc_task_data_1");

    // 4. Incremental pull using cursor
    const pull3 = await handleRequest(
      new Request(`http://localhost/sync/pull?since=${encodeURIComponent("2026-02-14T10:00:00.000Z")}`, {
        headers: { Cookie: cookie }
      }),
      env
    );
    const pullData3 = await pull3.json() as { changes: Array<{ id: string }> };
    expect(pullData3.changes).toHaveLength(1);
    expect(pullData3.changes[0].id).toBe("course_1");
  });

  it("handles dispatch-due with DISPATCH_TOKEN protection", async () => {
    const vapidSpy = vi.spyOn(webpush, "setVapidDetails").mockImplementation(() => {});
    const protectedEnv: WorkerEnv = {
      ...env,
      DISPATCH_TOKEN: "secret_cron_token"
    };

    // Unauthorized call returns 401
    const unauthRes = await handleRequest(
      new Request("http://localhost/dispatch-due", { method: "POST" }),
      protectedEnv
    );
    expect(unauthRes.status).toBe(401);

    // Authorized call with Bearer token succeeds
    const authRes = await handleRequest(
      new Request("http://localhost/dispatch-due", {
        method: "POST",
        headers: { Authorization: "Bearer secret_cron_token" }
      }),
      protectedEnv
    );
    expect(authRes.status).toBe(200);
    vapidSpy.mockRestore();
  });

  it("returns 404 for unknown endpoints", async () => {
    const notFoundRes = await handleRequest(
      new Request("http://localhost/nonexistent-route", { method: "GET" }),
      env
    );
    expect(notFoundRes.status).toBe(404);
  });

  it("preserves createdAt and dueAt timestamps in PostgresPushStore", async () => {
    const sql = createTestSql();
    const store = new PostgresPushStore(sql);
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
    const sql = createTestSql();
    const testEnv: WorkerEnv = {
      SQL: sql,
      COOKIE_SECURE: "false",
      VAPID_PUBLIC_KEY: "test-pub-key",
      VAPID_PRIVATE_KEY: "test-priv-key",
      VAPID_SUBJECT: "mailto:test@example.com"
    };

    const store = new PostgresPushStore(sql);
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

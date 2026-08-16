import { RedactedReminder } from "@throughline/domain";
import { OAuth2Client } from "google-auth-library";
import webpush from "web-push";
import { z } from "zod";
import { D1Database, D1PushStore, D1SyncStore, D1UserStore } from "./d1Store";
import {
  BulkReminderSyncSchema,
  EndpointHashParamsSchema,
  PushSubscriptionSchema,
  ReminderEnvelopeSchema
} from "./schemas";

export interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

export interface ScheduledController {
  readonly scheduledTime: number;
  readonly cron: string;
  noRetry(): void;
}

export interface WorkerEnv {
  DB: D1Database;
  VAPID_PUBLIC_KEY?: string;
  VAPID_PRIVATE_KEY?: string;
  VAPID_SUBJECT?: string;
  DISPATCH_TOKEN?: string;
  CORS_ORIGIN?: string;
  RATE_LIMIT_MAX?: string;
  SESSION_SECRET?: string;
  COOKIE_SECURE?: string;
  GOOGLE_CLIENT_ID?: string;
}

export const SESSION_COOKIE = "tl_session";
const SESSION_MAX_AGE = 30 * 24 * 60 * 60; // 30 days in seconds

const blob = z.string().min(1).max(4096);
const SignupSchema = z.object({
  email: z.string().email().max(254),
  salt: blob,
  authKey: blob,
  wrappedDek: blob,
  recoveryAuthKey: blob,
  recoveryWrappedDek: blob
});
const LoginSchema = z.object({ email: z.string().email().max(254), authKey: blob });
const SaltSchema = z.object({ email: z.string().email().max(254) });
const GoogleAuthSchema = z.object({ credential: z.string(), dek: z.string().optional() });
const UpdatePasswordSchema = z.object({ authKey: blob, wrappedDek: blob });
const UpdateRecoveryKeySchema = z.object({ recoveryAuthKey: blob, recoveryWrappedDek: blob });

const EntitySchema = z.enum(["task", "course", "goal", "note", "focusSession"]);
const ChangeSchema = z.object({
  entity: EntitySchema,
  id: z.string().min(1).max(200),
  changedAt: z.string().min(1).max(40),
  deleted: z.boolean(),
  ciphertext: z.string().max(500_000).optional(),
  iv: z.string().max(100).optional()
});
const PushSchema = z.object({ changes: z.array(ChangeSchema).max(5000) });
const PullQuerySchema = z.object({ since: z.string().max(40).optional() });

// In-memory metrics tracking for the worker isolate
const dispatchMetrics = { sent: 0, failed: 0 };

function getCookie(request: Request, name: string): string | null {
  const cookieHeader = request.headers.get("Cookie");
  if (!cookieHeader) return null;
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function buildSetCookieHeader(token: string, secure: boolean): string {
  const parts = [
    `${SESSION_COOKIE}=${encodeURIComponent(token)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${SESSION_MAX_AGE}`
  ];
  if (secure) {
    parts.push("Secure");
  }
  return parts.join("; ");
}

function buildClearCookieHeader(secure: boolean): string {
  const parts = [
    `${SESSION_COOKIE}=`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    "Max-Age=0"
  ];
  if (secure) {
    parts.push("Secure");
  }
  return parts.join("; ");
}

function corsHeaders(request: Request, env: WorkerEnv): Headers {
  const origin = request.headers.get("Origin");
  const headers = new Headers();

  const allowedOrigin = env.CORS_ORIGIN || origin || "*";
  headers.set("Access-Control-Allow-Origin", allowedOrigin);
  headers.set("Access-Control-Allow-Credentials", "true");
  headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  return headers;
}

function jsonResponse(data: unknown, status = 200, headers?: Headers): Response {
  const h = new Headers(headers);
  h.set("Content-Type", "application/json; charset=utf-8");
  return new Response(JSON.stringify(data), { status, headers: h });
}

function errorResponse(status: number, error: string, headers?: Headers): Response {
  return jsonResponse({ error }, status, headers);
}

async function getUserFromRequest(request: Request, userStore: D1UserStore) {
  const token = getCookie(request, SESSION_COOKIE);
  if (!token) return null;
  return userStore.getSessionUser(token);
}

function hasVapidConfig(env: WorkerEnv): boolean {
  return Boolean(env.VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY && env.VAPID_SUBJECT);
}

export async function dispatchDueReminders(env: WorkerEnv): Promise<{ sent: number; skipped?: string }> {
  if (!hasVapidConfig(env)) {
    return { sent: 0, skipped: "missing-vapid" };
  }

  webpush.setVapidDetails(
    env.VAPID_SUBJECT as string,
    env.VAPID_PUBLIC_KEY as string,
    env.VAPID_PRIVATE_KEY as string
  );

  const pushStore = new D1PushStore(env.DB);
  const due = await pushStore.dueReminders();
  let sent = 0;

  for (const reminder of due) {
    const subscription = await pushStore.subscriptionFor(reminder.endpointHash);
    if (!subscription) {
      await pushStore.removeSubscription(reminder.endpointHash);
      continue;
    }

    try {
      await webpush.sendNotification(
        subscription.subscription,
        JSON.stringify({
          title: reminder.title,
          body: reminder.body,
          data: {
            reminderId: reminder.reminderId,
            taskId: reminder.taskId,
            urgency: reminder.urgency
          }
        })
      );
      await pushStore.markDispatched(reminder.endpointHash, reminder.reminderId);
      sent += 1;
      dispatchMetrics.sent += 1;
    } catch (err: unknown) {
      dispatchMetrics.failed += 1;
      const errStatusCode = (err as { statusCode?: number })?.statusCode;
      if (errStatusCode === 404 || errStatusCode === 410) {
        await pushStore.removeSubscription(reminder.endpointHash);
      }
    }
  }

  return { sent };
}

export async function handleRequest(request: Request, env: WorkerEnv): Promise<Response> {
  const url = new URL(request.url);
  // Strip optional /api prefix to support same-origin proxy or direct routing
  const pathname = url.pathname.replace(/^\/api/, "") || "/";
  const method = request.method.toUpperCase();
  const resHeaders = corsHeaders(request, env);
  const isSecure = env.COOKIE_SECURE !== "false";

  if (method === "OPTIONS") {
    return new Response(null, { status: 204, headers: resHeaders });
  }

  const pushStore = new D1PushStore(env.DB);
  const userStore = new D1UserStore(env.DB);
  const syncStore = new D1SyncStore(env.DB);

  try {
    // ----------------------------------------------------
    // GET /health
    // ----------------------------------------------------
    if (method === "GET" && pathname === "/health") {
      const counts = await pushStore.counts();
      const totalDispatches = dispatchMetrics.sent + dispatchMetrics.failed;
      return jsonResponse(
        {
          ok: true,
          vapidConfigured: hasVapidConfig(env),
          dispatchSuccessRate: totalDispatches > 0 ? dispatchMetrics.sent / totalDispatches : 1,
          metrics: dispatchMetrics,
          ...counts
        },
        200,
        resHeaders
      );
    }

    // ----------------------------------------------------
    // Subscriptions
    // ----------------------------------------------------
    if (method === "POST" && pathname === "/subscriptions") {
      const body = await request.json();
      const subscription = PushSubscriptionSchema.parse(body);
      const endpointHash = await pushStore.upsertSubscription(subscription);
      return jsonResponse({ endpointHash }, 201, resHeaders);
    }

    const subMatch = pathname.match(/^\/subscriptions\/([^/]+)$/);
    if (method === "DELETE" && subMatch) {
      const endpointHash = subMatch[1];
      await pushStore.removeSubscription(endpointHash);
      return new Response(null, { status: 204, headers: resHeaders });
    }

    // ----------------------------------------------------
    // Reminders
    // ----------------------------------------------------
    if (method === "POST" && pathname === "/reminders") {
      const body = await request.json();
      const envelope = ReminderEnvelopeSchema.parse(body);
      const stored = await pushStore.saveReminder(envelope.subscriptionEndpoint, envelope.reminder as RedactedReminder);
      return jsonResponse({ reminderId: stored.reminderId, endpointHash: stored.endpointHash }, 201, resHeaders);
    }

    const bulkRemindersMatch = pathname.match(/^\/subscriptions\/([^/]+)\/reminders$/);
    if (method === "PUT" && bulkRemindersMatch) {
      const endpointHash = bulkRemindersMatch[1];
      EndpointHashParamsSchema.parse({ endpointHash });
      const body = await request.json();
      const parsedBody = BulkReminderSyncSchema.parse(body);
      const stored = await pushStore.replaceReminders(endpointHash, parsedBody.reminders as RedactedReminder[]);

      if (!stored) {
        return errorResponse(404, "subscription-not-found", resHeaders);
      }

      return jsonResponse({ endpointHash, reminderCount: stored.length }, 200, resHeaders);
    }

    // ----------------------------------------------------
    // POST /dispatch-due
    // ----------------------------------------------------
    if (method === "POST" && pathname === "/dispatch-due") {
      if (env.DISPATCH_TOKEN) {
        const header = request.headers.get("Authorization");
        if (header !== `Bearer ${env.DISPATCH_TOKEN}`) {
          return errorResponse(401, "unauthorized", resHeaders);
        }
      }

      const result = await dispatchDueReminders(env);
      if (result.skipped) {
        return jsonResponse(result, 503, resHeaders);
      }
      return jsonResponse(result, 200, resHeaders);
    }

    // ----------------------------------------------------
    // Auth Routes
    // ----------------------------------------------------
    if (method === "POST" && pathname === "/auth/signup") {
      const body = await request.json();
      const parsed = SignupSchema.parse(body);
      const user = await userStore.createUser(parsed);
      if (!user) {
        return errorResponse(409, "email-taken", resHeaders);
      }
      const token = await userStore.createSession(user.id);
      resHeaders.set("Set-Cookie", buildSetCookieHeader(token, isSecure));
      return jsonResponse({ email: user.email }, 201, resHeaders);
    }

    if (method === "POST" && pathname === "/auth/salt") {
      const body = await request.json();
      const { email } = SaltSchema.parse(body);
      const salt = await userStore.getSalt(email);
      if (!salt) {
        return errorResponse(404, "unknown-account", resHeaders);
      }
      return jsonResponse({ salt }, 200, resHeaders);
    }

    if (method === "POST" && pathname === "/auth/login") {
      const body = await request.json();
      const { email, authKey } = LoginSchema.parse(body);
      const result = await userStore.verifyLogin(email, authKey);
      if (!result) {
        return errorResponse(401, "invalid-credentials", resHeaders);
      }
      const token = await userStore.createSession(result.userId);
      resHeaders.set("Set-Cookie", buildSetCookieHeader(token, isSecure));
      return jsonResponse(
        { email: email.trim().toLowerCase(), salt: result.salt, wrappedDek: result.wrappedDek },
        200,
        resHeaders
      );
    }

    if (method === "POST" && pathname === "/auth/google") {
      if (!env.GOOGLE_CLIENT_ID) {
        return errorResponse(501, "google-auth-not-configured", resHeaders);
      }
      const body = await request.json();
      const { credential, dek } = GoogleAuthSchema.parse(body);

      let payload: { email?: string; sub?: string } | undefined;
      try {
        const googleClient = new OAuth2Client(env.GOOGLE_CLIENT_ID);
        const ticket = await googleClient.verifyIdToken({
          idToken: credential,
          audience: env.GOOGLE_CLIENT_ID
        });
        payload = ticket.getPayload();
      } catch {
        return errorResponse(401, "invalid-google-credential", resHeaders);
      }

      if (!payload || !payload.email || !payload.sub) {
        return errorResponse(401, "invalid-google-payload", resHeaders);
      }

      const email = payload.email.trim().toLowerCase();
      const googleId = payload.sub;

      let result = await userStore.verifyGoogleLogin(email, googleId);

      if (!result) {
        if (!dek) {
          return errorResponse(400, "dek-required-for-signup", resHeaders);
        }
        const newUser = await userStore.createGoogleUser({ email, googleId, dek });
        if (!newUser) {
          return errorResponse(409, "email-taken-by-another-method", resHeaders);
        }
        result = { userId: newUser.id, dek: newUser.wrappedDek };
      }

      const token = await userStore.createSession(result.userId);
      resHeaders.set("Set-Cookie", buildSetCookieHeader(token, isSecure));
      return jsonResponse({ email, dek: result.dek }, 200, resHeaders);
    }

    if (method === "POST" && pathname === "/auth/logout") {
      const token = getCookie(request, SESSION_COOKIE);
      if (token) {
        await userStore.deleteSession(token);
      }
      resHeaders.set("Set-Cookie", buildClearCookieHeader(isSecure));
      return new Response(null, { status: 204, headers: resHeaders });
    }

    if (method === "GET" && pathname === "/auth/me") {
      const user = await getUserFromRequest(request, userStore);
      if (!user) {
        return errorResponse(401, "unauthenticated", resHeaders);
      }
      return jsonResponse({ email: user.email }, 200, resHeaders);
    }

    if (method === "POST" && pathname === "/auth/update-password") {
      const user = await getUserFromRequest(request, userStore);
      if (!user) {
        return errorResponse(401, "unauthenticated", resHeaders);
      }
      const body = await request.json();
      const { authKey, wrappedDek } = UpdatePasswordSchema.parse(body);
      await userStore.updatePassword(user.userId, authKey, wrappedDek);
      return new Response(null, { status: 204, headers: resHeaders });
    }

    if (method === "POST" && pathname === "/auth/update-recovery-key") {
      const user = await getUserFromRequest(request, userStore);
      if (!user) {
        return errorResponse(401, "unauthenticated", resHeaders);
      }
      const body = await request.json();
      const { recoveryAuthKey, recoveryWrappedDek } = UpdateRecoveryKeySchema.parse(body);
      await userStore.updateRecoveryKey(user.userId, recoveryAuthKey, recoveryWrappedDek);
      return new Response(null, { status: 204, headers: resHeaders });
    }

    // ----------------------------------------------------
    // Encrypted Sync Routes
    // ----------------------------------------------------
    if (method === "GET" && pathname === "/sync/pull") {
      const user = await getUserFromRequest(request, userStore);
      if (!user) {
        return errorResponse(401, "unauthenticated", resHeaders);
      }
      const querySince = url.searchParams.get("since") || undefined;
      const { since } = PullQuerySchema.parse({ since: querySince });
      const result = await syncStore.pullChanges(user.userId, since);
      return jsonResponse(result, 200, resHeaders);
    }

    if (method === "POST" && pathname === "/sync/push") {
      const user = await getUserFromRequest(request, userStore);
      if (!user) {
        return errorResponse(401, "unauthenticated", resHeaders);
      }
      const body = await request.json();
      const { changes } = PushSchema.parse(body);
      const result = await syncStore.pushChanges(user.userId, changes);
      return jsonResponse(result, 200, resHeaders);
    }

    return errorResponse(404, "not-found", resHeaders);
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      return jsonResponse({ error: "validation-error", details: err.issues }, 400, resHeaders);
    }
    console.error("Worker error handling request:", err);
    return errorResponse(500, "internal-error", resHeaders);
  }
}

export default {
  fetch(request: Request, env: WorkerEnv): Promise<Response> {
    return handleRequest(request, env);
  },

  async scheduled(_event: ScheduledController, env: WorkerEnv, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(dispatchDueReminders(env));
  }
};

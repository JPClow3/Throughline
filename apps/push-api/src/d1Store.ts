import { RedactedReminder } from "@throughline/domain";
import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import type { StoredReminder, StoredSubscription, WebPushSubscription } from "./store";
import type { UserRow } from "./userStore";

export interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = Record<string, unknown>>(colName?: string): Promise<T | null>;
  all<T = Record<string, unknown>>(): Promise<{ results: T[]; success: boolean; error?: string }>;
  run(): Promise<{ success: boolean; error?: string; meta?: Record<string, unknown> }>;
}

export interface D1Database {
  prepare(query: string): D1PreparedStatement;
  batch<T = unknown>(statements: D1PreparedStatement[]): Promise<{ results?: T[]; success: boolean }[]>;
  exec(query: string): Promise<{ count: number; duration: number }>;
}

const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export function hashEndpoint(endpoint: string): string {
  return createHash("sha256").update(endpoint).digest("hex");
}

export function hashAuthKey(authKey: string): string {
  const salt = randomBytes(16);
  const derived = scryptSync(authKey, salt, 64);
  return `${Buffer.from(salt).toString("hex")}:${Buffer.from(derived).toString("hex")}`;
}

export function verifyAuthKey(authKey: string, stored: string): boolean {
  const [saltHex, hashHex] = stored.split(":");
  if (!saltHex || !hashHex) {
    return false;
  }
  const derived = scryptSync(authKey, Buffer.from(saltHex, "hex"), 64);
  const expected = Buffer.from(hashHex, "hex");
  return derived.length === expected.length && timingSafeEqual(derived, expected);
}

const normalizeEmail = (email: string) => email.trim().toLowerCase();

/**
 * Cloudflare D1 Implementation of PushStore
 */
export class D1PushStore {
  constructor(private readonly db: D1Database) {}

  async upsertSubscription(subscription: WebPushSubscription): Promise<string> {
    const endpointHash = hashEndpoint(subscription.endpoint);
    const now = new Date().toISOString();

    await this.db
      .prepare(
        `INSERT INTO subscriptions (endpoint_hash, endpoint, expiration_time, p256dh, auth, created_at, last_seen_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(endpoint_hash) DO UPDATE SET
           endpoint = excluded.endpoint,
           expiration_time = excluded.expiration_time,
           p256dh = excluded.p256dh,
           auth = excluded.auth,
           last_seen_at = excluded.last_seen_at`
      )
      .bind(
        endpointHash,
        subscription.endpoint,
        subscription.expirationTime ?? null,
        subscription.keys.p256dh,
        subscription.keys.auth,
        now,
        now
      )
      .run();

    return endpointHash;
  }

  async removeSubscription(endpointHash: string): Promise<void> {
    await this.db.prepare("DELETE FROM subscriptions WHERE endpoint_hash = ?").bind(endpointHash).run();
    await this.db.prepare("DELETE FROM reminders WHERE endpoint_hash = ?").bind(endpointHash).run();
  }

  async saveReminder(subscriptionEndpoint: string, reminder: RedactedReminder): Promise<StoredReminder> {
    const endpointHash = hashEndpoint(subscriptionEndpoint);
    
    // Check existing reminder to preserve dispatchedAt if notifyAt hasn't changed
    const existing = await this.db
      .prepare("SELECT notify_at, dispatched_at FROM reminders WHERE endpoint_hash = ? AND reminder_id = ?")
      .bind(endpointHash, reminder.reminderId)
      .first<{ notify_at: string; dispatched_at: string | null }>();

    const dispatchedAt = existing?.notify_at === reminder.notifyAt ? (existing?.dispatched_at ?? undefined) : undefined;

    await this.db
      .prepare(
        `INSERT INTO reminders (endpoint_hash, reminder_id, title, body, notify_at, urgency, task_id, dispatched_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(endpoint_hash, reminder_id) DO UPDATE SET
           title = excluded.title,
           body = excluded.body,
           notify_at = excluded.notify_at,
           urgency = excluded.urgency,
           task_id = excluded.task_id,
           dispatched_at = excluded.dispatched_at`
      )
      .bind(
        endpointHash,
        reminder.reminderId,
        reminder.title,
        reminder.body,
        reminder.notifyAt,
        reminder.urgency,
        reminder.taskId,
        dispatchedAt ?? null
      )
      .run();

    return {
      ...reminder,
      endpointHash,
      dispatchedAt
    };
  }

  async replaceReminders(endpointHash: string, reminders: RedactedReminder[]): Promise<StoredReminder[] | null> {
    const sub = await this.db
      .prepare("SELECT endpoint_hash FROM subscriptions WHERE endpoint_hash = ?")
      .bind(endpointHash)
      .first();

    if (!sub) {
      return null;
    }

    // Get previous reminders to preserve dispatched status
    const previousRows = await this.db
      .prepare("SELECT reminder_id, notify_at, dispatched_at FROM reminders WHERE endpoint_hash = ?")
      .bind(endpointHash)
      .all<{ reminder_id: string; notify_at: string; dispatched_at: string | null }>();

    const previousMap = new Map(
      previousRows.results.map((r) => [r.reminder_id, { notifyAt: r.notify_at, dispatchedAt: r.dispatched_at }])
    );

    // Delete existing
    await this.db.prepare("DELETE FROM reminders WHERE endpoint_hash = ?").bind(endpointHash).run();

    const stored: StoredReminder[] = [];
    const statements: D1PreparedStatement[] = [];

    for (const reminder of reminders) {
      const prev = previousMap.get(reminder.reminderId);
      const dispatchedAt = prev?.notifyAt === reminder.notifyAt ? (prev?.dispatchedAt ?? undefined) : undefined;
      const item: StoredReminder = {
        ...reminder,
        endpointHash,
        dispatchedAt
      };
      stored.push(item);

      statements.push(
        this.db
          .prepare(
            `INSERT INTO reminders (endpoint_hash, reminder_id, title, body, notify_at, urgency, task_id, dispatched_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
          )
          .bind(
            endpointHash,
            reminder.reminderId,
            reminder.title,
            reminder.body,
            reminder.notifyAt,
            reminder.urgency,
            reminder.taskId,
            dispatchedAt ?? null
          )
      );
    }

    if (statements.length > 0) {
      await this.db.batch(statements);
    }

    return stored;
  }

  async dueReminders(now = new Date()): Promise<StoredReminder[]> {
    const isoNow = now.toISOString();
    const rows = await this.db
      .prepare(
        `SELECT endpoint_hash, reminder_id, title, body, notify_at, urgency, task_id, dispatched_at
         FROM reminders
         WHERE dispatched_at IS NULL AND notify_at <= ?
         ORDER BY notify_at ASC`
      )
      .bind(isoNow)
      .all<{
        endpoint_hash: string;
        reminder_id: string;
        title: "Quest reminder";
        body: "A study quest needs your attention.";
        notify_at: string;
        urgency: "normal" | "high" | "critical";
        task_id: string;
        dispatched_at: string | null;
        created_at: string;
        due_at?: string | null;
      }>();

    return rows.results.map((r) => ({
      endpointHash: r.endpoint_hash,
      reminderId: r.reminder_id,
      title: r.title,
      body: r.body,
      notifyAt: r.notify_at,
      urgency: r.urgency,
      taskId: r.task_id,
      createdAt: r.created_at || isoNow,
      dispatchedAt: r.dispatched_at ?? undefined
    }));
  }

  async markDispatched(endpointHash: string, reminderId: string): Promise<void> {
    const now = new Date().toISOString();
    await this.db
      .prepare("UPDATE reminders SET dispatched_at = ? WHERE endpoint_hash = ? AND reminder_id = ?")
      .bind(now, endpointHash, reminderId)
      .run();
  }

  async subscriptionFor(endpointHash: string): Promise<StoredSubscription | undefined> {
    const row = await this.db
      .prepare(
        `SELECT endpoint_hash, endpoint, expiration_time, p256dh, auth, created_at, last_seen_at
         FROM subscriptions WHERE endpoint_hash = ?`
      )
      .bind(endpointHash)
      .first<{
        endpoint_hash: string;
        endpoint: string;
        expiration_time: number | null;
        p256dh: string;
        auth: string;
        created_at: string;
        last_seen_at: string;
      }>();

    if (!row) return undefined;

    return {
      endpointHash: row.endpoint_hash,
      subscription: {
        endpoint: row.endpoint,
        expirationTime: row.expiration_time,
        keys: {
          p256dh: row.p256dh,
          auth: row.auth
        }
      },
      createdAt: row.created_at,
      lastSeenAt: row.last_seen_at
    };
  }

  async counts(): Promise<{ subscriptions: number; reminders: number }> {
    const subCount = await this.db.prepare("SELECT COUNT(*) as c FROM subscriptions").first<{ c: number }>();
    const remCount = await this.db.prepare("SELECT COUNT(*) as c FROM reminders").first<{ c: number }>();
    return {
      subscriptions: subCount?.c ?? 0,
      reminders: remCount?.c ?? 0
    };
  }
}

/**
 * Cloudflare D1 Implementation of UserStore
 */
export class D1UserStore {
  constructor(private readonly db: D1Database) {}

  async createUser(input: {
    email: string;
    salt: string;
    authKey: string;
    wrappedDek: string;
    recoveryAuthKey: string;
    recoveryWrappedDek: string;
  }): Promise<UserRow | null> {
    const email = normalizeEmail(input.email);
    const existing = await this.db.prepare("SELECT id FROM users WHERE email = ?").bind(email).first();
    if (existing) {
      return null;
    }

    const row: UserRow = {
      id: `user_${Buffer.from(randomBytes(12)).toString("hex")}`,
      email,
      salt: input.salt,
      authHash: hashAuthKey(input.authKey),
      wrappedDek: input.wrappedDek,
      createdAt: new Date().toISOString()
    };

    const recoveryHash = hashAuthKey(input.recoveryAuthKey);

    await this.db
      .prepare(
        `INSERT INTO users (id, email, salt, auth_hash, wrapped_dek, created_at, recovery_hash, recovery_wrapped_dek)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(row.id, row.email, row.salt, row.authHash, row.wrappedDek, row.createdAt, recoveryHash, input.recoveryWrappedDek)
      .run();

    return row;
  }

  async getSalt(email: string): Promise<string | null> {
    const row = await this.db
      .prepare("SELECT salt FROM users WHERE email = ?")
      .bind(normalizeEmail(email))
      .first<{ salt: string }>();
    return row?.salt ?? null;
  }

  async verifyLogin(email: string, authKey: string): Promise<{ userId: string; salt: string; wrappedDek: string } | null> {
    const row = await this.db
      .prepare("SELECT id, salt, auth_hash, wrapped_dek, recovery_hash, recovery_wrapped_dek FROM users WHERE email = ?")
      .bind(normalizeEmail(email))
      .first<{
        id: string;
        salt: string;
        auth_hash: string;
        wrapped_dek: string;
        recovery_hash?: string | null;
        recovery_wrapped_dek?: string | null;
      }>();

    if (!row) return null;

    if (verifyAuthKey(authKey, row.auth_hash)) {
      return { userId: row.id, salt: row.salt, wrappedDek: row.wrapped_dek };
    }

    if (row.recovery_hash && row.recovery_wrapped_dek && verifyAuthKey(authKey, row.recovery_hash)) {
      return { userId: row.id, salt: row.salt, wrappedDek: row.recovery_wrapped_dek };
    }

    return null;
  }

  async createGoogleUser(input: { email: string; googleId: string; dek: string }): Promise<UserRow | null> {
    const email = normalizeEmail(input.email);
    const existing = await this.db.prepare("SELECT id FROM users WHERE email = ?").bind(email).first();
    if (existing) {
      return null;
    }
    const row: UserRow = {
      id: `user_${Buffer.from(randomBytes(12)).toString("hex")}`,
      email,
      salt: "",
      authHash: "",
      wrappedDek: input.dek,
      createdAt: new Date().toISOString(),
      googleId: input.googleId
    };

    await this.db
      .prepare(
        `INSERT INTO users (id, email, salt, auth_hash, wrapped_dek, created_at, google_id)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(row.id, row.email, row.salt, row.authHash, row.wrappedDek, row.createdAt, input.googleId)
      .run();

    return row;
  }

  async verifyGoogleLogin(email: string, googleId: string): Promise<{ userId: string; dek: string } | null> {
    const row = await this.db
      .prepare("SELECT id, wrapped_dek, email FROM users WHERE google_id = ?")
      .bind(googleId)
      .first<{ id: string; wrapped_dek: string; email: string }>();

    if (!row) return null;

    const normalizedEmail = normalizeEmail(email);
    if (row.email !== normalizedEmail) {
      try {
        await this.db.prepare("UPDATE users SET email = ? WHERE id = ?").bind(normalizedEmail, row.id).run();
      } catch {
        /* ignore unique constraint conflict */
      }
    }

    return { userId: row.id, dek: row.wrapped_dek };
  }

  async createSession(userId: string): Promise<string> {
    const token = Buffer.from(randomBytes(32)).toString("hex");
    const createdAt = new Date();
    const expiresAt = new Date(createdAt.getTime() + SESSION_TTL_MS);

    await this.db
      .prepare("INSERT INTO sessions (token, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)")
      .bind(token, userId, createdAt.toISOString(), expiresAt.toISOString())
      .run();

    return token;
  }

  async getSessionUser(token: string): Promise<{ userId: string; email: string } | null> {
    const row = await this.db
      .prepare(
        `SELECT u.id AS user_id, u.email AS email, s.expires_at AS expires_at
         FROM sessions s JOIN users u ON u.id = s.user_id
         WHERE s.token = ?`
      )
      .bind(token)
      .first<{ user_id: string; email: string; expires_at: string }>();

    if (!row) return null;

    if (new Date(row.expires_at).getTime() < Date.now()) {
      await this.db.prepare("DELETE FROM sessions WHERE token = ?").bind(token).run();
      return null;
    }

    return { userId: row.user_id, email: row.email };
  }

  async updatePassword(userId: string, authKey: string, wrappedDek: string): Promise<void> {
    const authHash = hashAuthKey(authKey);
    await this.db
      .prepare("UPDATE users SET auth_hash = ?, wrapped_dek = ? WHERE id = ?")
      .bind(authHash, wrappedDek, userId)
      .run();
  }

  async updateRecoveryKey(userId: string, recoveryAuthKey: string, recoveryWrappedDek: string): Promise<void> {
    const recoveryHash = hashAuthKey(recoveryAuthKey);
    await this.db
      .prepare("UPDATE users SET recovery_hash = ?, recovery_wrapped_dek = ? WHERE id = ?")
      .bind(recoveryHash, recoveryWrappedDek, userId)
      .run();
  }

  async deleteSession(token: string): Promise<void> {
    await this.db.prepare("DELETE FROM sessions WHERE token = ?").bind(token).run();
  }
}

/**
 * Cloudflare D1 Implementation of Encrypted Sync
 */
export type SyncChangeInput = {
  entity: "task" | "course" | "goal" | "note" | "focusSession";
  id: string;
  changedAt: string;
  deleted: boolean;
  ciphertext?: string;
  iv?: string;
};

export class D1SyncStore {
  constructor(private readonly db: D1Database) {}

  async pullChanges(userId: string, since?: string) {
    const rows = await this.db
      .prepare(
        `SELECT entity, id, changed_at AS changedAt, deleted, ciphertext, iv
         FROM records WHERE user_id = ? AND changed_at > ?
         ORDER BY changed_at ASC LIMIT 5000`
      )
      .bind(userId, since ?? "")
      .all<{
        entity: "task" | "course" | "goal" | "note" | "focusSession";
        id: string;
        changedAt: string;
        deleted: number;
        ciphertext: string | null;
        iv: string | null;
      }>();

    const changes = rows.results.map((row) => ({
      entity: row.entity,
      id: row.id,
      changedAt: row.changedAt,
      deleted: row.deleted === 1,
      ciphertext: row.ciphertext ?? undefined,
      iv: row.iv ?? undefined
    }));

    const cursor = changes.length ? changes[changes.length - 1].changedAt : (since ?? "");
    return { changes, cursor };
  }

  async pushChanges(userId: string, changes: SyncChangeInput[]) {
    let applied = 0;

    for (const change of changes) {
      const existing = await this.db
        .prepare("SELECT changed_at AS changedAt FROM records WHERE user_id = ? AND entity = ? AND id = ?")
        .bind(userId, change.entity, change.id)
        .first<{ changedAt: string }>();

      // Last-write-wins: ignore changes not newer than what we have
      if (existing && existing.changedAt >= change.changedAt) {
        continue;
      }

      await this.db
        .prepare(
          `INSERT INTO records (user_id, entity, id, changed_at, deleted, ciphertext, iv)
           VALUES (?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(user_id, entity, id) DO UPDATE SET
             changed_at = excluded.changed_at,
             deleted = excluded.deleted,
             ciphertext = excluded.ciphertext,
             iv = excluded.iv`
        )
        .bind(
          userId,
          change.entity,
          change.id,
          change.changedAt,
          change.deleted ? 1 : 0,
          change.ciphertext ?? null,
          change.iv ?? null
        )
        .run();

      applied += 1;
    }

    const maxRow = await this.db
      .prepare("SELECT MAX(changed_at) AS cursor FROM records WHERE user_id = ?")
      .bind(userId)
      .first<{ cursor: string | null }>();

    return { applied, cursor: maxRow?.cursor ?? "" };
  }
}

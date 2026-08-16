import { RedactedReminder } from "@throughline/domain";
import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import type { Sql } from "postgres";
import type { StoredReminder, StoredSubscription, WebPushSubscription } from "./store";
import type { UserRow } from "./userStore";

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
 * PostgreSQL / Neon implementation of PushStore
 */
export class PostgresPushStore {
  constructor(private readonly sql: Sql) {}

  async upsertSubscription(subscription: WebPushSubscription): Promise<string> {
    const endpointHash = hashEndpoint(subscription.endpoint);
    const now = new Date().toISOString();

    await this.sql`
      INSERT INTO subscriptions (endpoint_hash, endpoint, expiration_time, p256dh, auth, created_at, last_seen_at)
      VALUES (${endpointHash}, ${subscription.endpoint}, ${subscription.expirationTime ?? null}, ${subscription.keys.p256dh}, ${subscription.keys.auth}, ${now}, ${now})
      ON CONFLICT (endpoint_hash) DO UPDATE SET
        endpoint = EXCLUDED.endpoint,
        expiration_time = EXCLUDED.expiration_time,
        p256dh = EXCLUDED.p256dh,
        auth = EXCLUDED.auth,
        last_seen_at = EXCLUDED.last_seen_at
    `;

    return endpointHash;
  }

  async removeSubscription(endpointHash: string): Promise<void> {
    await this.sql`DELETE FROM subscriptions WHERE endpoint_hash = ${endpointHash}`;
    await this.sql`DELETE FROM reminders WHERE endpoint_hash = ${endpointHash}`;
  }

  async saveReminder(subscriptionEndpoint: string, reminder: RedactedReminder): Promise<StoredReminder> {
    const endpointHash = hashEndpoint(subscriptionEndpoint);

    const [existing] = await this.sql<{ notify_at: string; dispatched_at: string | null }[]>`
      SELECT notify_at, dispatched_at FROM reminders WHERE endpoint_hash = ${endpointHash} AND reminder_id = ${reminder.reminderId}
    `;

    const dispatchedAt = existing?.notify_at === reminder.notifyAt ? (existing?.dispatched_at ?? undefined) : undefined;

    await this.sql`
      INSERT INTO reminders (endpoint_hash, reminder_id, title, body, notify_at, urgency, task_id, due_at, created_at, dispatched_at)
      VALUES (${endpointHash}, ${reminder.reminderId}, ${reminder.title}, ${reminder.body}, ${reminder.notifyAt}, ${reminder.urgency}, ${reminder.taskId}, ${reminder.dueAt ?? null}, ${reminder.createdAt}, ${dispatchedAt ?? null})
      ON CONFLICT (endpoint_hash, reminder_id) DO UPDATE SET
        title = EXCLUDED.title,
        body = EXCLUDED.body,
        notify_at = EXCLUDED.notify_at,
        urgency = EXCLUDED.urgency,
        task_id = EXCLUDED.task_id,
        due_at = EXCLUDED.due_at,
        created_at = EXCLUDED.created_at,
        dispatched_at = EXCLUDED.dispatched_at
    `;

    return {
      ...reminder,
      endpointHash,
      dispatchedAt
    };
  }

  async replaceReminders(endpointHash: string, reminders: RedactedReminder[]): Promise<StoredReminder[] | null> {
    const [sub] = await this.sql<{ endpoint_hash: string }[]>`
      SELECT endpoint_hash FROM subscriptions WHERE endpoint_hash = ${endpointHash}
    `;

    if (!sub) {
      return null;
    }

    const previousRows = await this.sql<{ reminder_id: string; notify_at: string; dispatched_at: string | null }[]>`
      SELECT reminder_id, notify_at, dispatched_at FROM reminders WHERE endpoint_hash = ${endpointHash}
    `;

    const previousMap = new Map(
      previousRows.map((r) => [r.reminder_id, { notifyAt: r.notify_at, dispatchedAt: r.dispatched_at }])
    );

    await this.sql`DELETE FROM reminders WHERE endpoint_hash = ${endpointHash}`;

    const stored: StoredReminder[] = [];

    for (const reminder of reminders) {
      const prev = previousMap.get(reminder.reminderId);
      const dispatchedAt = prev?.notifyAt === reminder.notifyAt ? (prev?.dispatchedAt ?? undefined) : undefined;
      const item: StoredReminder = {
        ...reminder,
        endpointHash,
        dispatchedAt
      };
      stored.push(item);

      await this.sql`
        INSERT INTO reminders (endpoint_hash, reminder_id, title, body, notify_at, urgency, task_id, due_at, created_at, dispatched_at)
        VALUES (${endpointHash}, ${reminder.reminderId}, ${reminder.title}, ${reminder.body}, ${reminder.notifyAt}, ${reminder.urgency}, ${reminder.taskId}, ${reminder.dueAt ?? null}, ${reminder.createdAt}, ${dispatchedAt ?? null})
      `;
    }

    return stored;
  }

  async dueReminders(now = new Date()): Promise<StoredReminder[]> {
    const isoNow = now.toISOString();
    const rows = await this.sql<{
      endpoint_hash: string;
      reminder_id: string;
      title: "Quest reminder";
      body: "A study quest needs your attention.";
      notify_at: string;
      urgency: "normal" | "high" | "critical";
      task_id: string;
      due_at: string | null;
      created_at: string;
      dispatched_at: string | null;
    }[]>`
      SELECT endpoint_hash, reminder_id, title, body, notify_at, urgency, task_id, due_at, created_at, dispatched_at
      FROM reminders
      WHERE dispatched_at IS NULL AND notify_at <= ${isoNow}
      ORDER BY notify_at ASC
    `;

    return rows.map((r) => ({
      endpointHash: r.endpoint_hash,
      reminderId: r.reminder_id,
      title: r.title,
      body: r.body,
      notifyAt: r.notify_at,
      urgency: r.urgency,
      taskId: r.task_id,
      dueAt: r.due_at ?? undefined,
      createdAt: r.created_at || isoNow,
      dispatchedAt: r.dispatched_at ?? undefined
    }));
  }

  async markDispatched(endpointHash: string, reminderId: string): Promise<void> {
    const now = new Date().toISOString();
    await this.sql`
      UPDATE reminders SET dispatched_at = ${now}
      WHERE endpoint_hash = ${endpointHash} AND reminder_id = ${reminderId}
    `;
  }

  async subscriptionFor(endpointHash: string): Promise<StoredSubscription | undefined> {
    const [row] = await this.sql<{
      endpoint_hash: string;
      endpoint: string;
      expiration_time: number | string | null;
      p256dh: string;
      auth: string;
      created_at: string;
      last_seen_at: string;
    }[]>`
      SELECT endpoint_hash, endpoint, expiration_time, p256dh, auth, created_at, last_seen_at
      FROM subscriptions WHERE endpoint_hash = ${endpointHash}
    `;

    if (!row) return undefined;

    return {
      endpointHash: row.endpoint_hash,
      subscription: {
        endpoint: row.endpoint,
        expirationTime: row.expiration_time !== null ? Number(row.expiration_time) : null,
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
    const [subCount] = await this.sql<{ count: string | number }[]>`
      SELECT COUNT(*) as count FROM subscriptions
    `;
    const [remCount] = await this.sql<{ count: string | number }[]>`
      SELECT COUNT(*) as count FROM reminders
    `;
    return {
      subscriptions: Number(subCount?.count ?? 0),
      reminders: Number(remCount?.count ?? 0)
    };
  }
}

/**
 * PostgreSQL / Neon implementation of UserStore
 */
export class PostgresUserStore {
  constructor(private readonly sql: Sql) {}

  async createUser(input: {
    email: string;
    salt: string;
    authKey: string;
    wrappedDek: string;
    recoveryAuthKey: string;
    recoveryWrappedDek: string;
  }): Promise<UserRow | null> {
    const email = normalizeEmail(input.email);
    const [existing] = await this.sql<{ id: string }[]>`
      SELECT id FROM users WHERE email = ${email}
    `;
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

    await this.sql`
      INSERT INTO users (id, email, salt, auth_hash, wrapped_dek, created_at, recovery_hash, recovery_wrapped_dek)
      VALUES (${row.id}, ${row.email}, ${row.salt}, ${row.authHash}, ${row.wrappedDek}, ${row.createdAt}, ${recoveryHash}, ${input.recoveryWrappedDek})
    `;

    return row;
  }

  async getSalt(email: string): Promise<string | null> {
    const [row] = await this.sql<{ salt: string }[]>`
      SELECT salt FROM users WHERE email = ${normalizeEmail(email)}
    `;
    return row?.salt ?? null;
  }

  async verifyLogin(email: string, authKey: string): Promise<{ userId: string; salt: string; wrappedDek: string } | null> {
    const [row] = await this.sql<{
      id: string;
      salt: string;
      auth_hash: string;
      wrapped_dek: string;
      recovery_hash?: string | null;
      recovery_wrapped_dek?: string | null;
    }[]>`
      SELECT id, salt, auth_hash, wrapped_dek, recovery_hash, recovery_wrapped_dek
      FROM users WHERE email = ${normalizeEmail(email)}
    `;

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
    const [existing] = await this.sql<{ id: string }[]>`
      SELECT id FROM users WHERE email = ${email}
    `;
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

    await this.sql`
      INSERT INTO users (id, email, salt, auth_hash, wrapped_dek, created_at, google_id)
      VALUES (${row.id}, ${row.email}, ${row.salt}, ${row.authHash}, ${row.wrappedDek}, ${row.createdAt}, ${input.googleId})
    `;

    return row;
  }

  async verifyGoogleLogin(email: string, googleId: string): Promise<{ userId: string; dek: string } | null> {
    const [row] = await this.sql<{ id: string; wrapped_dek: string; email: string }[]>`
      SELECT id, wrapped_dek, email FROM users WHERE google_id = ${googleId}
    `;

    if (!row) return null;

    const normalizedEmail = normalizeEmail(email);
    if (row.email !== normalizedEmail) {
      try {
        await this.sql`UPDATE users SET email = ${normalizedEmail} WHERE id = ${row.id}`;
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

    await this.sql`
      INSERT INTO sessions (token, user_id, created_at, expires_at)
      VALUES (${token}, ${userId}, ${createdAt.toISOString()}, ${expiresAt.toISOString()})
    `;

    return token;
  }

  async getSessionUser(token: string): Promise<{ userId: string; email: string } | null> {
    const [row] = await this.sql<{ user_id: string; email: string; expires_at: string }[]>`
      SELECT u.id AS user_id, u.email AS email, s.expires_at AS expires_at
      FROM sessions s JOIN users u ON u.id = s.user_id
      WHERE s.token = ${token}
    `;

    if (!row) return null;

    if (new Date(row.expires_at).getTime() < Date.now()) {
      await this.sql`DELETE FROM sessions WHERE token = ${token}`;
      return null;
    }

    return { userId: row.user_id, email: row.email };
  }

  async updatePassword(userId: string, authKey: string, wrappedDek: string): Promise<void> {
    const authHash = hashAuthKey(authKey);
    await this.sql`
      UPDATE users SET auth_hash = ${authHash}, wrapped_dek = ${wrappedDek} WHERE id = ${userId}
    `;
  }

  async updateRecoveryKey(userId: string, recoveryAuthKey: string, recoveryWrappedDek: string): Promise<void> {
    const recoveryHash = hashAuthKey(recoveryAuthKey);
    await this.sql`
      UPDATE users SET recovery_hash = ${recoveryHash}, recovery_wrapped_dek = ${recoveryWrappedDek} WHERE id = ${userId}
    `;
  }

  async deleteSession(token: string): Promise<void> {
    await this.sql`DELETE FROM sessions WHERE token = ${token}`;
  }
}

/**
 * PostgreSQL / Neon implementation of Encrypted Sync
 */
export type SyncChangeInput = {
  entity: "task" | "course" | "goal" | "note" | "focusSession";
  id: string;
  changedAt: string;
  deleted: boolean;
  ciphertext?: string;
  iv?: string;
};

export class PostgresSyncStore {
  constructor(private readonly sql: Sql) {}

  async pullChanges(userId: string, since?: string) {
    const rows = await this.sql<{
      entity: "task" | "course" | "goal" | "note" | "focusSession";
      id: string;
      changed_at: string;
      deleted: number;
      ciphertext: string | null;
      iv: string | null;
    }[]>`
      SELECT entity, id, changed_at, deleted, ciphertext, iv
      FROM records
      WHERE user_id = ${userId} AND changed_at > ${since ?? ""}
      ORDER BY changed_at ASC
      LIMIT 5000
    `;

    const changes = rows.map((row) => ({
      entity: row.entity,
      id: row.id,
      changedAt: row.changed_at,
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
      const [existing] = await this.sql<{ changed_at: string }[]>`
        SELECT changed_at FROM records WHERE user_id = ${userId} AND entity = ${change.entity} AND id = ${change.id}
      `;

      // Last-write-wins: ignore changes not newer than what we have
      if (existing && existing.changed_at >= change.changedAt) {
        continue;
      }

      await this.sql`
        INSERT INTO records (user_id, entity, id, changed_at, deleted, ciphertext, iv)
        VALUES (${userId}, ${change.entity}, ${change.id}, ${change.changedAt}, ${change.deleted ? 1 : 0}, ${change.ciphertext ?? null}, ${change.iv ?? null})
        ON CONFLICT (user_id, entity, id) DO UPDATE SET
          changed_at = EXCLUDED.changed_at,
          deleted = EXCLUDED.deleted,
          ciphertext = EXCLUDED.ciphertext,
          iv = EXCLUDED.iv
      `;

      applied += 1;
    }

    const [maxRow] = await this.sql<{ cursor: string | null }[]>`
      SELECT MAX(changed_at) AS cursor FROM records WHERE user_id = ${userId}
    `;

    return { applied, cursor: maxRow?.cursor ?? "" };
  }
}

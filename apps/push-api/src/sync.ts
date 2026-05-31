import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { userFromRequest } from "./auth";
import type { UserStore } from "./userStore";

const EntitySchema = z.enum(["task", "course", "goal", "note"]);

// The server only ever stores opaque ciphertext + IV; it cannot read content.
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

type RecordRow = {
  entity: string;
  id: string;
  changedAt: string;
  deleted: number;
  ciphertext: string | null;
  iv: string | null;
};

export function registerSyncRoutes(app: FastifyInstance, userStore: UserStore) {
  const db = userStore.db;
  db.exec(`
    CREATE TABLE IF NOT EXISTS records (
      user_id TEXT NOT NULL,
      entity TEXT NOT NULL,
      id TEXT NOT NULL,
      changed_at TEXT NOT NULL,
      deleted INTEGER NOT NULL DEFAULT 0,
      ciphertext TEXT,
      iv TEXT,
      PRIMARY KEY (user_id, entity, id)
    );
    CREATE INDEX IF NOT EXISTS idx_records_changed ON records(user_id, changed_at);
  `);

  app.get("/sync/pull", async (request, reply) => {
    const user = userFromRequest(request, userStore);
    if (!user) {
      return reply.code(401).send({ error: "unauthenticated" });
    }
    const { since } = PullQuerySchema.parse(request.query ?? {});
    const rows = db
      .prepare(
        `SELECT entity, id, changed_at AS changedAt, deleted, ciphertext, iv
         FROM records WHERE user_id = ? AND changed_at > ?
         ORDER BY changed_at ASC LIMIT 5000`
      )
      .all(user.userId, since ?? "") as RecordRow[];

    const changes = rows.map((row) => ({
      entity: row.entity,
      id: row.id,
      changedAt: row.changedAt,
      deleted: row.deleted === 1,
      ciphertext: row.ciphertext ?? undefined,
      iv: row.iv ?? undefined
    }));
    const cursor = changes.length ? changes[changes.length - 1].changedAt : (since ?? "");
    return { changes, cursor };
  });

  app.post("/sync/push", async (request, reply) => {
    const user = userFromRequest(request, userStore);
    if (!user) {
      return reply.code(401).send({ error: "unauthenticated" });
    }
    const { changes } = PushSchema.parse(request.body);

    const getExisting = db.prepare("SELECT changed_at AS changedAt FROM records WHERE user_id = ? AND entity = ? AND id = ?");
    const upsert = db.prepare(
      `INSERT INTO records (user_id, entity, id, changed_at, deleted, ciphertext, iv)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(user_id, entity, id) DO UPDATE SET
         changed_at = excluded.changed_at,
         deleted = excluded.deleted,
         ciphertext = excluded.ciphertext,
         iv = excluded.iv`
    );

    let applied = 0;
    for (const change of changes) {
      const existing = getExisting.get(user.userId, change.entity, change.id) as { changedAt: string } | undefined;
      // Last-write-wins: ignore changes not newer than what we have.
      if (existing && existing.changedAt >= change.changedAt) {
        continue;
      }
      upsert.run(
        user.userId,
        change.entity,
        change.id,
        change.changedAt,
        change.deleted ? 1 : 0,
        change.ciphertext ?? null,
        change.iv ?? null
      );
      applied += 1;
    }

    const maxRow = db.prepare("SELECT MAX(changed_at) AS cursor FROM records WHERE user_id = ?").get(user.userId) as
      | { cursor: string | null }
      | undefined;
    return { applied, cursor: maxRow?.cursor ?? "" };
  });
}

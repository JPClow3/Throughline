import { Course, Goal, Note, Task } from "@throughline/domain";
import { decryptJson, encryptJson } from "../auth/crypto";
import { db, type SyncEntity } from "../data/db";
import { refreshProgress } from "../data/db";
import { getCloudSyncState, saveCloudSyncState } from "../data/repositories";

const API_BASE = (import.meta.env.VITE_PUSH_API_URL ?? "/api").replace(/\/$/, "");

type Change = {
  entity: SyncEntity;
  id: string;
  changedAt: string;
  deleted: boolean;
  ciphertext?: string;
  iv?: string;
};

type SyncRecord = (Task | Course | Goal | Note) & { id: string; updatedAt: string };

function tableFor(entity: SyncEntity) {
  switch (entity) {
    case "task":
      return db.tasks;
    case "course":
      return db.courses;
    case "goal":
      return db.goals;
    case "note":
      return db.notes;
  }
}

async function collectLocalChanges(since: string, dekKey: CryptoKey): Promise<Change[]> {
  const changes: Change[] = [];
  const groups: Array<[SyncEntity, SyncRecord[]]> = [
    ["task", (await db.tasks.where("updatedAt").above(since).toArray()) as SyncRecord[]],
    ["goal", (await db.goals.where("updatedAt").above(since).toArray()) as SyncRecord[]],
    ["note", (await db.notes.where("updatedAt").above(since).toArray()) as SyncRecord[]],
    ["course", (await db.courses.where("updatedAt").above(since).toArray()) as SyncRecord[]]
  ];
  for (const [entity, rows] of groups) {
    for (const row of rows) {
      const { ciphertext, iv } = await encryptJson(row, dekKey);
      changes.push({ entity, id: row.id, changedAt: row.updatedAt, deleted: false, ciphertext, iv });
    }
  }
  const tombstones = await db.tombstones.where("deletedAt").above(since).toArray();
  for (const tombstone of tombstones) {
    changes.push({ entity: tombstone.entity, id: tombstone.id, changedAt: tombstone.deletedAt, deleted: true });
  }
  return changes;
}

async function applyRemoteChange(change: Change, dekKey: CryptoKey): Promise<boolean> {
  const table = tableFor(change.entity);
  if (change.deleted) {
    await table.delete(change.id);
    // Clear any local tombstone so we don't keep echoing the delete.
    await db.tombstones.delete(`${change.entity}:${change.id}`);
    return change.entity === "task";
  }
  if (!change.ciphertext || !change.iv) {
    return false;
  }
  const record = await decryptJson<SyncRecord>(change.ciphertext, change.iv, dekKey);
  const existing = (await table.get(change.id)) as SyncRecord | undefined;
  // Last-write-wins: only accept a strictly newer remote record.
  if (existing && existing.updatedAt >= record.updatedAt) {
    return false;
  }
  await table.put(record as never);
  return change.entity === "task";
}

export type SyncResult = { ok: true; lastSyncAt: string } | { ok: false; reason: "unauthenticated" | "error" };

/** One pull → merge → push cycle. Pure data layer; safe to call repeatedly. */
export async function runSync(dekKey: CryptoKey): Promise<SyncResult> {
  const state = await getCloudSyncState();
  const since = state.lastSyncAt ?? "";

  // 1. Pull remote changes and merge them locally.
  const pullRes = await fetch(`${API_BASE}/sync/pull?since=${encodeURIComponent(since)}`, {
    credentials: "include"
  });
  if (pullRes.status === 401) {
    return { ok: false, reason: "unauthenticated" };
  }
  if (!pullRes.ok) {
    return { ok: false, reason: "error" };
  }
  const pulled = (await pullRes.json()) as { changes: Change[]; cursor: string };
  let tasksTouched = false;
  for (const change of pulled.changes) {
    if (await applyRemoteChange(change, dekKey)) {
      tasksTouched = true;
    }
  }
  if (tasksTouched) {
    await refreshProgress();
  }

  // 2. Push local changes (encrypted) since the last cursor.
  let pushCursor = since;
  const local = await collectLocalChanges(since, dekKey);
  if (local.length) {
    const pushRes = await fetch(`${API_BASE}/sync/push`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ changes: local })
    });
    if (pushRes.status === 401) {
      return { ok: false, reason: "unauthenticated" };
    }
    if (!pushRes.ok) {
      return { ok: false, reason: "error" };
    }
    pushCursor = ((await pushRes.json()) as { cursor: string }).cursor || since;
  }

  // 3. Advance the cursor to the newest timestamp we've seen.
  const lastSyncAt = [since, pulled.cursor, pushCursor].filter(Boolean).sort().pop() ?? since;
  await saveCloudSyncState({ lastSyncAt, lastError: undefined });
  return { ok: true, lastSyncAt };
}

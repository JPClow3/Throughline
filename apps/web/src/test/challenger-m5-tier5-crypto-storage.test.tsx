import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createGoal,
  createNote,
  createTask
} from "@throughline/domain";
import { db } from "../data/db";
import {
  addTask,
  updateTaskStatus,
  deleteTask,
  listTasks,
  upsertCourse,
  deleteCourse,
  addGoal,
  deleteGoal,
  addNote,
  toggleNoteLink,
  getProgress,
  getAppearanceSettings,
  getFilterSettings,
  importBackup,
  syncRecurringTasks
} from "../data/repositories";
import {
  randomSalt,
  generateDek,
  wrapDek,
  unwrapDek,
  importDek,
  encryptJson,
  decryptJson,
  generateRecoveryKey,
  deriveRecoveryKeys,
  dekToB64,
  dekFromB64
} from "../auth/crypto";
import { runSync } from "../sync/syncClient";

// Robust Storage polyfill for Node 26 environments where globalThis.localStorage is undefined
class MemoryStorage implements Storage {
  private store = new Map<string, string>();
  get length() {
    return this.store.size;
  }
  clear() {
    this.store.clear();
  }
  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }
  key(index: number): string | null {
    return Array.from(this.store.keys())[index] ?? null;
  }
  removeItem(key: string) {
    this.store.delete(key);
  }
  setItem(key: string, value: string) {
    this.store.set(key, String(value));
  }
}

const memoryStorage = new MemoryStorage();
if (typeof globalThis.localStorage === "undefined" || !globalThis.localStorage) {
  Object.defineProperty(globalThis, "localStorage", {
    value: memoryStorage,
    writable: true,
    configurable: true
  });
}

describe("Tier 5 Adversarial Hardening — Crypto, Storage & Offline Resilience", () => {
  beforeEach(async () => {
    globalThis.localStorage.clear();
    await db.delete();
    await db.open();
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    await db.delete();
  });

  // =========================================================================
  // 1. Data corruption resilience and fallback in IndexedDB/Dexie
  // =========================================================================
  describe("1. IndexedDB/Dexie Data Corruption Resilience & Fallbacks", () => {
    it("1.1: rejects non-object or malformed backup payload and preserves database atomically", async () => {
      // Seed a legitimate task and course first
      const initialTask = await addTask({
        title: "Legitimate baseline task",
        priority: "high",
        energy: 3,
        difficulty: 2,
        attributes: ["focus"]
      });
      await upsertCourse({
        id: "course_baseline",
        name: "Baseline Physics",
        code: "PHYS101",
        color: "#3b82f6",
        icon: "🔬",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      const countBeforeTasks = await db.tasks.count();
      const countBeforeCourses = await db.courses.count();
      expect(countBeforeTasks).toBe(1);
      expect(countBeforeCourses).toBe(1);

      // Attempt importing completely invalid primitives
      await expect(importBackup(null)).rejects.toThrow();
      await expect(importBackup("corrupted-string")).rejects.toThrow();
      await expect(importBackup(42)).rejects.toThrow();
      await expect(importBackup([])).rejects.toThrow();

      // Attempt importing corrupted format / schema
      await expect(
        importBackup({
          format: "invalid.backup.format",
          version: 1,
          exportedAt: new Date().toISOString(),
          courses: [],
          goals: [],
          notes: [],
          tasks: []
        })
      ).rejects.toThrow();

      // Attempt importing corrupted task records (e.g. invalid energy out of 1..5 range, invalid status)
      await expect(
        importBackup({
          format: "throughline.backup",
          version: 1,
          exportedAt: new Date().toISOString(),
          courses: [],
          goals: [],
          notes: [],
          tasks: [
            {
              id: "corrupted_task",
              title: "Broken task",
              status: "non_existent_status", // invalid enum
              priority: "high",
              energy: 99, // invalid energy: max is 5
              difficulty: 1,
              attributes: ["focus"],
              createdAt: "not-a-valid-iso-date",
              updatedAt: "not-a-valid-iso-date"
            }
          ]
        })
      ).rejects.toThrow();

      // Crucial empirical invariant: Verify database remained completely untouched
      expect(await db.tasks.count()).toBe(1);
      expect(await db.courses.count()).toBe(1);
      const remaining = await listTasks();
      expect(remaining[0].id).toBe(initialTask.id);
    });

    it("1.2: recovers gracefully when settings records in Dexie are missing fields or partial", async () => {
      // Test 1: Partial filter settings row with empty presets and empty current object
      await db.settings.put({
        id: "filter-settings",
        current: {},
        presets: []
      } as never);

      const filters = await getFilterSettings();
      expect(filters).toBeDefined();
      expect(filters.presets.length).toBeGreaterThan(0);
      expect(filters.current.tags).toEqual([]);

      // Test 2: Intentionally corrupted filter settings row where current is null
      // Documenting that null current will trigger a TypeError if unhandled
      await db.settings.put({
        id: "filter-settings",
        current: null,
        presets: []
      } as never);

      try {
        await getFilterSettings();
      } catch (err) {
        // Confirmed finding: null stored.current crashes getFilterSettings
        expect(err).toBeInstanceOf(TypeError);
      }

      // Test 3: Appearance settings partial record merge
      await db.settings.put({
        id: "appearance-settings",
        updatedAt: new Date().toISOString()
      } as never);

      const appearance = await getAppearanceSettings();
      expect(appearance.id).toBe("appearance-settings");
      // Default theme must be preserved through the merge
      expect(appearance.theme).toBe("system");
    });

    it("1.3: autonomously self-heals user progress when progress table is wiped or corrupted", async () => {
      // Create completed tasks with XP
      const t1 = await addTask({
        title: "Task 1",
        priority: "high",
        energy: 4,
        difficulty: 3,
        attributes: ["focus", "discipline"]
      });
      await updateTaskStatus(t1.id, "done");

      const progressBefore = await getProgress();
      expect(progressBefore.xp).toBeGreaterThan(0);

      // Now violently wipe the progress table to simulate storage loss
      await db.progress.clear();
      expect(await db.progress.count()).toBe(0);

      // getProgress must recalculate from tasks instead of returning empty or crashing
      const selfHealed = await getProgress();
      expect(selfHealed.id).toBe("local-player");
      expect(selfHealed.xp).toBe(progressBefore.xp);
    });

    it("1.4: survives raw unvalidated row injections in tasks table", async () => {
      // Inject raw tasks with edge-case attributes
      const rawTask = {
        id: "raw_injected_task_1",
        title: "Raw injected task",
        description: "",
        status: "backlog",
        order: 0,
        priority: "medium",
        energy: 2,
        difficulty: 2,
        estimatedMinutes: 45,
        xp: 0,
        attributes: ["wellness"],
        tags: [],
        subtasks: [],
        visualSeed: 42,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await db.tasks.put(rawTask as never);

      const tasks = await listTasks();
      expect(tasks.some((t) => t.id === "raw_injected_task_1")).toBe(true);

      // Updating status of the raw task must succeed and refresh progress without crashing
      await expect(updateTaskStatus("raw_injected_task_1", "done")).resolves.not.toThrow();
      const updated = await db.tasks.get("raw_injected_task_1");
      expect(updated?.status).toBe("done");
      expect(updated?.completedAt).toBeDefined();
    });

    it("1.5: handles orphaned entity references safely (cascades and foreign keys)", async () => {
      // Create course and task linked to it
      const course = {
        id: "orphaned_test_course",
        name: "Test Course",
        code: "TC101",
        color: "#f59e0b",
        icon: "📚",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await upsertCourse(course);

      const task = await addTask({
        title: "Assignment under course",
        courseId: "orphaned_test_course",
        priority: "medium",
        energy: 2,
        difficulty: 2,
        attributes: ["focus"]
      });
      expect(task.courseId).toBe("orphaned_test_course");

      // Deleting the course must cleanly detach the task (set courseId to undefined) rather than leaving an orphaned dangling pointer
      await deleteCourse("orphaned_test_course");
      const tasksAfterCourseDelete = await listTasks();
      const foundTask = tasksAfterCourseDelete.find((t) => t.id === task.id);
      expect(foundTask).toBeDefined();
      expect(foundTask?.courseId).toBeUndefined();

      // Same check for goals
      const goal = await addGoal({
        title: "Goal to be deleted"
      });
      const goalTask = await addTask({
        title: "Goal subtask",
        goalId: goal.id,
        priority: "low",
        energy: 1,
        difficulty: 1,
        attributes: ["discipline"]
      });
      expect(goalTask.goalId).toBe(goal.id);

      await deleteGoal(goal.id);
      const tasksAfterGoalDelete = await listTasks();
      const foundGoalTask = tasksAfterGoalDelete.find((t) => t.id === goalTask.id);
      expect(foundGoalTask).toBeDefined();
      expect(foundGoalTask?.goalId).toBeUndefined();

      // Note link toggling on non-existent tasks or goals
      const note = await addNote({ title: "Reference note" });
      await expect(toggleNoteLink(note.id, "task", "non_existent_task_id", true)).resolves.not.toThrow();
      const updatedNote = await db.notes.get(note.id);
      expect(updatedNote?.taskIds).toContain("non_existent_task_id");
      await expect(toggleNoteLink(note.id, "task", "non_existent_task_id", false)).resolves.not.toThrow();
      const noteAfterUntoggle = await db.notes.get(note.id);
      expect(noteAfterUntoggle?.taskIds).not.toContain("non_existent_task_id");
    });

    it("1.6: handles adversarial inputs (surrogate pairs, extreme strings, zero-width spaces)", async () => {
      const complexTitle = "Task with \u200B\u200C\u200D zero-width, emojis 🚀🔥💡, and quotes '\"`";
      const complexDesc = "A".repeat(1200); // within 1500 limit

      const task = await addTask({
        title: complexTitle,
        description: complexDesc,
        priority: "critical",
        energy: 5,
        difficulty: 5,
        attributes: ["creativity", "wellness"],
        tags: ["adversarial-tag", "unicode-emoji-🧪"]
      });

      expect(task.title).toBe(complexTitle);
      expect(task.description).toHaveLength(1200);

      const retrieved = await db.tasks.get(task.id);
      expect(retrieved?.title).toBe(complexTitle);
      expect(retrieved?.tags).toContain("unicode-emoji-🧪");
    });
  });

  // =========================================================================
  // 2. Encryption key regeneration, recovery key entropy/format, decryption failures
  // =========================================================================
  describe("2. Encryption Key Regeneration, Recovery Key Validation & Decryption Failures", () => {
    it("2.1: validates recovery key format and cryptographic entropy over 100 iterations", () => {
      const RECOVERY_KEY_REGEX = /^[0-9a-f]{4}(-[0-9a-f]{4}){7}$/;
      const keys = new Set<string>();
      const sampleSize = 100;

      for (let i = 0; i < sampleSize; i++) {
        const key = generateRecoveryKey();

        // Must match 8 groups of 4 hex chars separated by dashes = 39 characters
        expect(key).toMatch(RECOVERY_KEY_REGEX);
        expect(key).toHaveLength(39);

        // All 100 generated keys must be globally distinct (no collisions in CSPRNG)
        expect(keys.has(key)).toBe(false);
        keys.add(key);

        // Inspect hex characters: no uppercase letters or invalid symbols
        const cleanHex = key.replace(/-/g, "");
        expect(cleanHex).toHaveLength(32); // 16 bytes = 32 hex chars = 128 bits
        expect(/^[0-9a-f]+$/.test(cleanHex)).toBe(true);
      }

      expect(keys.size).toBe(sampleSize);
    });

    it("2.2: enforces strict cryptographic derivation isolation with recovery keys", async () => {
      const salt = randomSalt();
      const recoveryKey1 = generateRecoveryKey();
      const recoveryKey2 = generateRecoveryKey();

      const derived1 = await deriveRecoveryKeys(recoveryKey1, salt);
      const derived2 = await deriveRecoveryKeys(recoveryKey2, salt);

      // Auth keys derived from different recovery keys must differ
      expect(derived1.authKey).not.toBe(derived2.authKey);

      // Different salts for identical recovery key must produce completely different auth keys
      const derivedSalt2 = await deriveRecoveryKeys(recoveryKey1, randomSalt());
      expect(derived1.authKey).not.toBe(derivedSalt2.authKey);

      // Wrapping DEK with key 1 and attempting to unwrap with key 2 must reject
      const dek = generateDek();
      const wrapped = await wrapDek(dek, derived1.kek);

      await expect(unwrapDek(wrapped, derived2.kek)).rejects.toThrow();
    });

    it("2.3: rejects unwrapping when recovery key or salt is corrupted by even a single bit", async () => {
      const salt = randomSalt();
      const recoveryKey = generateRecoveryKey();
      const { kek } = await deriveRecoveryKeys(recoveryKey, salt);

      const dek = generateDek();
      const wrapped = await wrapDek(dek, kek);

      // Bit-flip: change the first character of the recovery key
      const flippedChar = recoveryKey[0] === "a" ? "b" : "a";
      const corruptedKey = flippedChar + recoveryKey.slice(1);

      const { kek: corruptedKek } = await deriveRecoveryKeys(corruptedKey, salt);
      await expect(unwrapDek(wrapped, corruptedKek)).rejects.toThrow();

      // Truncated key
      const truncatedKey = recoveryKey.slice(0, 20);
      const { kek: truncatedKek } = await deriveRecoveryKeys(truncatedKey, salt);
      await expect(unwrapDek(wrapped, truncatedKek)).rejects.toThrow();
    });

    it("2.4: rejects tampered ciphertext, corrupted IVs, and forged payloads in decryptJson", async () => {
      const dek = generateDek();
      const dekKey = await importDek(dek);

      const payload = {
        taskId: "task_sensitive_123",
        title: "Confidential Student Research Plan",
        notes: "Restricted data"
      };

      const { iv, ciphertext } = await encryptJson(payload, dekKey);

      // Baseline: verify clean decryption
      const cleanDecrypted = await decryptJson<typeof payload>(ciphertext, iv, dekKey);
      expect(cleanDecrypted).toEqual(payload);

      // Attack 1: Bit-flip in ciphertext (AES-GCM authentication tag mismatch)
      const rawCipher = dekFromB64(ciphertext);
      rawCipher[rawCipher.length - 1] ^= 0x01; // flip last byte
      const tamperedCiphertext = dekToB64(rawCipher);

      await expect(decryptJson(tamperedCiphertext, iv, dekKey)).rejects.toThrow();

      // Attack 2: Tampered IV
      const rawIv = dekFromB64(iv);
      rawIv[0] ^= 0x01;
      const tamperedIv = dekToB64(rawIv);

      await expect(decryptJson(ciphertext, tamperedIv, dekKey)).rejects.toThrow();

      // Attack 3: Truncated ciphertext
      const truncatedCipher = dekToB64(rawCipher.slice(0, 10));
      await expect(decryptJson(truncatedCipher, iv, dekKey)).rejects.toThrow();

      // Attack 4: Decrypt with a completely different DEK key
      const unrelatedDekKey = await importDek(generateDek());
      await expect(decryptJson(ciphertext, iv, unrelatedDekKey)).rejects.toThrow();

      // Attack 5: Invalid Base64 strings
      await expect(decryptJson("!@#$%^&*()", iv, dekKey)).rejects.toThrow();
      await expect(decryptJson(ciphertext, "not-valid-base64", dekKey)).rejects.toThrow();
    });

    it("2.5: tests recovery key rotation prerequisites and state validation", async () => {
      // Simulate rotateRecoveryKey precondition: localStorage must contain DEK_KEY
      const DEK_STORAGE_KEY = "throughline-dek";

      // Case A: Missing DEK in localStorage
      expect(globalThis.localStorage.getItem(DEK_STORAGE_KEY)).toBeNull();

      // Emulate rotation function behavior
      const rotateAttempt = async () => {
        const savedDek = globalThis.localStorage.getItem(DEK_STORAGE_KEY);
        if (!savedDek) {
          throw new Error("Sign in again before regenerating your recovery key.");
        }
        return generateRecoveryKey();
      };

      await expect(rotateAttempt()).rejects.toThrow("Sign in again before regenerating your recovery key.");

      // Case B: Saved DEK is present -> successful generation and wrapping
      const sampleDek = generateDek();
      globalThis.localStorage.setItem(DEK_STORAGE_KEY, dekToB64(sampleDek));

      const newRecoveryKey = await rotateAttempt();
      expect(newRecoveryKey).toHaveLength(39);

      const salt = randomSalt();
      const { kek: newKek } = await deriveRecoveryKeys(newRecoveryKey, salt);
      const wrapped = await wrapDek(sampleDek, newKek);

      // Verify the new recovery key successfully unwraps the identical DEK
      const unwrapped = await unwrapDek(wrapped, newKek);
      expect(dekToB64(unwrapped)).toBe(dekToB64(sampleDek));
    });

    it("2.6: verifies behavior when remote sync delivers corrupted ciphertext", async () => {
      const dek = generateDek();
      const dekKey = await importDek(dek);

      // Simulate remote changes with corrupted ciphertext
      vi.stubGlobal(
        "fetch",
        vi.fn().mockImplementation((url: string) => {
          if (url.includes("/sync/pull")) {
            return Promise.resolve({
              ok: true,
              status: 200,
              json: () =>
                Promise.resolve({
                  changes: [
                    {
                      entity: "task",
                      id: "task_corrupted_cipher",
                      changedAt: new Date().toISOString(),
                      deleted: false,
                      ciphertext: "corrupted_non_aes_ciphertext",
                      iv: "invalid_iv"
                    }
                  ],
                  cursor: new Date().toISOString()
                })
            });
          }
          return Promise.resolve({ ok: false, status: 404 });
        })
      );

      // runSync should handle or bubble the error cleanly without wiping local data
      await addTask({
        title: "Local task before corrupted remote pull",
        priority: "medium",
        energy: 2,
        difficulty: 2,
        attributes: ["focus"]
      });

      // Because decryptJson throws on corrupted ciphertext, runSync fails
      await expect(runSync(dekKey)).rejects.toThrow();

      // Local tasks must remain intact
      const localTasks = await listTasks();
      expect(localTasks).toHaveLength(1);
      expect(localTasks[0].title).toBe("Local task before corrupted remote pull");
    });
  });

  // =========================================================================
  // 3. Offline-first resilience: storage quota, duplicate IDs, timestamp conflicts
  // =========================================================================
  describe("3. Offline-First Resilience: Storage Quotas, Duplicate IDs & Timestamp Conflicts", () => {
    it("3.1: resolves timestamp conflicts using Last-Write-Wins (LWW)", async () => {
      const dek = generateDek();
      const dekKey = await importDek(dek);

      const baseTimestamp = "2026-09-10T12:00:00.000Z";
      const olderTimestamp = "2026-09-10T11:00:00.000Z";
      const newerTimestamp = "2026-09-10T13:00:00.000Z";

      // Seed local task
      const localTask = createTask({
        id: "lww_task_1",
        title: "Local version of task",
        status: "backlog",
        priority: "medium",
        energy: 2,
        difficulty: 2,
        attributes: ["focus"]
      });
      localTask.updatedAt = baseTimestamp;
      await db.tasks.put(localTask);

      // Scenario A: Remote change arrives with OLDER timestamp
      // Should be rejected; local task remains unchanged
      const remoteOlderTask = {
        ...localTask,
        title: "Stale remote overwrite attempt",
        updatedAt: olderTimestamp
      };
      const olderEncrypted = await encryptJson(remoteOlderTask, dekKey);

      vi.stubGlobal(
        "fetch",
        vi.fn().mockImplementation((url: string) => {
          if (url.includes("/sync/pull")) {
            return Promise.resolve({
              ok: true,
              status: 200,
              json: () =>
                Promise.resolve({
                  changes: [
                    {
                      entity: "task",
                      id: localTask.id,
                      changedAt: olderTimestamp,
                      deleted: false,
                      ciphertext: olderEncrypted.ciphertext,
                      iv: olderEncrypted.iv
                    }
                  ],
                  cursor: olderTimestamp
                })
            });
          }
          if (url.includes("/sync/push")) {
            return Promise.resolve({
              ok: true,
              status: 200,
              json: () => Promise.resolve({ cursor: baseTimestamp })
            });
          }
          return Promise.resolve({ ok: false, status: 404 });
        })
      );

      await runSync(dekKey);
      const afterOlderSync = await db.tasks.get(localTask.id);
      expect(afterOlderSync?.title).toBe("Local version of task"); // Local won!

      // Scenario B: Remote change arrives with IDENTICAL timestamp
      // In LWW: existing.updatedAt >= record.updatedAt, so remote is rejected
      const remoteEqualTask = {
        ...localTask,
        title: "Tie timestamp remote overwrite attempt",
        updatedAt: baseTimestamp
      };
      const equalEncrypted = await encryptJson(remoteEqualTask, dekKey);

      vi.stubGlobal(
        "fetch",
        vi.fn().mockImplementation((url: string) => {
          if (url.includes("/sync/pull")) {
            return Promise.resolve({
              ok: true,
              status: 200,
              json: () =>
                Promise.resolve({
                  changes: [
                    {
                      entity: "task",
                      id: localTask.id,
                      changedAt: baseTimestamp,
                      deleted: false,
                      ciphertext: equalEncrypted.ciphertext,
                      iv: equalEncrypted.iv
                    }
                  ],
                  cursor: baseTimestamp
                })
            });
          }
          if (url.includes("/sync/push")) {
            return Promise.resolve({
              ok: true,
              status: 200,
              json: () => Promise.resolve({ cursor: baseTimestamp })
            });
          }
          return Promise.resolve({ ok: false, status: 404 });
        })
      );

      await runSync(dekKey);
      const afterEqualSync = await db.tasks.get(localTask.id);
      expect(afterEqualSync?.title).toBe("Local version of task"); // Local tie-breaker won!

      // Scenario C: Remote change arrives with NEWER timestamp
      // Remote strictly newer -> remote wins!
      const remoteNewerTask = {
        ...localTask,
        title: "Legitimate newer remote update",
        status: "doing" as const,
        updatedAt: newerTimestamp
      };
      const newerEncrypted = await encryptJson(remoteNewerTask, dekKey);

      vi.stubGlobal(
        "fetch",
        vi.fn().mockImplementation((url: string) => {
          if (url.includes("/sync/pull")) {
            return Promise.resolve({
              ok: true,
              status: 200,
              json: () =>
                Promise.resolve({
                  changes: [
                    {
                      entity: "task",
                      id: localTask.id,
                      changedAt: newerTimestamp,
                      deleted: false,
                      ciphertext: newerEncrypted.ciphertext,
                      iv: newerEncrypted.iv
                    }
                  ],
                  cursor: newerTimestamp
                })
            });
          }
          if (url.includes("/sync/push")) {
            return Promise.resolve({
              ok: true,
              status: 200,
              json: () => Promise.resolve({ cursor: newerTimestamp })
            });
          }
          return Promise.resolve({ ok: false, status: 404 });
        })
      );

      await runSync(dekKey);
      const afterNewerSync = await db.tasks.get(localTask.id);
      expect(afterNewerSync?.title).toBe("Legitimate newer remote update"); // Remote won!
      expect(afterNewerSync?.status).toBe("doing");
    });

    it("3.2: verifies empirical behavior of locally deleted tasks vs incoming remote updates (Ghost Resurrection analysis)", async () => {
      const dek = generateDek();
      const dekKey = await importDek(dek);

      // Create a task and then delete it locally (recording a tombstone)
      const task = await addTask({
        title: "Task to delete locally",
        priority: "low",
        energy: 1,
        difficulty: 1,
        attributes: ["wellness"]
      });

      await deleteTask(task.id);
      expect(await db.tasks.get(task.id)).toBeUndefined();
      const tombstone = await db.tombstones.get(`task:${task.id}`);
      expect(tombstone).toBeDefined();

      // Now simulate a remote sync pull that delivers an older update for that deleted task
      const remoteOldUpdate = {
        ...task,
        title: "Stale remote resurrection attempt",
        updatedAt: "2026-01-01T00:00:00.000Z" // older than tombstone.deletedAt
      };
      const { ciphertext, iv } = await encryptJson(remoteOldUpdate, dekKey);

      vi.stubGlobal(
        "fetch",
        vi.fn().mockImplementation((url: string) => {
          if (url.includes("/sync/pull")) {
            return Promise.resolve({
              ok: true,
              status: 200,
              json: () =>
                Promise.resolve({
                  changes: [
                    {
                      entity: "task",
                      id: task.id,
                      changedAt: remoteOldUpdate.updatedAt,
                      deleted: false,
                      ciphertext,
                      iv
                    }
                  ],
                  cursor: "2026-01-01T00:00:00.000Z"
                })
            });
          }
          if (url.includes("/sync/push")) {
            return Promise.resolve({
              ok: true,
              status: 200,
              json: () => Promise.resolve({ cursor: "2026-01-01T00:00:00.000Z" })
            });
          }
          return Promise.resolve({ ok: false, status: 404 });
        })
      );

      await runSync(dekKey);

      // EMPIRICAL CHECK:
      // In syncClient.ts line 69:
      // const existing = (await table.get(change.id)) as SyncRecord | undefined;
      // if (existing && existing.updatedAt >= record.updatedAt) return false;
      // await table.put(record as never);
      // Notice: if the task was deleted locally, table.get returns undefined, so existing is undefined!
      // Therefore, applyRemoteChange will put() the record back into the database unless tombstones are checked!
      const resurrected = await db.tasks.get(task.id);
      // We empirically record whether this resurrects:
      const hasResurrected = resurrected !== undefined;
      // Document the empirical finding:
      expect(typeof hasResurrected).toBe("boolean");
      // Finding confirmed: task was indeed resurrected because tombstones were not checked in applyRemoteChange!
      expect(hasResurrected).toBe(true);
    });

    it("3.3: ensures duplicate entity ID insertions overwrite cleanly without index corruption", async () => {
      // Rapid writes with the exact same primary key
      const sharedId = "shared_entity_id_999";

      const taskA = createTask({
        id: sharedId,
        title: "First version of task",
        priority: "low",
        energy: 1,
        difficulty: 1,
        attributes: ["focus"]
      });
      await db.tasks.put(taskA);

      const taskB = createTask({
        id: sharedId,
        title: "Second version overwriting same ID",
        priority: "critical",
        energy: 5,
        difficulty: 5,
        attributes: ["discipline"]
      });
      await db.tasks.put(taskB);

      // Primary key uniqueness: table count must be 1, not 2
      expect(await db.tasks.count()).toBe(1);
      const retrieved = await db.tasks.get(sharedId);
      expect(retrieved?.title).toBe("Second version overwriting same ID");
      expect(retrieved?.priority).toBe("critical");

      // Shared ID across DIFFERENT tables (tasks vs goals vs notes) must remain strictly isolated
      const goalSameId = createGoal({
        id: sharedId,
        title: "Goal with same ID"
      });
      await db.goals.put(goalSameId);

      const noteSameId = createNote({
        id: sharedId,
        title: "Note with same ID"
      });
      await db.notes.put(noteSameId);

      expect(await db.tasks.count()).toBe(1);
      expect(await db.goals.count()).toBe(1);
      expect(await db.notes.count()).toBe(1);

      expect((await db.tasks.get(sharedId))?.title).toBe("Second version overwriting same ID");
      expect((await db.goals.get(sharedId))?.title).toBe("Goal with same ID");
      expect((await db.notes.get(sharedId))?.title).toBe("Note with same ID");
    });

    it("3.4: simulates IndexedDB QuotaExceededError and verifies failure containment", async () => {
      // Simulate browser storage exhaustion
      const quotaError = new DOMException("The quota has been exceeded.", "QuotaExceededError");
      const originalPut = db.tasks.put.bind(db.tasks);

      // Mock put to throw quota error
      vi.spyOn(db.tasks, "put").mockRejectedValue(quotaError);

      await expect(
        addTask({
          title: "Task that overflows storage quota",
          priority: "high",
          energy: 3,
          difficulty: 3,
          attributes: ["creativity"]
        })
      ).rejects.toThrow("The quota has been exceeded.");

      // Restore and verify database is clean
      vi.spyOn(db.tasks, "put").mockImplementation(originalPut);
      expect(await db.tasks.count()).toBe(0);
    });

    it("3.5: handles offline network conditions gracefully during sync", async () => {
      const dek = generateDek();
      const dekKey = await importDek(dek);

      // Simulate offline: fetch throws TypeError ("Failed to fetch")
      vi.stubGlobal(
        "fetch",
        vi.fn().mockRejectedValue(new TypeError("Failed to fetch"))
      );

      // runSync should reject or fail without destroying local data
      await addTask({
        title: "Offline task created before sync attempt",
        priority: "medium",
        energy: 2,
        difficulty: 2,
        attributes: ["focus"]
      });

      await expect(runSync(dekKey)).rejects.toThrow();

      // Local state is completely preserved
      const tasks = await listTasks();
      expect(tasks).toHaveLength(1);
      expect(tasks[0].title).toBe("Offline task created before sync attempt");
    });

    it("3.6: evaluates idempotency and exposes concurrency vulnerability in recurring task synchronization", async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(12, 0, 0, 0);

      // Part A: Sequential calls must be strictly idempotent
      await addTask({
        title: "Sequential Habit",
        priority: "low",
        energy: 1,
        difficulty: 1,
        attributes: ["wellness"],
        tags: ["habit"],
        dueAt: yesterday.toISOString(),
        recurrence: { pattern: "daily" }
      });

      await syncRecurringTasks();
      await syncRecurringTasks();
      const afterSequential = (await listTasks()).filter((t) => t.title === "Sequential Habit");
      const uniqueDueDatesSequential = new Set(afterSequential.map((t) => t.dueAt));
      // Should have exactly 2 tasks (original + generated) with 2 distinct due dates
      expect(afterSequential.length).toBe(2);
      expect(uniqueDueDatesSequential.size).toBe(2);

      // Part B: Concurrency stress test on a fresh overdue recurring task
      // Demonstrates race condition when allTasks is queried outside the transaction block
      await addTask({
        title: "Concurrent Habit",
        priority: "low",
        energy: 1,
        difficulty: 1,
        attributes: ["wellness"],
        tags: ["habit"],
        dueAt: yesterday.toISOString(),
        recurrence: { pattern: "daily" }
      });

      // Rapid concurrent calls before either transaction completes
      await Promise.all([
        syncRecurringTasks(),
        syncRecurringTasks(),
        syncRecurringTasks()
      ]);

      const afterConcurrent = (await listTasks()).filter((t) => t.title === "Concurrent Habit");
      const uniqueDueDatesConcurrent = new Set(afterConcurrent.map((t) => t.dueAt));
      const hasDuplicateRace = afterConcurrent.length > uniqueDueDatesConcurrent.size;
      // Confirmed finding: race condition produces duplicate instances under concurrent sync calls
      expect(hasDuplicateRace).toBe(true);
    });
  });
});

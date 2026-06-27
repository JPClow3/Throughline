// @vitest-environment node
import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { fakeReminder, fakeSubscription } from "./test-helpers";
import { hashEndpoint, JsonPushStore } from "./store";

let directory: string;
let store: JsonPushStore;

beforeEach(async () => {
  directory = await mkdtemp(join(tmpdir(), "liquidglass-push-store-"));
  store = new JsonPushStore(join(directory, "push-store.json"));
});

afterEach(async () => {
  await rm(directory, { recursive: true, force: true });
});

describe("JsonPushStore", () => {
  it("replaces reminders for a subscription and dispatches by notifyAt", async () => {
    const subscription = fakeSubscription();
    const endpointHash = await store.upsertSubscription(subscription);
    const stored = await store.replaceReminders(endpointHash, [
      fakeReminder({ reminderId: "due", notifyAt: "2020-01-01T00:00:00.000Z" }),
      fakeReminder({ reminderId: "future", notifyAt: "2999-01-01T00:00:00.000Z" })
    ]);

    expect(stored).toHaveLength(2);
    expect(await store.dueReminders(new Date("2026-01-01T00:00:00.000Z"))).toHaveLength(1);

    await store.markDispatched(endpointHash, "due");

    expect(await store.dueReminders(new Date("2026-01-01T00:00:00.000Z"))).toHaveLength(0);
  });

  it("returns null when replacing reminders for a missing subscription", async () => {
    await expect(store.replaceReminders("missing-endpoint-hash-value", [fakeReminder()])).resolves.toBeNull();
  });

  it("serializes concurrent subscription writes", async () => {
    await Promise.all(
      Array.from({ length: 8 }, (_, index) =>
        store.upsertSubscription(fakeSubscription(`https://push.example.test/subscription/${index}`))
      )
    );

    expect(await store.counts()).toEqual({ subscriptions: 8, reminders: 0 });
  });

  it("hashes endpoints consistently", () => {
    expect(hashEndpoint("https://push.example.test/a")).toBe(hashEndpoint("https://push.example.test/a"));
    expect(hashEndpoint("https://push.example.test/a")).not.toBe(hashEndpoint("https://push.example.test/b"));
  });

  it("saves and updates individual reminders", async () => {
    const sub1 = fakeSubscription("https://push.example.test/1");
    const sub2 = fakeSubscription("https://push.example.test/2");
    await store.upsertSubscription(sub1);
    const hash2 = await store.upsertSubscription(sub2);
    
    // Save new
    const r1 = await store.saveReminder(sub1.endpoint, fakeReminder({ reminderId: "r1" }));
    // Update existing
    const r1Update = await store.saveReminder(sub1.endpoint, fakeReminder({ reminderId: "r1", notifyAt: r1.notifyAt }));
    
    expect(r1Update.dispatchedAt).toBe(r1.dispatchedAt);
    
    // Replace reminders, isolating between endpoints
    const rep = await store.replaceReminders(hash2, [fakeReminder({ reminderId: "r2" })]);
    expect(rep).toHaveLength(1);
    
    const counts = await store.counts();
    expect(counts.reminders).toBe(2);
    
    // Test read failure fallback
    await import("node:fs/promises").then(m => m.writeFile(join(directory, "push-store.json"), "invalid-json"));
    const newStore = new JsonPushStore(join(directory, "push-store.json"));
    expect(await newStore.counts()).toEqual({ subscriptions: 0, reminders: 0 });
  });
});

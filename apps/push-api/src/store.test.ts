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
});

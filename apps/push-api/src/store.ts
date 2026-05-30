import { RedactedReminder } from "@liquidglass-todo/domain";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

export type StoredSubscription = {
  endpointHash: string;
  subscription: WebPushSubscription;
  createdAt: string;
  lastSeenAt: string;
};

export type StoredReminder = RedactedReminder & {
  endpointHash: string;
  dispatchedAt?: string;
};

export type WebPushSubscription = {
  endpoint: string;
  expirationTime?: number | null;
  keys: {
    p256dh: string;
    auth: string;
  };
};

type StoreShape = {
  subscriptions: StoredSubscription[];
  reminders: StoredReminder[];
};

const emptyStore = (): StoreShape => ({ subscriptions: [], reminders: [] });

export interface PushStore {
  upsertSubscription(subscription: WebPushSubscription): Promise<string>;
  removeSubscription(endpointHash: string): Promise<void>;
  saveReminder(subscriptionEndpoint: string, reminder: RedactedReminder): Promise<StoredReminder>;
  replaceReminders(endpointHash: string, reminders: RedactedReminder[]): Promise<StoredReminder[] | null>;
  dueReminders(now?: Date): Promise<StoredReminder[]>;
  markDispatched(endpointHash: string, reminderId: string): Promise<void>;
  subscriptionFor(endpointHash: string): Promise<StoredSubscription | undefined>;
  counts(): Promise<{ subscriptions: number; reminders: number }>;
}

export class JsonPushStore implements PushStore {
  private writeQueue = Promise.resolve();

  constructor(private readonly filePath: string) {}

  async upsertSubscription(subscription: WebPushSubscription) {
    return this.mutate(async (store) => {
      const endpointHash = hashEndpoint(subscription.endpoint);
      const existing = store.subscriptions.find((item) => item.endpointHash === endpointHash);
      const now = new Date().toISOString();

      if (existing) {
        existing.subscription = subscription;
        existing.lastSeenAt = now;
      } else {
        store.subscriptions.push({ endpointHash, subscription, createdAt: now, lastSeenAt: now });
      }

      return endpointHash;
    });
  }

  async removeSubscription(endpointHash: string) {
    await this.mutate(async (store) => {
      store.subscriptions = store.subscriptions.filter((item) => item.endpointHash !== endpointHash);
      store.reminders = store.reminders.filter((item) => item.endpointHash !== endpointHash);
    });
  }

  async saveReminder(subscriptionEndpoint: string, reminder: RedactedReminder) {
    return this.mutate(async (store) => {
      const endpointHash = hashEndpoint(subscriptionEndpoint);
      const existingIndex = store.reminders.findIndex(
        (item) => item.endpointHash === endpointHash && item.reminderId === reminder.reminderId
      );
      const existing = existingIndex >= 0 ? store.reminders[existingIndex] : undefined;
      const stored = {
        ...reminder,
        endpointHash,
        dispatchedAt: existing?.notifyAt === reminder.notifyAt ? existing.dispatchedAt : undefined
      };

      if (existingIndex >= 0) {
        store.reminders[existingIndex] = stored;
      } else {
        store.reminders.push(stored);
      }

      return stored;
    });
  }

  async replaceReminders(endpointHash: string, reminders: RedactedReminder[]) {
    return this.mutate(async (store) => {
      const subscription = store.subscriptions.find((item) => item.endpointHash === endpointHash);
      if (!subscription) {
        return null;
      }

      const previous = new Map(
        store.reminders
          .filter((item) => item.endpointHash === endpointHash)
          .map((item) => [item.reminderId, item])
      );
      const nextReminders = reminders.map((reminder) => {
        const existing = previous.get(reminder.reminderId);
        return {
          ...reminder,
          endpointHash,
          dispatchedAt: existing?.notifyAt === reminder.notifyAt ? existing.dispatchedAt : undefined
        };
      });

      store.reminders = [
        ...store.reminders.filter((item) => item.endpointHash !== endpointHash),
        ...nextReminders
      ];

      return nextReminders;
    });
  }

  async dueReminders(now = new Date()) {
    const store = await this.readConsistent();
    return store.reminders.filter((item) => !item.dispatchedAt && new Date(item.notifyAt) <= now);
  }

  async markDispatched(endpointHash: string, reminderId: string) {
    await this.mutate(async (store) => {
      const reminder = store.reminders.find(
        (item) => item.endpointHash === endpointHash && item.reminderId === reminderId
      );
      if (reminder) {
        reminder.dispatchedAt = new Date().toISOString();
      }
    });
  }

  async subscriptionFor(endpointHash: string) {
    const store = await this.readConsistent();
    return store.subscriptions.find((item) => item.endpointHash === endpointHash);
  }

  async counts() {
    const store = await this.readConsistent();
    return {
      subscriptions: store.subscriptions.length,
      reminders: store.reminders.length
    };
  }

  private async mutate<T>(updater: (store: StoreShape) => Promise<T> | T): Promise<T> {
    const operation = this.writeQueue.then(async () => {
      const store = await this.read();
      const result = await updater(store);
      await this.write(store);
      return result;
    });

    this.writeQueue = operation.then(
      () => undefined,
      () => undefined
    );

    return operation;
  }

  private async readConsistent() {
    await this.writeQueue;
    return this.read();
  }

  private async read(): Promise<StoreShape> {
    try {
      return JSON.parse(await readFile(this.filePath, "utf8")) as StoreShape;
    } catch {
      return emptyStore();
    }
  }

  private async write(store: StoreShape) {
    await mkdir(dirname(this.filePath), { recursive: true });
    await writeFile(this.filePath, `${JSON.stringify(store, null, 2)}\n`, "utf8");
  }
}

export function hashEndpoint(endpoint: string) {
  return createHash("sha256").update(endpoint).digest("hex");
}

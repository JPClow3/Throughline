import cors from "@fastify/cors";
import Fastify from "fastify";
import webpush from "web-push";
import { hasVapidConfig, PushApiConfig, readPushApiConfig } from "./config";
import {
  BulkReminderSyncSchema,
  EndpointHashParamsSchema,
  PushSubscriptionSchema,
  ReminderEnvelopeSchema
} from "./schemas";
import { JsonPushStore, PushStore } from "./store";

type CreateServerOptions = {
  config?: PushApiConfig;
  store?: PushStore;
  configureWebPush?: boolean;
  sendNotification?: typeof webpush.sendNotification;
};

export function createServer(options: CreateServerOptions = {}) {
  const config = options.config ?? readPushApiConfig();
  const store = options.store ?? new JsonPushStore(config.storePath);
  const vapidConfigured = hasVapidConfig(config);
  const sendNotification = options.sendNotification ?? webpush.sendNotification.bind(webpush);

  if (vapidConfigured && options.configureWebPush !== false) {
    webpush.setVapidDetails(
      config.vapidSubject as string,
      config.vapidPublicKey as string,
      config.vapidPrivateKey as string
    );
  }

  const app = Fastify({ logger: true });

  app.register(cors, {
    origin: config.corsOrigin ?? true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
  });

  app.get("/health", async () => ({
    ok: true,
    vapidConfigured,
    ...(await store.counts())
  }));

  app.post("/subscriptions", async (request, reply) => {
    const subscription = PushSubscriptionSchema.parse(request.body);
    const endpointHash = await store.upsertSubscription(subscription);
    return reply.code(201).send({ endpointHash });
  });

  app.delete("/subscriptions/:endpointHash", async (request, reply) => {
    const params = EndpointHashParamsSchema.parse(request.params);
    await store.removeSubscription(params.endpointHash);
    return reply.code(204).send();
  });

  app.post("/reminders", async (request, reply) => {
    const envelope = ReminderEnvelopeSchema.parse(request.body);
    const stored = await store.saveReminder(envelope.subscriptionEndpoint, envelope.reminder);
    return reply.code(201).send({ reminderId: stored.reminderId, endpointHash: stored.endpointHash });
  });

  app.put("/subscriptions/:endpointHash/reminders", async (request, reply) => {
    const params = EndpointHashParamsSchema.parse(request.params);
    const body = BulkReminderSyncSchema.parse(request.body);
    const stored = await store.replaceReminders(params.endpointHash, body.reminders);

    if (!stored) {
      return reply.code(404).send({ error: "subscription-not-found" });
    }

    return { endpointHash: params.endpointHash, reminderCount: stored.length };
  });

  app.post("/dispatch-due", async (request, reply) => {
    if (config.dispatchToken) {
      const header = request.headers.authorization;
      if (header !== `Bearer ${config.dispatchToken}`) {
        return reply.code(401).send({ error: "unauthorized" });
      }
    }

    if (!vapidConfigured) {
      return reply.code(503).send({ sent: 0, skipped: "missing-vapid" });
    }

    const due = await store.dueReminders();
    let sent = 0;

    for (const reminder of due) {
      const subscription = await store.subscriptionFor(reminder.endpointHash);
      if (!subscription) {
        continue;
      }

      await sendNotification(
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
      await store.markDispatched(reminder.endpointHash, reminder.reminderId);
      sent += 1;
    }

    return { sent };
  });

  return app;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const config = readPushApiConfig();
  const app = createServer({ config });
  app.listen({ port: config.port, host: config.host }).catch((error) => {
    app.log.error(error);
    process.exit(1);
  });
}

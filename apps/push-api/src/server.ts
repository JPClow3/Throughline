import { pathToFileURL } from "node:url";
import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import Fastify from "fastify";
import webpush from "web-push";
import { registerAuthRoutes } from "./auth";
import { hasVapidConfig, PushApiConfig, readPushApiConfig } from "./config";
import {
  BulkReminderSyncSchema,
  EndpointHashParamsSchema,
  PushSubscriptionSchema,
  ReminderEnvelopeSchema
} from "./schemas";
import { JsonPushStore, PushStore } from "./store";
import { createUserStore, UserStore } from "./userStore";

type CreateServerOptions = {
  config?: PushApiConfig;
  store?: PushStore;
  userStore?: UserStore;
  configureWebPush?: boolean;
  sendNotification?: typeof webpush.sendNotification;
};

export async function createServer(options: CreateServerOptions = {}) {
  const config = options.config ?? readPushApiConfig();
  const store = options.store ?? new JsonPushStore(config.storePath);
  const userStore = options.userStore ?? createUserStore(config.dbPath ?? "data/throughline.db");
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

  // Register plugins before routes so their global hooks apply to every route.
  await app.register(rateLimit, {
    max: config.rateLimitMax ?? 120,
    timeWindow: "1 minute"
  });

  await app.register(cors, {
    origin: config.corsOrigin ?? true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true
  });

  await app.register(cookie, { secret: config.sessionSecret });

  // Tolerate body-less POSTs (e.g. the cron hitting /dispatch-due via
  // `wget --post-data=""`, which sends form-encoded) so they don't 415.
  app.addContentTypeParser(
    ["application/x-www-form-urlencoded", "text/plain"],
    (_request, _payload, done) => done(null, undefined)
  );

  registerAuthRoutes(app, userStore, config);

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

const isMainModule = process.argv[1] ? import.meta.url === pathToFileURL(process.argv[1]).href : false;

if (isMainModule) {
  const config = readPushApiConfig();
  createServer({ config })
    .then((app) =>
      app.listen({ port: config.port, host: config.host }).catch((error) => {
        app.log.error(error);
        process.exit(1);
      })
    )
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

import { RedactedReminderSchema } from "@liquidglass-todo/domain";
import { z } from "zod";

export const PushSubscriptionSchema = z
  .object({
    endpoint: z.string().url(),
    expirationTime: z.number().nullable().optional(),
    keys: z.object({
      p256dh: z.string().min(1),
      auth: z.string().min(1)
    })
  })
  .strict();

export const EndpointHashParamsSchema = z.object({
  endpointHash: z.string().min(24)
});

export const ReminderEnvelopeSchema = z
  .object({
    subscriptionEndpoint: z.string().url(),
    reminder: RedactedReminderSchema.strict()
  })
  .strict();

export const BulkReminderSyncSchema = z
  .object({
    reminders: z.array(RedactedReminderSchema.strict()).max(500)
  })
  .strict();

# Notifications

## Privacy Contract

Push notifications must be redacted in v1.

Allowed server-side:

- Push subscription endpoint and keys.
- Hashed endpoint ID.
- Reminder ID.
- Opaque task ID.
- Due datetime.
- Notification datetime.
- Urgency.
- Generic title and body.
- Dispatch status.

Not allowed server-side:

- Task title.
- Task description.
- Course name or code.
- Tags.
- Subtasks.
- Full task record.

## Local Browser Notifications

`apps/web/src/lib/notifications.ts` handles:

- Capability detection.
- Permission request.
- Generic local test notification.

Local notification text is also generic:

- Title: `Quest reminder`
- Body: `A study quest needs your attention.`

## Push API Setup

Generate VAPID keys:

```powershell
npm run vapid -w apps/push-api
```

Set environment variables for `apps/push-api`:

```powershell
$env:VAPID_PUBLIC_KEY="..."
$env:VAPID_PRIVATE_KEY="..."
$env:VAPID_SUBJECT="mailto:you@example.com"
npm run dev:push
```

Optional store path:

```powershell
$env:PUSH_STORE_PATH="data/push-store.json"
```

Set web app variables:

```powershell
$env:VITE_PUSH_API_URL="http://127.0.0.1:8787"
$env:VITE_VAPID_PUBLIC_KEY="..."
npm run dev:web
```

## Push API Endpoints

`GET /health`

Returns service health, VAPID configuration state, and counts.

`POST /subscriptions`

Stores or refreshes a browser push subscription.

`DELETE /subscriptions/:endpointHash`

Deletes a subscription and its reminders.

`POST /reminders`

Stores a single redacted reminder envelope. This endpoint is kept for compatibility and low-level testing:

```json
{
  "subscriptionEndpoint": "https://push.example/...",
  "reminder": {
    "reminderId": "reminder_task_123",
    "taskId": "task_123",
    "dueAt": "2026-05-29T18:00:00.000Z",
    "notifyAt": "2026-05-29T17:30:00.000Z",
    "urgency": "high",
    "title": "Quest reminder",
    "body": "A study quest needs your attention.",
    "createdAt": "2026-05-29T12:00:00.000Z"
  }
}
```

`PUT /subscriptions/:endpointHash/reminders`

Replaces all redacted reminders for the subscription. This is the main v1 client sync endpoint.
The client still sends an empty `reminders` array when no active reminders remain so the push service clears stale scheduled notifications:

```json
{
  "reminders": [
    {
      "reminderId": "reminder_task_123",
      "taskId": "task_123",
      "dueAt": "2026-05-29T18:00:00.000Z",
      "notifyAt": "2026-05-29T17:30:00.000Z",
      "urgency": "high",
      "title": "Quest reminder",
      "body": "A study quest needs your attention.",
      "createdAt": "2026-05-29T12:00:00.000Z"
    }
  ]
}
```

`POST /dispatch-due`

Dispatches reminders where `notifyAt <= now` if VAPID is configured. Returns `503` with `missing-vapid` when keys are absent.

## Client Sync Flow

1. User subscribes from Settings.
2. Web app stores `pushApiUrl`, `endpointHash`, and subscription endpoint in IndexedDB settings.
3. Web app derives redacted reminders from local tasks.
4. Web app calls `PUT /subscriptions/:endpointHash/reminders`.
5. Future task changes attempt reminder sync in the background.
6. Sync failures are stored as `lastReminderSyncError` and do not roll back local task writes.

## Scheduling dispatch

`/dispatch-due` must be triggered periodically. The Docker deployment includes an
**ofelia** cron sidecar that calls it every 5 minutes over the internal network
(see `docker-compose.yml` and [deployment.md](./deployment.md)). When
`DISPATCH_TOKEN` is set, the endpoint requires `Authorization: Bearer <token>`
and ofelia passes it automatically.

For non-Docker setups, wire any external scheduler (system cron, a serverless
timer, etc.) to `POST /dispatch-due`.

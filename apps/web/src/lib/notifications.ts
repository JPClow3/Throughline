import { RedactedReminder, Task, createRedactedReminder } from "@throughline/domain";

export function notificationSupport() {
  return {
    notification: "Notification" in window,
    serviceWorker: "serviceWorker" in navigator,
    pushManager: "PushManager" in window
  };
}

export async function requestNotificationPermission() {
  if (!("Notification" in window)) {
    return "unsupported" as const;
  }

  return Notification.requestPermission();
}

export function showLocalQuestNotification() {
  if (!("Notification" in window) || Notification.permission !== "granted") {
    return false;
  }

  new Notification("Quest reminder", {
    body: "A study quest needs your attention.",
    icon: "/pwa-192x192.png",
    badge: "/favicon-48x48.png"
  });

  return true;
}

export async function registerPushSubscription(apiBaseUrl: string, vapidPublicKey: string) {
  if (!notificationSupport().pushManager || !vapidPublicKey) {
    throw new Error("Push notifications are not available in this browser.");
  }

  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
  });

  const response = await fetch(`${apiBaseUrl.replace(/\/$/, "")}/subscriptions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(subscription)
  });

  if (!response.ok) {
    throw new Error(`Push subscription failed with ${response.status}`);
  }

  const payload = (await response.json()) as { endpointHash: string };

  return {
    subscription,
    endpointHash: payload.endpointHash
  };
}

export function redactedRemindersForTasks(tasks: Task[]): RedactedReminder[] {
  return tasks.map((task) => createRedactedReminder(task)).filter(Boolean) as RedactedReminder[];
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let index = 0; index < rawData.length; index += 1) {
    outputArray[index] = rawData.charCodeAt(index);
  }

  return outputArray;
}

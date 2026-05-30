export type PushApiConfig = {
  host: string;
  port: number;
  storePath: string;
  vapidPublicKey?: string;
  vapidPrivateKey?: string;
  vapidSubject?: string;
  /** When set, POST /dispatch-due requires `Authorization: Bearer <token>`. */
  dispatchToken?: string;
  /** When set, CORS is restricted to this origin instead of allowing all. */
  corsOrigin?: string;
};

export function readPushApiConfig(env: NodeJS.ProcessEnv = process.env): PushApiConfig {
  return {
    host: env.HOST ?? "127.0.0.1",
    port: Number(env.PORT ?? 8787),
    storePath: env.PUSH_STORE_PATH ?? "data/push-store.json",
    vapidPublicKey: env.VAPID_PUBLIC_KEY,
    vapidPrivateKey: env.VAPID_PRIVATE_KEY,
    vapidSubject: env.VAPID_SUBJECT,
    dispatchToken: env.DISPATCH_TOKEN || undefined,
    corsOrigin: env.CORS_ORIGIN || undefined
  };
}

export function hasVapidConfig(config: PushApiConfig) {
  return Boolean(config.vapidPublicKey && config.vapidPrivateKey && config.vapidSubject);
}

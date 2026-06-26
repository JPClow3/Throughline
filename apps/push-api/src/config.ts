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
  /** Max requests per IP per minute (rate limiting). */
  rateLimitMax?: number;
  /** SQLite database path for accounts + encrypted sync records. */
  dbPath?: string;
  /** Secret used to sign session cookies (optional but recommended). */
  sessionSecret?: string;
  /** Whether session cookies require HTTPS (default true; set false only for local plain-http). */
  cookieSecure?: boolean;
  /** Whether the server is behind a proxy like Traefik (default true). */
  trustProxy?: boolean;
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
    corsOrigin: env.CORS_ORIGIN || undefined,
    rateLimitMax: Number(env.RATE_LIMIT_MAX ?? 120),
    dbPath: env.DB_PATH ?? "data/throughline.db",
    sessionSecret: env.SESSION_SECRET || undefined,
    cookieSecure: env.COOKIE_SECURE !== "false",
    trustProxy: env.TRUST_PROXY !== "false"
  };
}

export function hasVapidConfig(config: PushApiConfig) {
  return Boolean(config.vapidPublicKey && config.vapidPrivateKey && config.vapidSubject);
}

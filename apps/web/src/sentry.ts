import * as Sentry from '@sentry/browser'

const dsn = import.meta.env.VITE_SENTRY_DSN

if (dsn) {
  Sentry.init({
    dsn,
    environment: import.meta.env.VITE_SENTRY_ENVIRONMENT ?? import.meta.env.MODE,
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 1,
    sendDefaultPii: false,
  })
}

/**
 * Report an error to Sentry when configured, always to console in dev/test.
 * Never includes task content — callers must pass Error objects only.
 */
export function reportError(error: unknown, context?: Record<string, string>) {
  if (dsn) {
    if (context) {
      Sentry.withScope((scope) => {
        for (const [key, value] of Object.entries(context)) scope.setTag(key, value);
        Sentry.captureException(error);
      });
    } else {
      Sentry.captureException(error);
    }
  } else if (import.meta.env.DEV) {
    console.error("[throughline]", error, context ?? "");
  }
}

/** Fire-and-forget helper: report rejections instead of surfacing unhandledrejection. */
export function fireAndForget(promise: Promise<unknown>, context?: Record<string, string>) {
  promise.catch((error) => reportError(error, context));
}

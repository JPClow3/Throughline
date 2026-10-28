/** Build the public /verify-email URL for a one-time token (dev/fallback when Resend is unset). */
export function buildVerifyEmailLink(token: string, origin = typeof window !== "undefined" ? window.location.origin : ""): string {
  const base = origin.replace(/\/$/, "");
  return `${base}/verify-email?token=${encodeURIComponent(token)}`;
}

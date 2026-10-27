/**
 * Optional transactional email via Resend.
 * Verification messages never include planner/task content — only a verify link.
 */

export type MailConfig = {
  resendApiKey?: string;
  emailFrom?: string;
  /** Web app origin used to build /verify-email links. */
  publicAppUrl?: string;
};

export type VerificationMailResult = {
  sent: boolean;
  verifyUrl: string;
};

function appOrigin(config: MailConfig): string {
  return (config.publicAppUrl ?? "http://127.0.0.1:5173").replace(/\/$/, "");
}

export function buildVerifyEmailUrl(config: MailConfig, token: string): string {
  return `${appOrigin(config)}/verify-email?token=${encodeURIComponent(token)}`;
}

export async function sendVerificationEmail(
  config: MailConfig,
  input: { to: string; token: string }
): Promise<VerificationMailResult> {
  const verifyUrl = buildVerifyEmailUrl(config, input.token);

  if (!config.resendApiKey || !config.emailFrom) {
    // Dev-only signal — never log the recipient or one-time token URL.
    console.info("[email] Verification mail skipped (RESEND_API_KEY / EMAIL_FROM unset); token returned to caller when applicable.");
    return { sent: false, verifyUrl };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.resendApiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: config.emailFrom,
        to: [input.to],
        subject: "Verify your Throughline email",
        text: [
          "Confirm your Throughline account email.",
          "",
          `Open this link to verify: ${verifyUrl}`,
          "",
          "If you did not create an account, you can ignore this message.",
          "This message never includes your tasks or planner content."
        ].join("\n")
      })
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.warn(`[email] Resend failed (${res.status}): ${detail.slice(0, 200)}`);
      return { sent: false, verifyUrl };
    }

    return { sent: true, verifyUrl };
  } catch (err) {
    console.warn("[email] Resend request error:", err);
    return { sent: false, verifyUrl };
  }
}

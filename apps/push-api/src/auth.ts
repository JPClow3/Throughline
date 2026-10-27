import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { OAuth2Client } from "google-auth-library";
import type { PushApiConfig } from "./config";
import { sendVerificationEmail, type MailConfig } from "./mail";
import type { UserStore } from "./userStore";

export const SESSION_COOKIE = "tl_session";
const SESSION_MAX_AGE = 30 * 24 * 60 * 60; // seconds

// authKey / wrappedDek / salt are client-side base64/hex blobs — bound the size.
const blob = z.string().min(1).max(4096);
const SignupSchema = z.object({
  email: z.string().email().max(254),
  salt: blob,
  authKey: blob,
  wrappedDek: blob,
  recoveryAuthKey: blob,
  recoveryWrappedDek: blob
});
const LoginSchema = z.object({ email: z.string().email().max(254), authKey: blob });
const SaltSchema = z.object({ email: z.string().email().max(254) });
const VerifyEmailSchema = z.object({ token: z.string().min(16).max(128) });

// Tighter limit on auth endpoints to slow credential stuffing.
const authRateLimit = { config: { rateLimit: { max: 12, timeWindow: "1 minute" } } };

function mailConfigFrom(config: PushApiConfig): MailConfig {
  return {
    resendApiKey: config.resendApiKey,
    emailFrom: config.emailFrom,
    publicAppUrl: config.publicAppUrl
  };
}

function setSessionCookie(reply: FastifyReply, token: string, secure: boolean) {
  reply.setCookie(SESSION_COOKIE, token, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
    signed: false
  });
}

/** Resolve the authenticated user for a request, or null. Used by auth + sync routes. */
export function userFromRequest(request: FastifyRequest, userStore: UserStore) {
  const token = request.cookies?.[SESSION_COOKIE];
  if (!token) {
    return null;
  }
  return userStore.getSessionUser(token);
}

async function issueVerification(userStore: UserStore, config: PushApiConfig, userId: string, email: string) {
  const verificationToken = userStore.createEmailVerificationToken(userId);
  const mail = await sendVerificationEmail(mailConfigFrom(config), { to: email, token: verificationToken });
  return { verificationToken, mailSent: mail.sent };
}

export function registerAuthRoutes(app: FastifyInstance, userStore: UserStore, config: PushApiConfig) {
  const secure = config.cookieSecure ?? true;

  app.post("/auth/signup", authRateLimit, async (request, reply) => {
    const body = SignupSchema.parse(request.body);
    const user = userStore.createUser(body);
    if (!user) {
      return reply.code(409).send({ error: "email-taken" });
    }
    const { verificationToken, mailSent } = await issueVerification(userStore, config, user.id, user.email);
    const token = userStore.createSession(user.id);
    setSessionCookie(reply, token, secure);
    return reply.code(201).send({
      email: user.email,
      emailVerified: false,
      ...(mailSent ? {} : { verificationToken })
    });
  });

  const GoogleAuthSchema = z.object({ credential: z.string(), dek: z.string().optional() });
  const googleClient = config.googleClientId ? new OAuth2Client(config.googleClientId) : null;

  app.post("/auth/google", authRateLimit, async (request, reply) => {
    if (!googleClient || !config.googleClientId) {
      return reply.code(501).send({ error: "google-auth-not-configured" });
    }

    const { credential, dek } = GoogleAuthSchema.parse(request.body);

    let payload;
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: config.googleClientId
      });
      payload = ticket.getPayload();
    } catch {
      return reply.code(401).send({ error: "invalid-google-credential" });
    }

    if (!payload || !payload.email || !payload.sub) {
      return reply.code(401).send({ error: "invalid-google-payload" });
    }

    const email = payload.email.trim().toLowerCase();
    const googleId = payload.sub;

    let result = userStore.verifyGoogleLogin(email, googleId);
    let created = false;

    if (!result) {
      // Create user if not exists
      if (!dek) {
        return reply.code(400).send({ error: "dek-required-for-signup" });
      }
      const newUser = userStore.createGoogleUser({ email, googleId, dek });
      if (!newUser) {
        // If email already taken but not by this googleId (e.g. password user)
        return reply.code(409).send({ error: "email-taken-by-another-method" });
      }
      result = { userId: newUser.id, dek: newUser.wrappedDek };
      created = true;
    }

    const token = userStore.createSession(result.userId);
    setSessionCookie(reply, token, secure);

    return { email, dek: result.dek, created, emailVerified: true };
  });

  // Pre-login: client needs the per-user salt to derive its keys.
  app.post("/auth/salt", authRateLimit, async (request, reply) => {
    const { email } = SaltSchema.parse(request.body);
    const salt = userStore.getSalt(email);
    if (!salt) {
      return reply.code(404).send({ error: "unknown-account" });
    }
    return { salt };
  });

  app.post("/auth/login", authRateLimit, async (request, reply) => {
    const { email, authKey } = LoginSchema.parse(request.body);
    const result = userStore.verifyLogin(email, authKey);
    if (!result) {
      return reply.code(401).send({ error: "invalid-credentials" });
    }
    const token = userStore.createSession(result.userId);
    setSessionCookie(reply, token, secure);
    return {
      email: email.trim().toLowerCase(),
      salt: result.salt,
      wrappedDek: result.wrappedDek,
      emailVerified: userStore.isEmailVerified(result.userId)
    };
  });

  app.post("/auth/logout", async (request, reply) => {
    const token = request.cookies?.[SESSION_COOKIE];
    if (token) {
      userStore.deleteSession(token);
    }
    reply.clearCookie(SESSION_COOKIE, { path: "/" });
    return reply.code(204).send();
  });

  app.get("/auth/me", async (request, reply) => {
    const user = userFromRequest(request, userStore);
    if (!user) {
      return reply.code(401).send({ error: "unauthenticated" });
    }
    return { email: user.email, emailVerified: user.emailVerified };
  });

  async function handleVerifyEmail(token: string, reply: FastifyReply) {
    const result = userStore.verifyEmailWithToken(token);
    if (!result) {
      return reply.code(400).send({ error: "invalid-or-expired-token" });
    }
    return {
      email: result.email,
      emailVerified: true,
      ...(result.alreadyVerified ? { alreadyVerified: true } : {})
    };
  }

  app.get("/auth/verify-email", authRateLimit, async (request, reply) => {
    const query = VerifyEmailSchema.safeParse(request.query);
    if (!query.success) {
      return reply.code(400).send({ error: "missing-token" });
    }
    return handleVerifyEmail(query.data.token, reply);
  });

  app.post("/auth/verify-email", authRateLimit, async (request, reply) => {
    const body = VerifyEmailSchema.safeParse(request.body);
    if (!body.success) {
      return reply.code(400).send({ error: "missing-token" });
    }
    return handleVerifyEmail(body.data.token, reply);
  });

  app.post("/auth/resend-verification", authRateLimit, async (request, reply) => {
    const user = userFromRequest(request, userStore);
    if (!user) {
      return reply.code(401).send({ error: "unauthenticated" });
    }
    if (user.emailVerified) {
      return { email: user.email, emailVerified: true, alreadyVerified: true };
    }
    const { verificationToken, mailSent } = await issueVerification(userStore, config, user.userId, user.email);
    return {
      email: user.email,
      emailVerified: false,
      mailSent,
      ...(mailSent ? {} : { verificationToken })
    };
  });

  const UpdatePasswordSchema = z.object({ authKey: blob, wrappedDek: blob });
  const UpdateRecoveryKeySchema = z.object({
    recoveryAuthKey: blob,
    recoveryWrappedDek: blob,
    salt: blob.optional()
  });

  app.post("/auth/update-password", authRateLimit, async (request, reply) => {
    const user = userFromRequest(request, userStore);
    if (!user) {
      return reply.code(401).send({ error: "unauthenticated" });
    }
    const { authKey, wrappedDek } = UpdatePasswordSchema.parse(request.body);
    userStore.updatePassword(user.userId, authKey, wrappedDek);
    return reply.code(204).send();
  });

  app.post("/auth/update-recovery-key", authRateLimit, async (request, reply) => {
    const user = userFromRequest(request, userStore);
    if (!user) {
      return reply.code(401).send({ error: "unauthenticated" });
    }
    const { recoveryAuthKey, recoveryWrappedDek, salt } = UpdateRecoveryKeySchema.parse(request.body);
    if (salt) {
      userStore.ensureSalt(user.userId, salt);
    }
    userStore.updateRecoveryKey(user.userId, recoveryAuthKey, recoveryWrappedDek);
    return reply.code(204).send();
  });
}

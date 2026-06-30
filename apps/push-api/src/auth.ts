import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { OAuth2Client } from "google-auth-library";
import type { PushApiConfig } from "./config";
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

// Tighter limit on auth endpoints to slow credential stuffing.
const authRateLimit = { config: { rateLimit: { max: 12, timeWindow: "1 minute" } } };

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

export function registerAuthRoutes(app: FastifyInstance, userStore: UserStore, config: PushApiConfig) {
  const secure = config.cookieSecure ?? true;

  app.post("/auth/signup", authRateLimit, async (request, reply) => {
    const body = SignupSchema.parse(request.body);
    const user = userStore.createUser(body);
    if (!user) {
      return reply.code(409).send({ error: "email-taken" });
    }
    const token = userStore.createSession(user.id);
    setSessionCookie(reply, token, secure);
    return reply.code(201).send({ email: user.email });
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
    }
    
    const token = userStore.createSession(result.userId);
    setSessionCookie(reply, token, secure);
    
    return { email, dek: result.dek };
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
    return { email: email.trim().toLowerCase(), salt: result.salt, wrappedDek: result.wrappedDek };
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
    return { email: user.email };
  });

  const UpdatePasswordSchema = z.object({ authKey: blob, wrappedDek: blob });
  const UpdateRecoveryKeySchema = z.object({ recoveryAuthKey: blob, recoveryWrappedDek: blob });

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
    const { recoveryAuthKey, recoveryWrappedDek } = UpdateRecoveryKeySchema.parse(request.body);
    userStore.updateRecoveryKey(user.userId, recoveryAuthKey, recoveryWrappedDek);
    return reply.code(204).send();
  });
}

import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import csrfProtection from "@fastify/csrf-protection";
import helmet from "@fastify/helmet";
import type { FastifyInstance } from "fastify";
import type { Env } from "@/backend/config/env";

function csrfCookieName(env: Env) {
  return env.NODE_ENV === "production" ? "__Secure-shi_csrf" : "shi_csrf";
}

export function cookieOptions(env: Env) {
  return {
    path: "/",
    sameSite: "lax" as const,
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    signed: Boolean(env.cookieSecret),
    ...(env.cookieDomain ? { domain: env.cookieDomain } : {}),
  };
}

export async function registerSecurity(app: FastifyInstance, env: Env) {
  await app.register(helmet, {
    global: true,
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  });

  await app.register(cors, {
    origin(origin, callback) {
      if (!origin) {
        callback(null, true);
        return;
      }
      callback(null, env.corsOrigins.includes(origin));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "X-CSRF-Token", "Authorization"],
    maxAge: 600,
  });

  await app.register(cookie, env.cookieSecret ? { secret: env.cookieSecret } : {});

  await app.register(csrfProtection, {
    cookieKey: csrfCookieName(env),
    cookieOpts: cookieOptions(env),
    getToken(request) {
      const header = request.headers["x-csrf-token"] ?? request.headers["csrf-token"];
      return typeof header === "string" ? header : undefined;
    },
  });
}

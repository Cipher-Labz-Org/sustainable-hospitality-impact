import path from "node:path";
import dotenv from "dotenv";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  HOST: z.string().min(1).default("127.0.0.1"),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required."),
  AUTH_SECRET: z.string().optional(),
  STORAGE_ROOT: z.string().optional(),
  CORS_ORIGINS: z.string().optional(),
  COOKIE_DOMAIN: z.string().optional(),
  PUBLIC_SIGNUP: z.string().optional(),
  PUPPETEER_EXECUTABLE_PATH: z.string().optional(),
});

export type Env = z.infer<typeof envSchema> & {
  corsOrigins: string[];
  cookieDomain?: string;
  cookieSecret?: string;
};

let cached: Env | undefined;

function emptyToUndefined(value: string | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

export function loadEnv(): Env {
  if (cached) return cached;

  dotenv.config({ path: path.resolve(process.cwd(), ".env"), quiet: true });
  dotenv.config({ path: path.resolve(process.cwd(), "backend", ".env"), quiet: true });

  const parsed = envSchema.safeParse({
    ...process.env,
    AUTH_SECRET: emptyToUndefined(process.env.AUTH_SECRET),
    STORAGE_ROOT: emptyToUndefined(process.env.STORAGE_ROOT),
    CORS_ORIGINS: emptyToUndefined(process.env.CORS_ORIGINS),
    COOKIE_DOMAIN: emptyToUndefined(process.env.COOKIE_DOMAIN),
    PUBLIC_SIGNUP: emptyToUndefined(process.env.PUBLIC_SIGNUP),
    PUPPETEER_EXECUTABLE_PATH: emptyToUndefined(process.env.PUPPETEER_EXECUTABLE_PATH),
  });

  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const field = issue.path.join(".") || "env";
    throw new Error(`Invalid environment: ${field} ${issue.message}`);
  }

  const corsOrigins = (parsed.data.CORS_ORIGINS ?? "http://localhost:3000")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (corsOrigins.length === 0) {
    throw new Error("CORS_ORIGINS must list at least one allowed origin.");
  }

  cached = {
    ...parsed.data,
    corsOrigins,
    cookieDomain: parsed.data.COOKIE_DOMAIN,
    cookieSecret: parsed.data.AUTH_SECRET,
  };
  return cached;
}

export function getEnv(): Env {
  return cached ?? loadEnv();
}

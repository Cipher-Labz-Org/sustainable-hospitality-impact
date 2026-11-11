import Fastify from "fastify";
import type { FastifyInstance } from "fastify";
import { getEnv } from "@/backend/config/env";
import { prisma } from "@/backend/lib/prisma";
import { registerMultipart } from "@/backend/plugins/multipart";
import { registerSecurity } from "@/backend/plugins/security";
import { healthRoutes } from "@/backend/routes/health";
import { csrfRoutes } from "@/backend/routes/v1/csrf";

export async function buildApp(): Promise<FastifyInstance> {
  const env = getEnv();
  const app = Fastify({
    trustProxy: true,
    logger: {
      level: env.NODE_ENV === "production" ? "info" : "debug",
      redact: {
        paths: [
          "req.headers.authorization",
          "req.headers.cookie",
          "req.headers['x-csrf-token']",
          "DATABASE_URL",
          "AUTH_SECRET",
        ],
        censor: "[redacted]",
      },
    },
  });

  await registerSecurity(app, env);
  await registerMultipart(app);
  await app.register(healthRoutes);
  await app.register(csrfRoutes, { prefix: "/v1" });

  app.setNotFoundHandler((_request, reply) => {
    reply.status(404).send({ ok: false, error: "Not found." });
  });

  app.setErrorHandler((error, request, reply) => {
    const message = error instanceof Error ? error.message : "The request could not be completed.";
    request.log.error({ err: error }, message);
    const statusCode =
      error && typeof error === "object" && "statusCode" in error && typeof error.statusCode === "number"
        ? error.statusCode
        : 500;
    const status = statusCode >= 400 ? statusCode : 500;
    reply.status(status).send({
      ok: false,
      error: status >= 500 ? "The request could not be completed." : message,
    });
  });

  app.addHook("onClose", async () => {
    await prisma.$disconnect();
  });

  return app;
}

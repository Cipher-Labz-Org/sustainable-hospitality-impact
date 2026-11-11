import type { FastifyInstance } from "fastify";
import { liveness, readiness } from "@/backend/services/health";

export async function healthRoutes(app: FastifyInstance) {
  app.get("/health", async () => ({
    ok: true as const,
    data: liveness(),
  }));

  app.get("/ready", async (_request, reply) => {
    const report = await readiness();
    if (!report.ready) {
      return reply.status(503).send({
        ok: false as const,
        error: "Service not ready.",
        checks: report.checks,
      });
    }
    return {
      ok: true as const,
      data: report.checks,
    };
  });
}

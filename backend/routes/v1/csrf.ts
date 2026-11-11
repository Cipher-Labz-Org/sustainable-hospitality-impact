import type { FastifyInstance } from "fastify";

export async function csrfRoutes(app: FastifyInstance) {
  app.get("/auth/csrf", async (_request, reply) => {
    const csrfToken = reply.generateCsrf();
    return {
      ok: true as const,
      data: { csrfToken },
    };
  });
}

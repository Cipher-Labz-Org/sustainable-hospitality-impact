import multipart from "@fastify/multipart";
import type { FastifyInstance } from "fastify";

const MAX_EVIDENCE_BYTES = 15 * 1024 * 1024;

export async function registerMultipart(app: FastifyInstance) {
  await app.register(multipart, {
    limits: {
      fileSize: MAX_EVIDENCE_BYTES,
      files: 20,
      fields: 20,
    },
  });
}

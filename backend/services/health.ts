import { constants } from "node:fs";
import { access, mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/backend/lib/prisma";
import { resolveSystemChromiumExecutable } from "@/backend/lib/chromium-path";
import { storageRoot } from "@/backend/lib/storage";

export type ProbeStatus = "ok" | "error" | "missing";

export type ReadyReport = {
  database: ProbeStatus;
  storage: ProbeStatus;
  chromium: ProbeStatus;
};

export function liveness() {
  return { status: "ok" as const };
}

async function probeDatabase(): Promise<ProbeStatus> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return "ok";
  } catch {
    return "error";
  }
}

async function probeStorage(): Promise<ProbeStatus> {
  const root = storageRoot();
  const probe = path.join(root, `.ready-${process.pid}`);
  try {
    await mkdir(root, { recursive: true });
    await writeFile(probe, "ok");
    await access(root, constants.W_OK);
    return "ok";
  } catch {
    return "error";
  } finally {
    await unlink(probe).catch(() => undefined);
  }
}

async function probeChromium(): Promise<ProbeStatus> {
  const executable = await resolveSystemChromiumExecutable();
  return executable ? "ok" : "missing";
}

export async function readiness(): Promise<{ ready: boolean; checks: ReadyReport }> {
  const [database, storage, chromium] = await Promise.all([probeDatabase(), probeStorage(), probeChromium()]);
  return {
    ready: database === "ok" && storage === "ok" && chromium === "ok",
    checks: { database, storage, chromium },
  };
}

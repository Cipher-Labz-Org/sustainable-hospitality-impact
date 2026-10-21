import { pathExists, resolveSystemChromiumExecutable } from "@/backend/lib/chromium-path";

/** Chromium/Chrome/Edge path for headless PDF rendering (Puppeteer). */
export async function resolveChromiumExecutable(): Promise<string | undefined> {
  const fromEnv = process.env.PUPPETEER_EXECUTABLE_PATH;
  if (fromEnv && (await pathExists(fromEnv))) {
    return fromEnv;
  }

  try {
    const puppeteer = await import("puppeteer");
    const bundled = await puppeteer.default.executablePath();
    if (await pathExists(bundled)) {
      return bundled;
    }
  } catch {
    // Puppeteer's cache may be empty until `puppeteer browsers install chrome`.
  }

  return resolveSystemChromiumExecutable();
}

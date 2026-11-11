import { pathExists, resolveSystemChromiumExecutable } from "@/backend/lib/chromium-path";

const DEFAULT_ARGS = ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"];

function isServerlessRuntime() {
  return Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
}

export type ChromiumLaunchOptions = {
  executablePath: string;
  args: string[];
};

/** Chromium/Chrome/Edge path and args for headless PDF rendering. */
export async function resolveChromiumLaunch(): Promise<ChromiumLaunchOptions | undefined> {
  const fromEnv = process.env.PUPPETEER_EXECUTABLE_PATH;
  if (fromEnv && (await pathExists(fromEnv))) {
    return { executablePath: fromEnv, args: DEFAULT_ARGS };
  }

  if (isServerlessRuntime()) {
    try {
      const chromium = await import("@sparticuz/chromium");
      const executablePath = await chromium.default.executablePath();
      if (executablePath) {
        return {
          executablePath,
          args: chromium.default.args,
        };
      }
    } catch {
      // @sparticuz/chromium is optional outside Vercel; fall through to local browsers.
    }
  }

  try {
    const puppeteer = await import("puppeteer-core");
    const bundled = await puppeteer.default.executablePath();
    if (bundled && (await pathExists(bundled))) {
      return { executablePath: bundled, args: DEFAULT_ARGS };
    }
  } catch {
    // puppeteer-core has no bundled Chrome until `npm run browsers:install`.
  }

  const systemPath = await resolveSystemChromiumExecutable();
  if (systemPath) {
    return { executablePath: systemPath, args: DEFAULT_ARGS };
  }

  return undefined;
}

/** Chromium/Chrome/Edge path for headless PDF rendering (Puppeteer). */
export async function resolveChromiumExecutable(): Promise<string | undefined> {
  return (await resolveChromiumLaunch())?.executablePath;
}

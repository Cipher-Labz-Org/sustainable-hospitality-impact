import { access } from "fs/promises";
import path from "path";

async function pathExists(filePath: string) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

function windowsBrowserCandidates(): string[] {
  const localAppData = process.env.LOCALAPPDATA;
  return [
    localAppData ? path.join(localAppData, "Google", "Chrome", "Application", "chrome.exe") : "",
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  ].filter(Boolean);
}

function unixBrowserCandidates(): string[] {
  if (process.platform === "darwin") {
    return [
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
      "/Applications/Chromium.app/Contents/MacOS/Chromium",
    ];
  }
  return [
    "/usr/bin/google-chrome-stable",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
  ];
}

/** Chromium/Chrome/Edge path for headless PDF rendering (Puppeteer). */
export async function resolveChromiumExecutable(): Promise<string | undefined> {
  const fromEnv = process.env.PUPPETEER_EXECUTABLE_PATH;
  if (fromEnv && (await pathExists(fromEnv))) {
    return fromEnv;
  }

  const puppeteer = await import("puppeteer");
  try {
    const bundled = await puppeteer.default.executablePath();
    if (await pathExists(bundled)) {
      return bundled;
    }
  } catch {
    // Puppeteer's cache may be empty until `puppeteer browsers install chrome`.
  }

  const candidates = process.platform === "win32" ? windowsBrowserCandidates() : unixBrowserCandidates();
  for (const candidate of candidates) {
    if (await pathExists(candidate)) {
      return candidate;
    }
  }

  return undefined;
}

import { resolveChromiumExecutable } from "@/backend/lib/chromium-for-pdf";

/** Render report HTML to PDF without browser print headers/footers (date, URL, page title). */
export async function htmlToReportPdf(html: string): Promise<Uint8Array> {
  const executablePath = await resolveChromiumExecutable();
  if (!executablePath) {
    throw new Error(
      "PDF export needs Chrome, Edge, or Chromium. Run npm run browsers:install once, or set PUPPETEER_EXECUTABLE_PATH.",
    );
  }

  const puppeteer = await import("puppeteer");
  const browser = await puppeteer.default.launch({
    headless: true,
    executablePath,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
  });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "load" });
    const buffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "10mm", right: "10mm", bottom: "10mm", left: "10mm" },
      displayHeaderFooter: false,
    });
    return new Uint8Array(buffer);
  } finally {
    await browser.close();
  }
}

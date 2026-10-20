import sharp from "sharp";
import { NextResponse } from "next/server";
import { prisma } from "@/backend/lib/prisma";
import { getAdminUser, requireOrganization } from "@/backend/lib/session";
import { SECTIONS } from "@/backend/lib/sections";
import { createEvidenceDownloadToken } from "@/backend/lib/evidence-download-token";
import { htmlToReportPdf } from "@/backend/lib/report-pdf";
import { contentDisposition, readStoredFile } from "@/backend/lib/storage";

export const runtime = "nodejs";

type EvidenceMeta = {
  id: string;
  originalName: string;
  mimeType: string;
  storedName: string;
};

type AnswerInfo = { status: string | null; notes: string; evidence: EvidenceMeta[] };

const STATUS_LABEL: Record<string, string> = {
  YES: "Yes",
  NO: "No",
  NA: "N/A",
};

function answerLabel(status: string | null) {
  if (!status) return "Not answered";
  return STATUS_LABEL[status] ?? status;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function csvCell(value: string) {
  return `"${value.replace(/"/g, '""')}"`;
}

function reportFileSlug(orgName: string, scopeSlug: string) {
  const org = orgName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return `${org || "organization"}-assessment-${scopeSlug}`;
}

function imageDataUrl(mimeType: string, bytes: Uint8Array) {
  return `data:${mimeType};base64,${Buffer.from(bytes).toString("base64")}`;
}

/** Resize for print/PDF so small uploads still read clearly in the letterhead. */
async function letterheadLogoDataUrl(bytes: Uint8Array, mimeType: string, maxWidth: number, maxHeight: number) {
  try {
    const resized = await sharp(bytes)
      .rotate()
      .resize(maxWidth, maxHeight, { fit: "inside", withoutEnlargement: false })
      .png({ compressionLevel: 9 })
      .toBuffer();
    return imageDataUrl("image/png", resized);
  } catch {
    return imageDataUrl(mimeType, bytes);
  }
}

type LogoShape = "circle" | "square" | "wide" | "tall";

type SamplePixel = { r: number; g: number; b: number; a: number };

function samplePixel(data: Buffer, width: number, channels: number, x: number, y: number): SamplePixel {
  const i = (y * width + x) * channels;
  return { r: data[i], g: data[i + 1], b: data[i + 2], a: channels > 3 ? data[i + 3] : 255 };
}

function pixelDistance(a: SamplePixel, b: SamplePixel) {
  return Math.abs(a.r - b.r) + Math.abs(a.g - b.g) + Math.abs(a.b - b.b) + Math.abs(a.a - b.a);
}

async function logoLooksCircular(bytes: Uint8Array) {
  const size = 48;
  const { data, info } = await sharp(bytes, { failOn: "none" })
    .rotate()
    .ensureAlpha()
    .resize(size, size, { fit: "fill" })
    .raw()
    .toBuffer({ resolveWithObject: true });

  const px = (x: number, y: number) => samplePixel(data, info.width, info.channels, x, y);
  const corner = px(1, 1);
  const corners = [px(1, 1), px(size - 2, 1), px(1, size - 2), px(size - 2, size - 2)];
  if (!corners.every((item) => pixelDistance(item, corner) < 56)) return false;

  const cx = (size - 1) / 2;
  const cy = (size - 1) / 2;
  const radius = size / 2 - 0.5;
  let outsideMatch = 0;
  let outsideTotal = 0;
  let insideDiff = 0;
  let insideTotal = 0;

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const pixel = px(x, y);
      const distance = Math.hypot(x - cx, y - cy);
      if (distance >= radius * 0.96) {
        outsideTotal += 1;
        if (pixel.a < 36 || pixelDistance(pixel, corner) < 56) outsideMatch += 1;
      } else if (distance <= radius * 0.72) {
        insideTotal += 1;
        if (pixel.a > 40 && pixelDistance(pixel, corner) > 70) insideDiff += 1;
      }
    }
  }

  return outsideMatch / Math.max(1, outsideTotal) > 0.82 && insideDiff / Math.max(1, insideTotal) > 0.28;
}

async function detectLogoShape(bytes: Uint8Array): Promise<LogoShape> {
  const meta = await sharp(bytes, { failOn: "none" }).rotate().metadata();
  const width = Math.max(1, meta.width ?? 1);
  const height = Math.max(1, meta.height ?? 1);
  const ratio = width / height;
  if (ratio >= 1.32) return "wide";
  if (ratio <= 0.76) return "tall";
  if (await logoLooksCircular(bytes)) return "circle";
  return "square";
}

async function prepareBrandLogo(bytes: Uint8Array, mimeType: string) {
  try {
    const shape = await detectLogoShape(bytes);
    let pipeline = sharp(bytes, { failOn: "none" }).rotate();
    if (shape === "circle") {
      try {
        const trimmed = await sharp(bytes, { failOn: "none" }).rotate().trim({ threshold: 18 }).toBuffer();
        pipeline = sharp(trimmed);
      } catch {
        pipeline = sharp(bytes, { failOn: "none" }).rotate();
      }
    }
    const maxWidth = shape === "wide" ? 880 : 440;
    const maxHeight = shape === "wide" ? 280 : 440;
    const resized = await pipeline
      .resize(maxWidth, maxHeight, { fit: "inside", withoutEnlargement: false })
      .png({ compressionLevel: 9 })
      .toBuffer();
    return { src: imageDataUrl("image/png", resized), shape };
  } catch {
    return { src: imageDataUrl(mimeType, bytes), shape: "square" as const };
  }
}

type EvidenceBlockOptions = {
  evidenceDownloadHref: (fileId: string) => string;
};

async function evidenceBlockHtml(files: EvidenceMeta[], organizationId: string, options: EvidenceBlockOptions) {
  if (files.length === 0) return "";

  const listItems = files
    .map((file) => {
      const href = options.evidenceDownloadHref(file.id);
      const isImage = file.mimeType.startsWith("image/");
      const hint = isImage ? "Preview below · click to download original" : "Click to download";
      return `<li class="evidence-item">
        <a class="evidence-download" href="${escapeHtml(href)}">${escapeHtml(file.originalName)}</a>
        <span class="evidence-attached">${hint}</span>
      </li>`;
    })
    .join("");

  const figures: string[] = [];
  for (const file of files) {
    if (!file.mimeType.startsWith("image/")) continue;
    try {
      const bytes = await readStoredFile("evidence", organizationId, file.storedName);
      const src = await letterheadLogoDataUrl(bytes, file.mimeType, 720, 960);
      figures.push(
        `<figure class="evidence-figure">
          <img class="evidence-img" src="${src}" alt="${escapeHtml(file.originalName)}" />
          <figcaption>${escapeHtml(file.originalName)}</figcaption>
        </figure>`,
      );
    } catch {
      // Skip missing or unreadable files; the filename still appears in the list.
    }
  }

  return `
    <div class="evidence">
      <p class="evidence-heading">${files.length} evidence file${files.length === 1 ? "" : "s"}</p>
      <ul class="evidence-list">${listItems}</ul>
      ${figures.length > 0 ? `<div class="evidence-images">${figures.join("")}</div>` : ""}
    </div>`;
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const requestedOrgId = params.get("organizationId")?.trim() ?? "";

  let organization;
  if (requestedOrgId) {
    const admin = await getAdminUser();
    if (!admin) {
      return new NextResponse("Admin access required.", { status: 403 });
    }
    organization = await prisma.organization.findUnique({
      where: { id: requestedOrgId },
      include: { contact: true, brand: true, user: { select: { isAdmin: true } } },
    });
    if (!organization || organization.user.isAdmin) {
      return new NextResponse("Organization not found.", { status: 404 });
    }
  } else {
    ({ organization } = await requireOrganization());
  }
  const format = params.get("format");
  const sectionParam = params.get("section");
  const refParam = params.get("ref");

  // Legacy links used print=1 + browser print (adds date, URL, and page numbers). Serve a clean PDF instead.
  if (params.get("print") === "1" && format !== "csv" && format !== "pdf") {
    const redirectUrl = new URL(request.url);
    redirectUrl.searchParams.delete("print");
    redirectUrl.searchParams.set("format", "pdf");
    return NextResponse.redirect(redirectUrl);
  }

  const criteria = await prisma.criterion.findMany({
    orderBy: { sortOrder: "asc" },
    select: {
      id: true,
      section: true,
      categoryCode: true,
      categoryName: true,
      ref: true,
      question: true,
    },
  });

  const responses = await prisma.response.findMany({
    where: { organizationId: organization.id },
    select: {
      criterionId: true,
      status: true,
      notes: true,
      evidence: {
        orderBy: { createdAt: "asc" },
        select: { id: true, originalName: true, mimeType: true, storedName: true },
      },
    },
  });

  const answers = new Map<string, AnswerInfo>();
  for (const response of responses) {
    answers.set(response.criterionId, {
      status: response.status,
      notes: response.notes ?? "",
      evidence: response.evidence,
    });
  }

  // Single question takes priority, then a section, otherwise the full report.
  const refCriterion = refParam ? criteria.find((item) => item.ref === refParam) : null;
  const sections = refCriterion
    ? SECTIONS.filter((section) => section.id === refCriterion.section)
    : sectionParam
      ? SECTIONS.filter((section) => section.id === sectionParam.toUpperCase())
      : SECTIONS;
  const activeSections = sections.length > 0 ? sections : SECTIONS;
  const currentSection = refCriterion || sectionParam ? activeSections[0] : null;

  const includeCriterion = (item: { section: string; ref: string }) =>
    activeSections.some((section) => section.id === item.section) &&
    (!refCriterion || item.ref === refCriterion.ref);

  const scopedCriteria = criteria.filter(includeCriterion);
  const scopedCriterionIds = new Set(scopedCriteria.map((item) => item.id));

  const orgName = organization.name.trim() || "Organization";
  const generatedOn = new Date().toLocaleString("en-GB", { dateStyle: "long", timeStyle: "short" });
  const answeredCount = responses.filter(
    (item) => item.status && scopedCriterionIds.has(item.criterionId),
  ).length;
  let yesCount = 0;
  let noCount = 0;
  let naCount = 0;
  let evidenceFileCount = 0;
  for (const criterion of scopedCriteria) {
    const info = answers.get(criterion.id);
    if (info?.status === "YES") yesCount++;
    else if (info?.status === "NO") noCount++;
    else if (info?.status === "NA") naCount++;
    evidenceFileCount += info?.evidence.length ?? 0;
  }
  const progressPct =
    scopedCriteria.length > 0 ? Math.round((answeredCount / scopedCriteria.length) * 100) : 0;
  const scopeLabel = refCriterion
    ? `Question ${refCriterion.ref}`
    : currentSection
      ? `${currentSection.id} — ${currentSection.title}`
      : "All sections";
  const fileSlug = refCriterion
    ? `question-${refCriterion.ref.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`
    : currentSection
      ? `section-${currentSection.id.toLowerCase()}`
      : "all-sections";
  const downloadSlug = reportFileSlug(orgName, fileSlug);

  if (format === "csv") {
    const header = ["Section", "Category", "Ref", "Question", "Answer", "Notes", "Evidence files"];
    const lines = [header.map(csvCell).join(",")];
    for (const section of activeSections) {
      for (const criterion of criteria.filter((item) => item.section === section.id && includeCriterion(item))) {
        const info = answers.get(criterion.id);
        lines.push(
          [
            `${section.id} — ${section.title}`,
            `${criterion.categoryCode} ${criterion.categoryName}`.trim(),
            criterion.ref,
            criterion.question,
            answerLabel(info?.status ?? null),
            info?.notes ?? "",
            (info?.evidence ?? []).map((file) => file.originalName).join("; "),
          ]
            .map((cell) => csvCell(String(cell)))
            .join(","),
        );
      }
    }
    const csv = "\uFEFF" + lines.join("\r\n");
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": contentDisposition(`${downloadSlug}.csv`, false),
      },
    });
  }

  const reportOrigin = new URL(request.url).origin;
  const evidenceBlockOptions: EvidenceBlockOptions = {
    evidenceDownloadHref: (fileId) => {
      const token = createEvidenceDownloadToken(fileId, organization.id);
      return `${reportOrigin}/api/files/evidence/${encodeURIComponent(fileId)}?download=1&reportToken=${encodeURIComponent(token)}`;
    },
  };

  const evidenceHtmlByCriterion = new Map<string, string>();
  for (const criterion of scopedCriteria) {
    const files = answers.get(criterion.id)?.evidence ?? [];
    if (files.length > 0) {
      evidenceHtmlByCriterion.set(
        criterion.id,
        await evidenceBlockHtml(files, organization.id, evidenceBlockOptions),
      );
    }
  }

  const sectionsHtml = activeSections.map((section) => {
    const sectionCriteria = criteria.filter((item) => item.section === section.id && includeCriterion(item));
    const categories: { code: string; name: string; rows: typeof sectionCriteria }[] = [];
    for (const criterion of sectionCriteria) {
      const key = `${criterion.categoryCode}|${criterion.categoryName}`;
      let group = categories.find((item) => `${item.code}|${item.name}` === key);
      if (!group) {
        group = { code: criterion.categoryCode, name: criterion.categoryName, rows: [] };
        categories.push(group);
      }
      group.rows.push(criterion);
    }

    const categoriesHtml = categories
      .map((category) => {
        const rows = category.rows
          .map((criterion) => {
            const info = answers.get(criterion.id);
            const status = info?.status ?? null;
            const statusClass = status ? `status status-${status.toLowerCase()}` : "status status-open";
            const notes = info?.notes?.trim();
            const evidenceHtml = evidenceHtmlByCriterion.get(criterion.id) ?? "";
            return `
              <tr class="criterion-row">
                <td class="ref">${escapeHtml(criterion.ref)}</td>
                <td class="question">
                  <p class="criterion-question">${escapeHtml(criterion.question)}</p>
                  ${notes ? `<div class="notes"><span>Summary note</span> ${escapeHtml(notes)}</div>` : ""}
                  ${evidenceHtml}
                </td>
                <td class="answer"><span class="${statusClass}">${answerLabel(status)}</span></td>
              </tr>`;
          })
          .join("");
        return `
          <tbody class="category">
            <tr class="category-row">
              <td colspan="3">${escapeHtml(`${category.code} ${category.name}`.trim())}</td>
            </tr>
            ${rows}
          </tbody>`;
      })
      .join("");

    const sectionAnswered = sectionCriteria.filter((item) => answers.get(item.id)?.status).length;
    const sectionPct =
      sectionCriteria.length > 0 ? Math.round((sectionAnswered / sectionCriteria.length) * 100) : 0;

    return `
      <section class="section">
        <div class="section-head">
          <div>
            <h2><span class="badge">${escapeHtml(section.id)}</span> ${escapeHtml(section.title)}</h2>
            <p class="section-official">${escapeHtml(section.official)}</p>
          </div>
          <div class="section-progress" aria-label="Section completion">
            <span class="section-progress-value">${sectionPct}%</span>
            <span class="section-progress-label">${sectionAnswered} of ${sectionCriteria.length} answered</span>
          </div>
        </div>
        <table class="report-table">
          <thead>
            <tr><th class="ref">Ref</th><th>Criterion</th><th class="answer">Answer</th></tr>
          </thead>
          ${categoriesHtml}
        </table>
      </section>`;
  }).join("");

  let brandLogo: { src: string; shape: LogoShape } | null = null;
  if (organization.brand) {
    try {
      const orgBytes = await readStoredFile("brand", organization.id, organization.brand.storedName);
      brandLogo = await prepareBrandLogo(orgBytes, organization.brand.mimeType);
    } catch {
      brandLogo = null;
    }
  }

  const compactLayout = scopedCriteria.length <= 12;
  const orgPlace = organization.country.trim();
  const orgLine =
    organization.name.trim()
      ? `<p class="cover-org">${escapeHtml(organization.name.trim())}${orgPlace ? ` · ${escapeHtml(orgPlace)}` : ""}</p>`
      : "";
  const logoHtml = brandLogo
    ? `<div class="cover-logo-wrap is-${brandLogo.shape}">
        <img
          class="cover-logo-property is-${brandLogo.shape}"
          src="${brandLogo.src}"
          alt="${escapeHtml(orgName)}"
        />
      </div>`
    : "";

  const pdfParams = new URL(request.url).searchParams;
  pdfParams.delete("print");
  pdfParams.set("format", "pdf");
  const pdfDownloadPath = `/api/assessment/report?${pdfParams.toString()}`;

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
<title>Assessment summary report — ${escapeHtml(scopeLabel)} — ${escapeHtml(orgName)}</title>
<style>
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  html { -webkit-text-size-adjust: 100%; text-size-adjust: 100%; }
  body {
    margin: 0;
    font-family: "Segoe UI", system-ui, -apple-system, sans-serif;
    color: #1a1814;
    background: linear-gradient(180deg, #e8e4dc 0%, #f3f0ea 40%, #ece8e0 100%);
    line-height: 1.55;
    font-size: 14px;
    overflow-x: hidden;
  }
  .page { max-width: 800px; margin: 0 auto; padding: 16px 24px 48px; padding-left: max(24px, env(safe-area-inset-left)); padding-right: max(24px, env(safe-area-inset-right)); }
  .toolbar {
    display: flex; flex-wrap: wrap; gap: 12px; justify-content: flex-end; margin-bottom: 24px;
  }
  .toolbar button {
    border: 0; border-radius: 999px; padding: 10px 20px; font-size: 14px; font-weight: 600;
    cursor: pointer; background: #0f4c48; color: #fff;
  }
  .toolbar button.secondary { background: #fff; color: #0f4c48; border: 1px solid rgba(15,76,72,0.3); }
  .toolbar-download {
    display: inline-flex; align-items: center; border-radius: 999px; padding: 10px 20px;
    font-size: 14px; font-weight: 600; text-decoration: none; background: #0f4c48; color: #fff;
  }
  header.cover {
    position: relative;
    color: #fff;
    border-radius: 22px;
    margin: 0 0 28px;
    overflow: hidden;
    background: linear-gradient(148deg, #10655f 0%, #0c4a45 42%, #083532 100%);
    box-shadow: 0 16px 40px rgba(8, 53, 50, 0.22), 0 0 0 1px rgba(201, 168, 108, 0.2);
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .cover-shine {
    position: absolute;
    inset: 0;
    pointer-events: none;
    background:
      radial-gradient(ellipse 70% 55% at 100% 0%, rgba(201, 168, 108, 0.22), transparent 55%),
      radial-gradient(ellipse 50% 40% at 0% 100%, rgba(255, 255, 255, 0.07), transparent 50%);
  }
  .cover-content {
    position: relative;
    z-index: 1;
    padding: 26px 28px 28px;
  }
  .cover-masthead {
    display: flex;
    align-items: center;
    gap: 18px;
    padding-bottom: 20px;
    margin-bottom: 4px;
    border-bottom: 1px solid rgba(201, 168, 108, 0.32);
  }
  .cover-logo-wrap {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    max-width: min(240px, 100%);
    background: transparent;
  }
  .cover-logo-wrap.is-circle {
    width: 88px;
    height: 88px;
    border-radius: 50%;
    overflow: hidden;
    background: transparent;
    box-shadow: 0 8px 18px rgba(0, 0, 0, 0.28), 0 0 0 1px rgba(255, 255, 255, 0.28);
  }
  .cover-logo-property {
    display: block;
    width: auto;
    height: auto;
    max-width: 220px;
    max-height: 88px;
    object-fit: contain;
    object-position: center;
    background: transparent;
    filter:
      drop-shadow(0 0 1px rgba(255, 255, 255, 0.95))
      drop-shadow(0 2px 10px rgba(255, 255, 255, 0.4))
      drop-shadow(0 8px 18px rgba(0, 0, 0, 0.28));
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .cover-logo-property.is-circle {
    width: 88px;
    height: 88px;
    max-width: 88px;
    max-height: 88px;
    object-fit: cover;
    border-radius: 50%;
    filter: none;
  }
  .cover-logo-property.is-square {
    max-width: 88px;
    max-height: 88px;
    object-fit: contain;
    border-radius: 12px;
  }
  .cover-logo-property.is-wide {
    height: 56px;
    width: auto;
    max-width: 220px;
    max-height: 72px;
    object-fit: contain;
  }
  .cover-logo-property.is-tall {
    height: 88px;
    width: auto;
    max-width: 64px;
    object-fit: contain;
  }
  .cover-titles { min-width: 0; flex: 1; overflow-wrap: anywhere; }
  header.cover .eyebrow {
    text-transform: uppercase; letter-spacing: 0.16em; font-size: 10px;
    font-weight: 600; margin: 0; color: rgba(232, 213, 168, 0.95);
  }
  header.cover h1 {
    margin: 6px 0 0; font-size: 28px; font-weight: 700; letter-spacing: -0.025em;
    font-family: Georgia, "Times New Roman", serif; line-height: 1.15;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.15);
  }
  .cover-org {
    margin: 8px 0 0;
    font-size: 15px;
    font-weight: 600;
    letter-spacing: -0.01em;
    color: rgba(255, 255, 255, 0.92);
  }
  .summary-grid {
    display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px;
    margin-top: 26px;
  }
  .summary-card {
    background: linear-gradient(160deg, rgba(255, 255, 255, 0.16) 0%, rgba(255, 255, 255, 0.06) 100%);
    border: 1px solid rgba(201, 168, 108, 0.35);
    border-radius: 14px;
    padding: 14px 10px;
    text-align: center;
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.1);
  }
  .summary-value {
    display: block; font-size: 22px; font-weight: 700; line-height: 1.1;
    font-family: Georgia, "Times New Roman", serif;
  }
  .summary-label {
    display: block; margin-top: 4px; font-size: 10px; text-transform: uppercase;
    letter-spacing: 0.06em; opacity: 0.82;
  }
  .report-intro {
    margin: 18px 0 0; font-size: 13px; line-height: 1.6; opacity: 0.9; max-width: 62em;
  }
  header.cover .meta {
    display: flex; flex-wrap: wrap; align-items: center; gap: 10px 14px;
    margin-top: 18px; padding-top: 16px; border-top: 1px solid rgba(255, 255, 255, 0.18);
    font-size: 12px; opacity: 0.88;
  }
  header.cover .meta-sep { opacity: 0.55; font-weight: 700; }
  .section {
    background: #fff; border: 1px solid #e3ddd2; border-radius: 16px;
    padding: 22px 24px 20px; margin-bottom: 20px;
    box-shadow: 0 8px 24px rgba(26, 24, 20, 0.06);
  }
  .section-head {
    display: flex; align-items: flex-start; justify-content: space-between; gap: 16px;
    margin-bottom: 16px; padding-bottom: 14px; border-bottom: 1px solid #efe9df;
  }
  .section h2 { display: flex; align-items: center; gap: 10px; font-size: 18px; margin: 0; }
  .section-progress {
    flex-shrink: 0; text-align: right; padding: 8px 12px; border-radius: 10px;
    background: #f4faf9; border: 1px solid #d9ece8;
  }
  .section-progress-value { display: block; font-size: 18px; font-weight: 700; color: #0f4c48; line-height: 1; }
  .section-progress-label { display: block; margin-top: 3px; font-size: 10px; color: #5c564c; text-transform: uppercase; letter-spacing: 0.04em; }
  .badge {
    display: inline-grid; place-items: center; width: 30px; height: 30px; border-radius: 9px;
    background: #0f4c48; color: #fff; font-size: 15px; font-weight: 700;
  }
  .section-official { margin: 6px 0 0; color: #5c564c; font-size: 13px; max-width: 36em; }
  .report-table { width: 100%; border-collapse: collapse; }
  thead th {
    text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em;
    color: #8a8275; padding: 8px 10px; border-bottom: 2px solid #e7e2d6; background: #faf8f4;
  }
  th.ref, td.ref { width: 70px; white-space: nowrap; }
  th.answer, td.answer { width: 110px; text-align: right; }
  .category-row td {
    padding: 14px 10px 6px; font-size: 13px; font-weight: 700; color: #0f4c48;
    text-transform: uppercase; letter-spacing: 0.04em;
  }
  tbody.category tr.criterion-row td {
    vertical-align: top; padding: 12px 10px; border-bottom: 1px solid #f0ece2; font-size: 13.5px;
  }
  tbody.category tr.criterion-row:nth-child(even) td { background: #fcfbfa; }
  td.ref { color: #6f685c; font-weight: 700; font-size: 12px; }
  td.question { color: #2a271f; }
  .criterion-question { margin: 0; font-weight: 600; line-height: 1.45; color: #1f1c16; }
  .notes {
    margin-top: 8px; padding: 8px 10px; font-size: 12px; color: #5c564c;
    background: #f8f6f2; border-left: 3px solid #c5ddd8; border-radius: 0 8px 8px 0;
  }
  .notes span {
    display: block; margin-bottom: 2px; font-size: 10px; font-weight: 700;
    text-transform: uppercase; letter-spacing: 0.06em; color: #0f4c48;
  }
  .evidence { margin-top: 8px; font-size: 12px; color: #0f4c48; }
  .evidence-heading { margin: 0 0 4px; font-weight: 600; color: #0f4c48; }
  .evidence-list { margin: 8px 0 0; padding: 0; list-style: none; }
  .evidence-item {
    margin-top: 8px; padding: 10px 12px; border-radius: 10px;
    background: #f4faf9; border: 1px solid #d5ebe8;
  }
  .evidence-download {
    display: inline-block; font-weight: 700; color: #0a5c56;
    text-decoration: underline; text-underline-offset: 3px;
  }
  .evidence-attached { display: block; margin-top: 4px; color: #5c564c; font-size: 11px; }
  .evidence-images { margin-top: 10px; display: flex; flex-direction: column; gap: 12px; }
  .evidence-figure { margin: 0; }
  .evidence-figure img {
    display: block; max-width: 100%; max-height: 420px; width: auto; height: auto;
    border: 1px solid #e7e2d6; border-radius: 8px; object-fit: contain;
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }
  .evidence-figure figcaption { margin-top: 4px; font-size: 11px; color: #5c564c; }
  td.answer { text-align: right; }
  .status {
    display: inline-block; padding: 3px 10px; border-radius: 999px; font-size: 12px; font-weight: 700;
  }
  .status-yes { background: #e2f3ea; color: #157347; }
  .status-no { background: #fbe4e4; color: #b42318; }
  .status-na { background: #eceaf4; color: #5b4ba3; }
  .status-open { background: #f0ece2; color: #8a8275; }
  .doc-footer {
    margin-top: 56px;
    padding: 24px 4px 0;
    border-top: 1px solid #e7e2d6;
    display: flex;
    justify-content: space-between;
    gap: 16px;
    flex-wrap: wrap;
    font-size: 12px;
    color: #8a8275;
  }
  .pdf-compact header.cover { margin-bottom: 12px; border-radius: 16px; }
  .pdf-compact .cover-content { padding: 16px 18px 18px; }
  .pdf-compact .cover-masthead { gap: 14px; padding-bottom: 14px; }
  .pdf-compact .cover-logo-wrap.is-circle,
  .pdf-compact .cover-logo-property.is-circle { width: 64px; height: 64px; max-width: 64px; max-height: 64px; }
  .pdf-compact .cover-logo-property.is-square { max-width: 64px; max-height: 64px; }
  .pdf-compact .cover-logo-property.is-wide { height: 42px; max-width: 170px; }
  .pdf-compact .cover-logo-property.is-tall { height: 64px; max-width: 48px; }
  .pdf-compact header.cover h1 { font-size: 22px; margin-top: 4px; }
  .pdf-compact .cover-org { font-size: 13px; margin-top: 6px; }
  .pdf-compact .doc-footer { margin-top: 32px; padding-top: 18px; font-size: 11px; }
  .pdf-compact .summary-grid { margin-top: 14px; gap: 8px; }
  .pdf-compact .summary-card { padding: 8px 6px; border-radius: 10px; }
  .pdf-compact .summary-value { font-size: 17px; }
  .pdf-compact .report-intro { margin-top: 12px; font-size: 12px; line-height: 1.45; }
  .pdf-compact header.cover .meta { margin-top: 12px; padding-top: 10px; font-size: 11px; }
  .pdf-compact .section { padding: 14px 16px 12px; margin-bottom: 10px; border-radius: 12px; }
  .pdf-compact .section-head { margin-bottom: 10px; padding-bottom: 10px; }
  .pdf-compact .section h2 { font-size: 16px; }
  .pdf-compact .section-progress-value { font-size: 15px; }
  .pdf-compact .evidence-figure img { max-height: 160px; }

  @media screen and (max-width: 900px) {
    .page {
      padding: 12px 16px 40px;
      padding-left: max(16px, env(safe-area-inset-left));
      padding-right: max(16px, env(safe-area-inset-right));
    }
    header.cover { border-radius: 18px; margin-bottom: 20px; }
    .cover-content { padding: 20px 18px 20px; }
    .cover-masthead { gap: 16px; padding-bottom: 16px; }
    .cover-logo-wrap.is-circle,
    .cover-logo-property.is-circle { width: 76px; height: 76px; max-width: 76px; max-height: 76px; }
    .cover-logo-property { max-height: 76px; max-width: 200px; }
    header.cover h1 { font-size: 24px; }
    .summary-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; margin-top: 18px; }
    .section { padding: 16px; border-radius: 14px; }
    .section-head { gap: 12px; }
  }

  @media screen and (max-width: 640px) {
    .page {
      padding: 10px 12px 32px;
      padding-left: max(12px, env(safe-area-inset-left));
      padding-right: max(12px, env(safe-area-inset-right));
    }
    .toolbar { justify-content: stretch; margin-bottom: 16px; }
    .toolbar button,
    .toolbar-download {
      flex: 1 1 calc(50% - 6px);
      justify-content: center;
      text-align: center;
      min-height: 44px;
      padding: 10px 14px;
    }
    header.cover { border-radius: 16px; margin-bottom: 16px; }
    .cover-content { padding: 16px 14px 16px; }
    .cover-masthead {
      flex-direction: column;
      align-items: flex-start;
      gap: 14px;
      padding-bottom: 14px;
    }
    .cover-logo-wrap.is-circle,
    .cover-logo-property.is-circle { width: 72px; height: 72px; max-width: 72px; max-height: 72px; }
    .cover-logo-property { max-height: 72px; max-width: min(220px, 100%); }
    header.cover .eyebrow { font-size: 9px; letter-spacing: 0.12em; }
    header.cover h1 { font-size: 22px; }
    .cover-org { font-size: 14px; }
    .summary-card { padding: 12px 8px; border-radius: 12px; }
    .summary-value { font-size: 20px; }
    .report-intro { font-size: 12.5px; }
    header.cover .meta { font-size: 11px; gap: 6px 10px; }
    .section { padding: 14px 12px 12px; margin-bottom: 14px; }
    .section-head { flex-direction: column; align-items: flex-start; }
    .section h2 { font-size: 16px; flex-wrap: wrap; }
    .section-progress { text-align: left; }
    .report-table thead { display: none; }
    .report-table,
    .report-table tbody,
    .report-table tr,
    .report-table td {
      display: block;
      width: 100%;
    }
    th.ref, td.ref, th.answer, td.answer { width: auto; white-space: normal; }
    .category-row td { padding: 12px 0 6px; }
    tbody.category tr.criterion-row {
      padding: 10px 0 12px;
      border-bottom: 1px solid #f0ece2;
    }
    tbody.category tr.criterion-row td,
    tbody.category tr.criterion-row:nth-child(even) td {
      padding: 4px 0;
      border-bottom: 0;
      background: transparent;
    }
    td.answer { text-align: left; margin-top: 6px; }
    .evidence-figure img { max-height: 220px; }
    .doc-footer { margin-top: 28px; padding-top: 16px; }
  }

  @media print {
    @page { margin: 14mm; }
    body { background: #fff; }
    .toolbar { display: none; }
    .page { padding: 0; max-width: none; }
    .section { border-color: #ddd; break-inside: auto; page-break-inside: auto; }
    .section-head { break-after: avoid; page-break-after: avoid; }
    tbody.category tr.criterion-row { break-inside: avoid; page-break-inside: avoid; }
    .page:not(.pdf-compact) header.cover { margin-bottom: 16px; }
    header.cover {
      box-shadow: none;
      break-after: avoid;
      page-break-after: avoid;
      -webkit-print-color-adjust: exact; print-color-adjust: exact;
    }
    .cover-masthead { break-inside: avoid; page-break-inside: avoid; }
    .cover-logo-wrap.is-circle,
    .cover-logo-property.is-circle { width: 76px; height: 76px; max-width: 76px; max-height: 76px; }
    .cover-logo-property {
      max-height: 76px;
      max-width: 200px;
      filter:
        drop-shadow(0 0 1px rgba(255, 255, 255, 0.9))
        drop-shadow(0 3px 8px rgba(0, 0, 0, 0.2));
    }
  }
</style>
</head>
<body>
  <div class="page${compactLayout ? " pdf-compact" : ""}">
    <div class="toolbar">
      <button class="secondary" onclick="window.close(); setTimeout(function(){ if (!window.closed && history.length > 1) history.back(); }, 120);">Close</button>
      <a class="toolbar-download" href="${pdfDownloadPath}">Download PDF</a>
    </div>
    <header class="cover">
      <div class="cover-shine" aria-hidden="true"></div>
      <div class="cover-content">
        <div class="cover-masthead">
          ${logoHtml}
          <div class="cover-titles">
            <p class="eyebrow">Self-assessment · ${escapeHtml(scopeLabel)}</p>
            <h1>Assessment summary report</h1>
            ${orgLine}
          </div>
        </div>
        <div class="summary-grid">
          <div class="summary-card">
            <span class="summary-value">${progressPct}%</span>
            <span class="summary-label">Complete</span>
          </div>
          <div class="summary-card">
            <span class="summary-value">${answeredCount}</span>
            <span class="summary-label">Answered</span>
          </div>
          <div class="summary-card">
            <span class="summary-value">${yesCount}</span>
            <span class="summary-label">Yes</span>
          </div>
          <div class="summary-card">
            <span class="summary-value">${evidenceFileCount}</span>
            <span class="summary-label">Evidence files</span>
          </div>
        </div>
        <p class="report-intro">
          This document summarises your responses against the GSTC Industry Criteria for Hotels.
          Each criterion shows your answer, supporting notes, and linked evidence where uploaded.
        </p>
        <div class="meta">
          <span>${scopedCriteria.length} criteria in scope</span>
          <span class="meta-sep" aria-hidden="true">·</span>
          <span>${noCount} no · ${naCount} n/a</span>
          <span class="meta-sep" aria-hidden="true">·</span>
          <span>Generated ${escapeHtml(generatedOn)}</span>
        </div>
      </div>
    </header>
    ${sectionsHtml}
    <footer class="doc-footer">
      <span>${escapeHtml(orgName)}</span>
      <span>Assessment summary</span>
    </footer>
  </div>
</body>
</html>`;

  if (format === "pdf") {
    try {
      const pdfFileName = `${downloadSlug}.pdf`;
      const pdf = await htmlToReportPdf(html);

      return new NextResponse(Buffer.from(pdf), {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": contentDisposition(pdfFileName, false),
          "Cache-Control": "private, no-store",
        },
      });
    } catch (error) {
      console.error("Report export failed:", error);
      const detail =
        error instanceof Error && error.message.includes("PDF export needs")
          ? error.message
          : "Could not generate the PDF. If you just cloned the repo, run npm install (or npm run browsers:install), restart the dev server, and try again.";
      return new NextResponse(detail, {
        status: 500,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }
  }

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

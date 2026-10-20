import { mkdir, readFile, unlink, writeFile } from "fs/promises";
import path from "path";
import { normalizeBrandImage } from "@/backend/lib/brand-image";

const MAX_EVIDENCE_BYTES = 15 * 1024 * 1024;
const MAX_LOGO_BYTES = 5 * 1024 * 1024;

type Rule = {
  ext: string;
  mime: string;
  brand: boolean;
  sniff: (buffer: Buffer) => boolean;
};

const RULES: Rule[] = [
  {
    ext: ".pdf",
    mime: "application/pdf",
    brand: false,
    sniff: (buffer) => buffer.subarray(0, 4).toString("utf8") === "%PDF",
  },
  {
    ext: ".doc",
    mime: "application/msword",
    brand: false,
    sniff: (buffer) =>
      buffer.length >= 4 &&
      buffer[0] === 0xd0 &&
      buffer[1] === 0xcf &&
      buffer[2] === 0x11 &&
      buffer[3] === 0xe0,
  },
  {
    ext: ".docx",
    mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    brand: false,
    sniff: (buffer) => buffer.subarray(0, 2).toString("utf8") === "PK",
  },
  {
    ext: ".png",
    mime: "image/png",
    brand: true,
    sniff: (buffer) =>
      buffer.length >= 4 &&
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47,
  },
  {
    ext: ".jpg",
    mime: "image/jpeg",
    brand: true,
    sniff: (buffer) => buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff,
  },
  {
    ext: ".jpeg",
    mime: "image/jpeg",
    brand: true,
    sniff: (buffer) => buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff,
  },
  {
    ext: ".webp",
    mime: "image/webp",
    brand: true,
    sniff: (buffer) =>
      buffer.subarray(0, 4).toString("utf8") === "RIFF" &&
      buffer.subarray(8, 12).toString("utf8") === "WEBP",
  },
];

export function safeOriginalName(name: string) {
  const base = path.basename(name).replace(/[^\w.\- ()]+/g, "_").trim();
  return (base || "file").slice(0, 180);
}

export function contentDisposition(name: string, inline: boolean) {
  const ascii = safeOriginalName(name).replace(/"/g, "");
  return `${inline ? "inline" : "attachment"}; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(name)}`;
}

function storageRoot() {
  return path.resolve(process.cwd(), "storage");
}

export function absoluteStoredPath(folder: "evidence" | "brand", organizationId: string, storedName: string) {
  if (!/^[\w.-]+$/.test(storedName) || storedName.includes("..")) {
    throw new Error("Invalid stored file name.");
  }
  const root = storageRoot();
  const full = path.resolve(root, folder, organizationId, storedName);
  if (!full.startsWith(root + path.sep)) throw new Error("Invalid stored path.");
  return full;
}

export async function readStoredFile(folder: "evidence" | "brand", organizationId: string, storedName: string) {
  return readFile(absoluteStoredPath(folder, organizationId, storedName));
}

export async function removeStoredFile(folder: "evidence" | "brand", organizationId: string, storedName: string) {
  try {
    await unlink(absoluteStoredPath(folder, organizationId, storedName));
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code !== "ENOENT") throw error;
  }
}

export async function storeUpload(folder: "evidence" | "brand", organizationId: string, file: File) {
  const limit = folder === "brand" ? MAX_LOGO_BYTES : MAX_EVIDENCE_BYTES;
  if (file.size <= 0) return { ok: false as const, error: "That file is empty." };
  if (file.size > limit) {
    return {
      ok: false as const,
      error:
        folder === "brand"
          ? "Logo files need to be 5 MB or smaller."
          : "Each file needs to be 15 MB or smaller.",
    };
  }

  const ext = path.extname(file.name).toLowerCase();
  const rule = RULES.find((item) => item.ext === ext && (folder === "evidence" || item.brand));
  if (!rule) {
    return {
      ok: false as const,
      error:
        folder === "brand"
          ? "Use a PNG, JPG, or WEBP logo."
          : "Use a PDF, DOC, DOCX, or an image (JPG, PNG, WEBP).",
    };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  if (!rule.sniff(buffer)) {
    return { ok: false as const, error: `${safeOriginalName(file.name)} does not look like a valid ${rule.ext.slice(1).toUpperCase()} file.` };
  }

  let output = buffer;
  let mimeType = rule.mime;
  let storedExt = rule.ext === ".jpeg" ? ".jpg" : rule.ext;
  if (folder === "brand") {
    try {
      const normalized = await normalizeBrandImage(buffer);
      output = normalized.buffer;
      mimeType = normalized.mimeType;
      storedExt = normalized.ext;
    } catch {
      // Keep the original bytes if the image cannot be re-encoded.
    }
  }

  const storedName = `${crypto.randomUUID()}${storedExt}`;
  const full = absoluteStoredPath(folder, organizationId, storedName);
  await mkdir(path.dirname(full), { recursive: true });
  await writeFile(full, output);

  return {
    ok: true as const,
    storedName,
    mimeType,
    size: output.length,
    originalName: safeOriginalName(file.name),
  };
}

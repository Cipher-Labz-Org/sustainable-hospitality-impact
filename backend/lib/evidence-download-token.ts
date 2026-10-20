import { createHmac, timingSafeEqual } from "crypto";

/** How long download links inside an exported report stay valid. */
const TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;

function signingSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not configured.");
  return secret;
}

export function createEvidenceDownloadToken(fileId: string, organizationId: string): string {
  const exp = Date.now() + TOKEN_TTL_MS;
  const payload = `${fileId}|${organizationId}|${exp}`;
  const sig = createHmac("sha256", signingSecret()).update(payload).digest("hex");
  return `${exp}.${sig}`;
}

export function verifyEvidenceDownloadToken(
  token: string,
  fileId: string,
  organizationId: string,
): boolean {
  const [expStr, sig] = token.split(".");
  if (!expStr || !sig) return false;

  const exp = Number(expStr);
  if (!Number.isFinite(exp) || Date.now() > exp) return false;

  const payload = `${fileId}|${organizationId}|${exp}`;
  const expected = createHmac("sha256", signingSecret()).update(payload).digest("hex");
  if (expected.length !== sig.length) return false;

  try {
    return timingSafeEqual(Buffer.from(expected, "utf8"), Buffer.from(sig, "utf8"));
  } catch {
    return false;
  }
}

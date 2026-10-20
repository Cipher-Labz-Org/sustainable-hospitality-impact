import { randomBytes } from "crypto";

export function isReportPublished(organization: { reportPublishedAt: Date | null }) {
  return organization.reportPublishedAt != null;
}

export function createShareToken() {
  return randomBytes(24).toString("base64url");
}

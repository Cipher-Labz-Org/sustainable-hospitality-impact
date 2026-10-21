"use server";

import { revalidatePath } from "next/cache";
import { appBaseUrl } from "@/backend/lib/app-url";
import { requireOrganization } from "@/backend/lib/session";
import type { ActionResult } from "@/backend/lib/validators";
import {
  publishOrganizationReport,
  rotateOrganizationShareLink,
  unpublishOrganizationReport,
} from "@/backend/services/reports";

function revalidatePublish() {
  revalidatePath("/assessment/publish");
  revalidatePath("/assessment/share");
  revalidatePath("/assessment");
  for (const section of ["A", "B", "C", "D"]) {
    revalidatePath(`/assessment/${section}`);
  }
}

export async function publishAssessmentReport(): Promise<ActionResult<{ shareUrl: string }>> {
  const { organization } = await requireOrganization();
  const result = await publishOrganizationReport(organization, await appBaseUrl());
  if (!result.ok) return result;
  revalidatePublish();
  return result;
}

export async function unpublishAssessmentReport(): Promise<ActionResult> {
  const { organization } = await requireOrganization();
  const result = await unpublishOrganizationReport(organization);
  if (!result.ok) return result;
  revalidatePublish();
  return { ok: true };
}

export async function rotateShareLink(): Promise<ActionResult<{ shareUrl: string }>> {
  const { organization } = await requireOrganization();
  const result = await rotateOrganizationShareLink(organization, await appBaseUrl());
  if (!result.ok) return result;
  if (!result.data) return { ok: false, error: "The share link could not be created." };
  revalidatePublish();
  revalidatePath(`/share/${result.data.token}`);
  return { ok: true, data: { shareUrl: result.data.shareUrl } };
}

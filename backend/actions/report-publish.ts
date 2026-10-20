"use server";

import { revalidatePath } from "next/cache";
import { appBaseUrl, shareReportPath } from "@/backend/lib/app-url";
import { createShareToken, isReportPublished } from "@/backend/lib/report-publish";
import { prisma } from "@/backend/lib/prisma";
import { requireOrganization } from "@/backend/lib/session";
import type { ActionResult } from "@/backend/lib/validators";

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
  if (isReportPublished(organization)) {
    return { ok: false, error: "This report is already published. Unpublish first if you need to edit answers." };
  }

  const token = organization.reportShareToken ?? createShareToken();
  await prisma.organization.update({
    where: { id: organization.id },
    data: {
      reportPublishedAt: new Date(),
      reportShareToken: token,
    },
  });

  revalidatePublish();
  const base = await appBaseUrl();
  return { ok: true, data: { shareUrl: `${base}${shareReportPath(token)}` } };
}

export async function unpublishAssessmentReport(): Promise<ActionResult> {
  const { organization } = await requireOrganization();
  if (!isReportPublished(organization)) {
    return { ok: false, error: "There is no published report to unpublish." };
  }

  await prisma.organization.update({
    where: { id: organization.id },
    data: { reportPublishedAt: null },
  });

  revalidatePublish();
  return { ok: true };
}

export async function rotateShareLink(): Promise<ActionResult<{ shareUrl: string }>> {
  const { organization } = await requireOrganization();
  if (!isReportPublished(organization)) {
    return { ok: false, error: "Publish the report before generating a share link." };
  }

  const token = createShareToken();
  await prisma.organization.update({
    where: { id: organization.id },
    data: { reportShareToken: token },
  });

  revalidatePublish();
  revalidatePath(`/share/${token}`);
  const base = await appBaseUrl();
  return { ok: true, data: { shareUrl: `${base}${shareReportPath(token)}` } };
}

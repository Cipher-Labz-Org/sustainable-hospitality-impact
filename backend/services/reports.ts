import { prisma } from "@/backend/lib/prisma";
import { createShareToken, isReportPublished, shareReportPath } from "@/backend/lib/report-publish";
import type { ActionResult } from "@/backend/lib/validators";

type OrganizationShare = {
  id: string;
  reportPublishedAt: Date | null;
  reportShareToken: string | null;
};

export async function publishOrganizationReport(
  organization: OrganizationShare,
  appBase: string,
): Promise<ActionResult<{ shareUrl: string }>> {
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

  return { ok: true, data: { shareUrl: `${appBase}${shareReportPath(token)}` } };
}

export async function unpublishOrganizationReport(organization: OrganizationShare): Promise<ActionResult> {
  if (!isReportPublished(organization)) {
    return { ok: false, error: "There is no published report to unpublish." };
  }

  await prisma.organization.update({
    where: { id: organization.id },
    data: { reportPublishedAt: null },
  });

  return { ok: true };
}

export async function rotateOrganizationShareLink(
  organization: OrganizationShare,
  appBase: string,
): Promise<ActionResult<{ shareUrl: string; token: string }>> {
  if (!isReportPublished(organization)) {
    return { ok: false, error: "Publish the report before generating a share link." };
  }

  const token = createShareToken();
  await prisma.organization.update({
    where: { id: organization.id },
    data: { reportShareToken: token },
  });

  return { ok: true, data: { shareUrl: `${appBase}${shareReportPath(token)}`, token } };
}

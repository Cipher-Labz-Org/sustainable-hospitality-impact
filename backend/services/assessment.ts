import { prisma } from "@/backend/lib/prisma";
import { isReportPublished } from "@/backend/lib/report-publish";
import { removeStoredFile, storeUpload } from "@/backend/lib/storage";
import { fieldErrors, responseSchema, type ActionResult } from "@/backend/lib/validators";

export const ASSESSMENT_LOCKED_MESSAGE =
  "This assessment is published and locked. Unpublish from Publish report to edit answers or evidence.";

const MAX_FILES_PER_QUESTION = 20;

type OrganizationLock = {
  id: string;
  reportPublishedAt: Date | null;
};

export type UploadedEvidence = {
  id: string;
  originalName: string;
  mimeType: string;
  size: number;
  createdAt: string;
};

async function ensureResponse(organizationId: string, ref: string) {
  const criterion = await prisma.criterion.findUnique({ where: { ref } });
  if (!criterion) return null;
  return prisma.response.upsert({
    where: { organizationId_criterionId: { organizationId, criterionId: criterion.id } },
    create: { organizationId, criterionId: criterion.id },
    update: {},
    include: { evidence: true, criterion: true },
  });
}

export async function saveResponseForOrganization(
  organization: OrganizationLock,
  input: {
    ref: string;
    status: "YES" | "NO" | "NA" | null;
    notes: string;
    remarks: string;
    actionPlan: string;
  },
): Promise<ActionResult<{ section: string }>> {
  if (isReportPublished(organization)) return { ok: false, error: ASSESSMENT_LOCKED_MESSAGE };
  const parsed = responseSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "The answer could not be saved.", fieldErrors: fieldErrors(parsed.error) };
  }

  const criterion = await prisma.criterion.findUnique({ where: { ref: parsed.data.ref } });
  if (!criterion) return { ok: false, error: "That question is not part of the sustainability management record." };

  await prisma.response.upsert({
    where: {
      organizationId_criterionId: {
        organizationId: organization.id,
        criterionId: criterion.id,
      },
    },
    create: {
      organizationId: organization.id,
      criterionId: criterion.id,
      status: parsed.data.status,
      notes: parsed.data.notes.trim(),
      remarks: parsed.data.remarks.trim(),
      actionPlan: parsed.data.actionPlan.trim(),
    },
    update: {
      status: parsed.data.status,
      notes: parsed.data.notes.trim(),
      remarks: parsed.data.remarks.trim(),
      actionPlan: parsed.data.actionPlan.trim(),
    },
  });

  return { ok: true, data: { section: criterion.section } };
}

export async function uploadEvidenceForOrganization(
  organization: OrganizationLock,
  ref: string,
  files: File[],
): Promise<ActionResult<UploadedEvidence[]> & { section?: string }> {
  if (isReportPublished(organization)) return { ok: false, error: ASSESSMENT_LOCKED_MESSAGE };
  if (!ref || files.length === 0) return { ok: false, error: "Choose at least one file." };

  const response = await ensureResponse(organization.id, ref);
  if (!response) return { ok: false, error: "That question is not part of the sustainability management record." };
  if (response.evidence.length + files.length > MAX_FILES_PER_QUESTION) {
    return { ok: false, error: `Each question can hold up to ${MAX_FILES_PER_QUESTION} files.` };
  }

  const created: UploadedEvidence[] = [];
  const errors: string[] = [];

  for (const file of files) {
    const stored = await storeUpload("evidence", organization.id, file);
    if (!stored.ok) {
      errors.push(stored.error);
      continue;
    }
    const record = await prisma.evidenceFile.create({
      data: {
        responseId: response.id,
        originalName: stored.originalName,
        storedName: stored.storedName,
        mimeType: stored.mimeType,
        size: stored.size,
      },
    });
    created.push({
      id: record.id,
      originalName: record.originalName,
      mimeType: record.mimeType,
      size: record.size,
      createdAt: record.createdAt.toISOString(),
    });
  }

  if (created.length === 0) {
    return { ok: false, error: errors[0] ?? "The files could not be uploaded." };
  }
  return {
    ok: true,
    data: created,
    warning: errors.length ? errors.join(" ") : undefined,
    section: response.criterion.section,
  };
}

export async function deleteEvidenceForOrganization(
  organization: OrganizationLock,
  id: string,
): Promise<ActionResult<{ section: string }>> {
  if (isReportPublished(organization)) return { ok: false, error: ASSESSMENT_LOCKED_MESSAGE };
  const file = await prisma.evidenceFile.findUnique({
    where: { id },
    include: { response: { include: { criterion: true } } },
  });
  if (!file || file.response.organizationId !== organization.id) {
    return { ok: false, error: "That file could not be found." };
  }

  await removeStoredFile("evidence", organization.id, file.storedName);
  await prisma.evidenceFile.delete({ where: { id: file.id } });
  return { ok: true, data: { section: file.response.criterion.section } };
}

"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/backend/lib/prisma";
import { requireOrganization } from "@/backend/lib/session";
import { removeStoredFile, storeUpload } from "@/backend/lib/storage";
import { isReportPublished } from "@/backend/lib/report-publish";
import { fieldErrors, responseSchema, type ActionResult } from "@/backend/lib/validators";

const LOCKED_MESSAGE =
  "This assessment is published and locked. Unpublish from Publish report to edit answers or evidence.";

const MAX_FILES_PER_QUESTION = 20;

function revalidateAssessment(section?: string) {
  revalidatePath("/assessment");
  revalidatePath("/assessment/library");
  if (section) revalidatePath(`/assessment/${section}`);
}

async function ensureResponse(organizationId: string, ref: string) {
  const criterion = await prisma.criterion.findUnique({ where: { ref } });
  if (!criterion) return null;
  const response = await prisma.response.upsert({
    where: { organizationId_criterionId: { organizationId, criterionId: criterion.id } },
    create: { organizationId, criterionId: criterion.id },
    update: {},
    include: { evidence: true, criterion: true },
  });
  return response;
}

export async function saveResponse(input: {
  ref: string;
  status: "YES" | "NO" | "NA" | null;
  notes: string;
  remarks: string;
  actionPlan: string;
}): Promise<ActionResult> {
  const { organization } = await requireOrganization();
  if (isReportPublished(organization)) return { ok: false, error: LOCKED_MESSAGE };
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

  revalidateAssessment(criterion.section);
  revalidatePath("/assessment/remarks");
  revalidatePath("/assessment/action-plans");
  return { ok: true };
}

export type UploadedEvidence = {
  id: string;
  originalName: string;
  mimeType: string;
  size: number;
  createdAt: string;
};

export async function uploadEvidence(formData: FormData): Promise<ActionResult<UploadedEvidence[]>> {
  const { organization } = await requireOrganization();
  if (isReportPublished(organization)) return { ok: false, error: LOCKED_MESSAGE };
  const ref = String(formData.get("ref") ?? "");
  const files = formData.getAll("files").filter((item): item is File => item instanceof File && item.size > 0);
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

  revalidateAssessment(response.criterion.section);
  if (created.length === 0) {
    return { ok: false, error: errors[0] ?? "The files could not be uploaded." };
  }
  return {
    ok: true,
    data: created,
    warning: errors.length ? errors.join(" ") : undefined,
  };
}

export async function deleteEvidence(id: string): Promise<ActionResult> {
  const { organization } = await requireOrganization();
  if (isReportPublished(organization)) return { ok: false, error: LOCKED_MESSAGE };
  const file = await prisma.evidenceFile.findUnique({
    where: { id },
    include: { response: { include: { criterion: true } } },
  });
  if (!file || file.response.organizationId !== organization.id) {
    return { ok: false, error: "That file could not be found." };
  }

  await removeStoredFile("evidence", organization.id, file.storedName);
  await prisma.evidenceFile.delete({ where: { id: file.id } });
  revalidateAssessment(file.response.criterion.section);
  return { ok: true };
}

"use server";

import { revalidatePath } from "next/cache";
import { requireOrganization } from "@/backend/lib/session";
import type { ActionResult } from "@/backend/lib/validators";
import {
  deleteEvidenceForOrganization,
  saveResponseForOrganization,
  uploadEvidenceForOrganization,
  type UploadedEvidence,
} from "@/backend/services/assessment";

export type { UploadedEvidence };

function revalidateAssessment(section?: string) {
  revalidatePath("/assessment");
  revalidatePath("/assessment/library");
  if (section) revalidatePath(`/assessment/${section}`);
}

export async function saveResponse(input: {
  ref: string;
  status: "YES" | "NO" | "NA" | null;
  notes: string;
  remarks: string;
  actionPlan: string;
}): Promise<ActionResult> {
  const { organization } = await requireOrganization();
  const result = await saveResponseForOrganization(organization, input);
  if (!result.ok) return result;
  revalidateAssessment(result.data?.section);
  revalidatePath("/assessment/remarks");
  revalidatePath("/assessment/action-plans");
  return { ok: true };
}

export async function uploadEvidence(formData: FormData): Promise<ActionResult<UploadedEvidence[]>> {
  const { organization } = await requireOrganization();
  const ref = String(formData.get("ref") ?? "");
  const files = formData.getAll("files").filter((item): item is File => item instanceof File && item.size > 0);
  const result = await uploadEvidenceForOrganization(organization, ref, files);
  if (result.ok) revalidateAssessment(result.section);
  if (!result.ok) return result;
  return {
    ok: true,
    data: result.data,
    warning: result.warning,
  };
}

export async function deleteEvidence(id: string): Promise<ActionResult> {
  const { organization } = await requireOrganization();
  const result = await deleteEvidenceForOrganization(organization, id);
  if (!result.ok) return result;
  revalidateAssessment(result.data?.section);
  return { ok: true };
}

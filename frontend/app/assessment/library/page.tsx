import type { Metadata } from "next";
import { AssessmentPageHeader } from "@/frontend/components/assessment-panel";
import { EvidenceLibrary } from "@/frontend/components/evidence-library";
import type { LibraryItem } from "@/backend/lib/assessment-types";
import { prisma } from "@/backend/lib/prisma";
import { requireOrganization } from "@/backend/lib/session";

export const metadata: Metadata = { title: "All documents" };

export default async function LibraryPage() {
  const { organization } = await requireOrganization();
  const files = await prisma.evidenceFile.findMany({
    where: { response: { organizationId: organization.id } },
    include: { response: { include: { criterion: true } } },
    orderBy: { createdAt: "desc" },
  });

  const items: LibraryItem[] = files.map((file) => ({
    id: file.id,
    originalName: file.originalName,
    mimeType: file.mimeType,
    size: file.size,
    createdAt: file.createdAt.toISOString(),
    ref: file.response.criterion.ref,
    section: file.response.criterion.section,
    categoryName: file.response.criterion.categoryName,
    question: file.response.criterion.question,
  }));

  return (
    <div className="grid gap-8">
      <AssessmentPageHeader
        title="All documents"
        description="Every file you attach to a question appears here. Open a row to jump back to that criterion in the assessment."
      />
      <EvidenceLibrary items={items} />
    </div>
  );
}

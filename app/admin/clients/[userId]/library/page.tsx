import type { Metadata } from "next";
import { AssessmentPageHeader } from "@/frontend/components/assessment-panel";
import { EvidenceLibrary } from "@/frontend/components/evidence-library";
import type { LibraryItem } from "@/backend/lib/assessment-types";
import { clientDisplayName, requireAdminClient } from "@/backend/lib/admin-client";
import { prisma } from "@/backend/lib/prisma";
import { adminClientHref, adminClientSectionBase } from "@/frontend/lib/admin-client-nav";

export const metadata: Metadata = { title: "Client documents" };

export default async function AdminClientLibraryPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const client = await requireAdminClient(userId);
  const organization = client.organization;
  const name = clientDisplayName(organization?.name, client.email);

  if (!organization) {
    return <AssessmentPageHeader title={name} description="This account does not have an organization record yet." />;
  }

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
        description={`Evidence files ${name} attached to assessment questions.`}
      />
      <EvidenceLibrary
        items={items}
        readOnly
        backHref={adminClientHref(userId, "")}
        questionBasePath={adminClientSectionBase(userId)}
      />
    </div>
  );
}

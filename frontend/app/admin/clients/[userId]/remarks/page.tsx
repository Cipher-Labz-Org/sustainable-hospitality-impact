import type { Metadata } from "next";
import Link from "next/link";
import { AssessmentPageHeader, AssessmentPanel } from "@/frontend/components/assessment-panel";
import { clientDisplayName, requireAdminClient } from "@/backend/lib/admin-client";
import { prisma } from "@/backend/lib/prisma";
import { adminClientHref, adminClientSectionHref } from "@/frontend/lib/admin-client-nav";

export const metadata: Metadata = { title: "Client remarks" };

export default async function AdminClientRemarksPage({
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

  const responses = await prisma.response.findMany({
    where: { organizationId: organization.id, remarks: { not: "" } },
    include: { criterion: true },
    orderBy: { criterion: { sortOrder: "asc" } },
  });

  return (
    <div className="grid gap-8">
      <AssessmentPageHeader
        title="Remarks report"
        description={`Internal remarks ${name} captured on each criterion.`}
      />
      <AssessmentPanel title={`Criteria with remarks (${responses.length})`}>
        {responses.length === 0 ? (
          <p className="rounded-xl border border-dashed border-line bg-white/60 px-4 py-10 text-center text-sm text-muted">
            No remarks have been recorded yet.
          </p>
        ) : (
          <ul className="grid gap-4">
            {responses.map((item) => (
              <li key={item.id} className="rounded-xl border border-line bg-white p-4 shadow-sm">
                <Link
                  className="font-semibold text-teal hover:underline"
                  href={adminClientSectionHref(userId, item.criterion.section, item.criterion.ref)}
                >
                  {item.criterion.ref}
                </Link>
                <p className="mt-1 text-sm text-muted line-clamp-2">{item.criterion.question}</p>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-ink">{item.remarks}</p>
              </li>
            ))}
          </ul>
        )}
        <Link className="mt-6 inline-block text-sm font-semibold text-teal hover:underline" href={adminClientHref(userId, "")}>
          Open assessment
        </Link>
      </AssessmentPanel>
    </div>
  );
}

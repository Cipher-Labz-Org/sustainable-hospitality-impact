import type { Metadata } from "next";
import Link from "next/link";
import { AssessmentPageHeader, AssessmentPanel } from "@/frontend/components/assessment-panel";
import { prisma } from "@/backend/lib/prisma";
import { requireOrganization } from "@/backend/lib/session";

export const metadata: Metadata = { title: "Remarks report" };

export default async function RemarksReportPage() {
  const { organization } = await requireOrganization();
  const responses = await prisma.response.findMany({
    where: {
      organizationId: organization.id,
      remarks: { not: "" },
    },
    include: { criterion: true },
    orderBy: { criterion: { sortOrder: "asc" } },
  });

  return (
    <div className="grid gap-8">
      <AssessmentPageHeader
        title="Remarks report"
        description="Internal coach remarks captured on each criterion (Reporting tab notes are listed on the assignment report instead)."
      />

      <AssessmentPanel title={`Criteria with remarks (${responses.length})`}>
        {responses.length === 0 ? (
          <p className="rounded-xl border border-dashed border-line bg-white/60 px-4 py-10 text-center text-sm leading-relaxed text-muted">
            No remarks yet. Open a section, pick a question, and use the <strong className="font-semibold text-ink">Remarks</strong>{" "}
            tab.
          </p>
        ) : (
          <ul className="grid gap-4">
            {responses.map((item) => (
              <li key={item.id} className="rounded-xl border border-line bg-white p-4 shadow-sm">
                <Link
                  className="font-semibold text-teal hover:underline"
                  href={`/assessment/${item.criterion.section}?ref=${item.criterion.ref}`}
                >
                  {item.criterion.ref}
                </Link>
                <p className="mt-1 text-sm text-muted line-clamp-2">{item.criterion.question}</p>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-ink">{item.remarks}</p>
              </li>
            ))}
          </ul>
        )}
        <Link className="mt-6 inline-block text-sm font-semibold text-teal hover:underline" href="/assessment">
          Open assessment
        </Link>
      </AssessmentPanel>
    </div>
  );
}

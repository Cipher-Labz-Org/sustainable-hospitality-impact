import type { Metadata } from "next";
import { AssessmentPageHeader, AssessmentPanel } from "@/frontend/components/assessment-panel";
import { DownloadButtons } from "@/frontend/components/report-download-buttons";
import { prisma } from "@/backend/lib/prisma";
import { requireOrganization } from "@/backend/lib/session";
import { SECTIONS } from "@/backend/lib/sections";

export const metadata: Metadata = { title: "Overview" };

export default async function OverviewPage() {
  const { organization } = await requireOrganization();
  const criteriaCount = await prisma.criterion.count();
  const questions = await prisma.criterion.findMany({
    orderBy: { sortOrder: "asc" },
    select: { section: true, ref: true, question: true },
  });
  const answered = await prisma.response.count({
    where: { organizationId: organization.id, status: { not: null } },
  });
  const files = await prisma.evidenceFile.count({
    where: { response: { organizationId: organization.id } },
  });
  const noCount = await prisma.response.count({
    where: { organizationId: organization.id, status: "NO" },
  });

  return (
    <div className="grid gap-8">
      <AssessmentPageHeader
        title="Overview"
        description={`Single-page summary for ${organization.name || "your organization"} across all assessment modules.`}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <OverviewStat label="Questions answered" value={`${answered}/${criteriaCount}`} />
        <OverviewStat label="Evidence files" value={String(files)} />
        <OverviewStat label="Marked No" value={String(noCount)} />
        <OverviewStat label="Sections" value={String(SECTIONS.length)} />
      </div>

      <AssessmentPanel title="Download report">
        <div className="grid gap-3">
          <ReportDownloadRow
            title="Full report — all sections"
            description={`Every criterion across all ${SECTIONS.length} sections with your answers, notes, and evidence counts.`}
            query=""
            highlighted
          />
          {SECTIONS.map((section) => {
            const sectionQuestions = questions.filter((item) => item.section === section.id);
            return (
              <details key={section.id} className="group rounded-2xl border border-line bg-white">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3.5">
                  <div className="min-w-0">
                    <p className="font-medium text-ink">
                      Section {section.id} — {section.title}
                    </p>
                    <p className="mt-0.5 text-sm leading-relaxed text-muted">{section.official}</p>
                  </div>
                  <span className="flex shrink-0 items-center gap-1 text-sm font-medium text-teal">
                    {sectionQuestions.length} questions
                    <svg
                      className="h-4 w-4 transition-transform group-open:rotate-180"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </span>
                </summary>
                <div className="border-t border-line/70 px-4 py-3">
                  <div className="flex flex-col gap-2 rounded-xl bg-teal-soft/30 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm font-medium text-ink">Whole section report</p>
                    <DownloadButtons query={`section=${section.id}`} />
                  </div>
                  <ul className="mt-2 divide-y divide-line/60">
                    {sectionQuestions.map((item) => (
                      <li
                        key={item.ref}
                        className="flex flex-col gap-2 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
                      >
                        <p className="min-w-0 text-sm text-ink">
                          <span className="mr-2 font-semibold text-teal">{item.ref}</span>
                          {item.question}
                        </p>
                        <DownloadButtons query={`ref=${encodeURIComponent(item.ref)}`} compact />
                      </li>
                    ))}
                  </ul>
                </div>
              </details>
            );
          })}
        </div>
      </AssessmentPanel>
    </div>
  );
}

function ReportDownloadRow({
  title,
  description,
  query,
  highlighted,
}: {
  title: string;
  description: string;
  query: string;
  highlighted?: boolean;
}) {
  return (
    <div
      className={
        "flex flex-col gap-3 rounded-2xl border px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between " +
        (highlighted ? "border-teal/30 bg-teal-soft/30" : "border-line bg-white")
      }
    >
      <div className="min-w-0">
        <p className="font-medium text-ink">{title}</p>
        <p className="mt-0.5 text-sm leading-relaxed text-muted">{description}</p>
      </div>
      <DownloadButtons query={query} />
    </div>
  );
}

function OverviewStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-line bg-white px-4 py-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-2 font-serif text-2xl text-ink">{value}</p>
    </div>
  );
}

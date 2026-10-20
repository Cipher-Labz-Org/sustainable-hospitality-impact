import type { Metadata } from "next";
import Link from "next/link";
import { AssessmentPageHeader, AssessmentPanel } from "@/frontend/components/assessment-panel";
import {
  AssessmentQuickLinks,
  PrimaryLink,
  ProgressHero,
  ReportStatGrid,
  SecondaryLink,
} from "@/frontend/components/assessment-report-ui";
import { SectionCardsGrid } from "@/frontend/components/section-cards-grid";
import { clientDisplayName, requireAdminClient } from "@/backend/lib/admin-client";
import { loadOrganizationReportStats } from "@/backend/lib/organization-report-stats";
import { prisma } from "@/backend/lib/prisma";
import { SECTIONS } from "@/backend/lib/sections";
import { adminClientHref, adminClientSectionBase, adminClientSectionHref } from "@/frontend/lib/admin-client-nav";

export const metadata: Metadata = { title: "Client assessment" };

export default async function AdminClientAssessmentPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const client = await requireAdminClient(userId);
  const organization = client.organization;
  const name = clientDisplayName(organization?.name, client.email);

  if (!organization) {
    return (
      <AssessmentPageHeader
        eyebrow="Client assessment"
        title={name}
        description="This account does not have an organization record yet. It will appear after the client signs in."
      />
    );
  }

  const stats = await loadOrganizationReportStats(organization.id);
  const latest = await prisma.response.findFirst({
    where: { organizationId: organization.id, status: { not: null } },
    orderBy: { updatedAt: "desc" },
    select: { criterion: { select: { section: true, ref: true } } },
  });
  const firstOpenSection = stats.sectionRows.find((row) => row.done < row.total);
  const continueTarget = latest
    ? adminClientSectionHref(userId, latest.criterion.section, latest.criterion.ref)
    : firstOpenSection
      ? adminClientSectionHref(userId, firstOpenSection.id)
      : adminClientSectionHref(userId, "A");

  return (
    <div className="grid gap-8">
      <AssessmentPageHeader
        eyebrow="Client assessment"
        title={name}
        description={`${stats.answeredTotal} of ${stats.totalQuestions} questions answered. Open a GSTC section to read the filled answers, or download the report.`}
        actions={
          <>
            <PrimaryLink href={continueTarget}>
              {latest ? "Open latest answers" : "Open assessment"}
            </PrimaryLink>
            <SecondaryLink href={adminClientHref(userId, "/overview")}>Download report</SecondaryLink>
          </>
        }
      />

      <ProgressHero
        percent={stats.percent}
        title="Overall assessment progress"
        subtitle={`${stats.answeredTotal} answered · ${stats.totalQuestions - stats.answeredTotal} still open · ${stats.yesCount} marked Yes`}
      />

      <ReportStatGrid
        stats={[
          { label: "Answered", value: String(stats.answeredTotal), hint: `of ${stats.totalQuestions} total`, tone: "teal" },
          { label: "Marked Yes", value: String(stats.yesCount), hint: "meets criterion", tone: "ok" },
          { label: "Marked No", value: String(stats.noCount), hint: "needs follow-up", tone: "danger" },
          { label: "Marked N/A", value: String(stats.naCount), hint: "not applicable" },
        ]}
      />

      {stats.noCount > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-danger/25 bg-danger/5 px-5 py-4">
          <p className="text-sm text-ink">
            <strong>{stats.noCount}</strong> {stats.noCount === 1 ? "criterion is" : "criteria are"} marked{" "}
            <strong>No</strong>.
          </p>
          <Link
            className="rounded-full bg-teal px-4 py-2 text-sm font-semibold text-raised transition hover:bg-teal-deep"
            href={adminClientHref(userId, "/action-plans")}
          >
            Review action plans
          </Link>
        </div>
      ) : null}

      <AssessmentPanel title="Reports & documents" tone="muted">
        <AssessmentQuickLinks
          links={[
            { href: adminClientHref(userId, "/overview"), label: "Overview & download", desc: "PDF / CSV exports" },
            { href: adminClientHref(userId, "/action-plans"), label: "Action plans", desc: "Gaps to close" },
            { href: adminClientHref(userId, "/library"), label: "All documents", desc: "Evidence files" },
            { href: adminClientHref(userId, "/remarks"), label: "Remarks report", desc: "Internal notes" },
          ]}
        />
      </AssessmentPanel>

      <div className="overflow-visible">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
          <h2 className="assessment-section-heading">GSTC sections</h2>
          <p className="text-xs text-muted">Open a section to read the client&apos;s answers</p>
        </div>
        <SectionCardsGrid
          sectionBasePath={adminClientSectionBase(userId)}
          sections={SECTIONS.map((section) => {
            const row = stats.sectionRows.find((item) => item.id === section.id);
            return {
              id: section.id,
              title: section.title,
              official: section.official,
              description: section.description,
              done: row?.done ?? 0,
              total: row?.total ?? 0,
              percent: row?.percent ?? 0,
            };
          })}
        />
      </div>
    </div>
  );
}

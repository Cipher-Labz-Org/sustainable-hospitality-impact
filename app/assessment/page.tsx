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
import { prisma } from "@/backend/lib/prisma";
import { requireOrganization } from "@/backend/lib/session";
import { SECTIONS } from "@/backend/lib/sections";
import { SUSTAINABILITY_MANAGEMENT_NAME } from "@/backend/lib/sustainability-management";

export const metadata: Metadata = { title: "Assessment and Reporting" };

export default async function AssessmentPage() {
  const { organization } = await requireOrganization();
  const criteria = await prisma.criterion.findMany({
    select: { id: true, section: true, ref: true, sortOrder: true },
    orderBy: { sortOrder: "asc" },
  });
  const responses = await prisma.response.findMany({
    where: { organizationId: organization.id, status: { not: null } },
    orderBy: { updatedAt: "desc" },
    select: {
      criterionId: true,
      status: true,
      criterion: { select: { section: true, ref: true } },
    },
  });

  const answeredIds = new Set(responses.map((response) => response.criterionId));
  const firstOpen = criteria.find((item) => !answeredIds.has(item.id));
  const latest = responses[0];
  const continueTarget = latest
    ? `/assessment/${latest.criterion.section}?ref=${latest.criterion.ref}`
    : firstOpen
      ? `/assessment/${firstOpen.section}?ref=${firstOpen.ref}`
      : "/assessment/A";

  const totals = Object.fromEntries(SECTIONS.map((section) => [section.id, 0])) as Record<string, number>;
  for (const item of criteria) totals[item.section] = (totals[item.section] ?? 0) + 1;
  const answered = Object.fromEntries(SECTIONS.map((section) => [section.id, 0])) as Record<string, number>;
  for (const response of responses) {
    answered[response.criterion.section] = (answered[response.criterion.section] ?? 0) + 1;
  }
  const answeredTotal = responses.length;
  const totalQuestions = criteria.length;
  const overallPercent = totalQuestions ? Math.round((answeredTotal / totalQuestions) * 100) : 0;
  const yesCount = responses.filter((item) => item.status === "YES").length;
  const noCount = responses.filter((item) => item.status === "NO").length;
  const naCount = responses.filter((item) => item.status === "NA").length;
  const openCount = totalQuestions - answeredTotal;

  return (
    <div className="grid gap-8">
      <AssessmentPageHeader
        eyebrow="Dashboard"
        title="Where the record stands"
        description={
          criteria.length === 0
            ? `${SUSTAINABILITY_MANAGEMENT_NAME} has not been loaded yet.`
            : `${answeredTotal} of ${criteria.length} questions answered for ${organization.name || "your organization"}. Continue ${SUSTAINABILITY_MANAGEMENT_NAME} or open a report below.`
        }
        actions={
          <>
            <PrimaryLink href={continueTarget}>
              {latest ? "Continue assessment" : "Building sustainability management system"}
            </PrimaryLink>
            <SecondaryLink href="/assessment/action-plans">Action plans</SecondaryLink>
          </>
        }
      />

      <ProgressHero
        percent={overallPercent}
        title="Overall assessment progress"
        subtitle={`${answeredTotal} answered · ${openCount} still open · ${yesCount} marked Yes`}
        footer={
          firstOpen && latest ? (
            <p className="text-sm text-muted">
              Next open:{" "}
              <Link className="font-semibold text-teal hover:underline" href={`/assessment/${firstOpen.section}?ref=${firstOpen.ref}`}>
                {firstOpen.ref}
              </Link>
            </p>
          ) : null
        }
      />

      <ReportStatGrid
        stats={[
          { label: "Answered", value: String(answeredTotal), hint: `of ${totalQuestions} total`, tone: "teal" },
          { label: "Marked Yes", value: String(yesCount), hint: "meets criterion", tone: "ok" },
          { label: "Marked No", value: String(noCount), hint: "needs follow-up", tone: "danger" },
          { label: "Marked N/A", value: String(naCount), hint: "not applicable" },
        ]}
      />

      {noCount > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-danger/25 bg-danger/5 px-5 py-4">
          <p className="text-sm text-ink">
            <strong>{noCount}</strong> {noCount === 1 ? "criterion is" : "criteria are"} marked <strong>No</strong>.
          </p>
          <Link
            className="rounded-full bg-teal px-4 py-2 text-sm font-semibold text-raised transition hover:bg-teal-deep"
            href="/assessment/action-plans"
          >
            Review action plans
          </Link>
        </div>
      ) : null}

      <AssessmentPanel title="Reports & documents" tone="muted">
        <AssessmentQuickLinks />
      </AssessmentPanel>

      <div className="overflow-visible">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
          <h2 className="assessment-section-heading">GSTC sections</h2>
          <p className="text-xs text-muted">Hover a card to preview · click to open</p>
        </div>
        <SectionCardsGrid
          sections={SECTIONS.map((section) => {
            const total = totals[section.id] ?? 0;
            const done = answered[section.id] ?? 0;
            const percent = total ? Math.round((done / total) * 100) : 0;
            return {
              id: section.id,
              title: section.title,
              official: section.official,
              description: section.description,
              done,
              total,
              percent,
            };
          })}
        />
      </div>
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import {
  AssessmentReportSettingsTable,
  SustainabilityReportTitle,
} from "@/frontend/components/assessment-report-settings";
import { AssessmentPageHeader, AssessmentPanel } from "@/frontend/components/assessment-panel";
import { AssessmentModuleNotice } from "@/frontend/components/assessment-module-notice";
import { SustainabilityDownloadCard } from "@/frontend/components/sustainability-download-card";
import { prisma } from "@/backend/lib/prisma";
import { requireOrganization } from "@/backend/lib/session";
import { SECTIONS } from "@/backend/lib/sections";

export const metadata: Metadata = { title: "Sustainability report" };

export default async function SustainabilityReportPage() {
  const { organization } = await requireOrganization();
  const orgName = organization.name || "your organization";
  const defaultTitle = `${orgName} — Sustainability report`;

  const criteriaTotal = await prisma.criterion.count();
  const answered = await prisma.response.count({
    where: { organizationId: organization.id, status: { not: null } },
  });
  const yesCount = await prisma.response.count({
    where: { organizationId: organization.id, status: "YES" },
  });
  const evidenceCount = await prisma.evidenceFile.count({
    where: { response: { organizationId: organization.id } },
  });
  const progress = criteriaTotal ? Math.round((answered / criteriaTotal) * 100) : 0;
  const openCount = criteriaTotal - answered;

  return (
    <div className="grid gap-8">
      <AssessmentPageHeader
        title="Sustainability report"
        description={`Configure and export a sustainability report for ${orgName}. This page prepares the document; your answers and evidence come from the assessment.`}
      />

      <AssessmentPanel title="What will go in your report">
        <p className="text-sm leading-relaxed text-muted">
          The sustainability report is a <strong className="font-medium text-ink">formatted export</strong> of your GSTC
          assessment: criteria answers across sections {SECTIONS.map((s) => s.id).join(", ")}, optional descriptions,
          and attached files. Nothing is generated as a PDF until you download it (export is coming soon).
        </p>
        <dl className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Criteria answered" value={`${answered} / ${criteriaTotal}`} />
          <Stat label="Assessment progress" value={`${progress}%`} />
          <Stat label="Marked Yes" value={String(yesCount)} />
          <Stat label="Evidence files" value={String(evidenceCount)} />
        </dl>
        {openCount > 0 ? (
          <p className="mt-4 rounded-xl border border-line bg-paper/60 px-4 py-3 text-sm text-muted">
            <strong className="font-medium text-ink">{openCount}</strong> questions still have no answer. Complete them in{" "}
            <Link className="font-semibold text-teal hover:underline" href="/assessment">Assessment &amp; reporting</Link>{" "}
            before exporting.
          </p>
        ) : (
          <p className="mt-4 text-sm text-ok">All criteria have an answer — your report data is ready to export when PDF is enabled.</p>
        )}
      </AssessmentPanel>

      <AssessmentModuleNotice>
        <strong className="font-medium text-ink">PDF download is not live yet.</strong> You can set report options below;
        they are saved in your browser. For charts and counts today, use the{" "}
        <Link className="font-semibold text-teal hover:underline" href="/assessment">Assessment &amp; reporting</Link>.
      </AssessmentModuleNotice>

      <AssessmentPanel title="Download report">
        <SustainabilityDownloadCard />
      </AssessmentPanel>

      <AssessmentPanel title="Report settings" flush>
        <AssessmentReportSettingsTable organizationId={organization.id} />
      </AssessmentPanel>

      <AssessmentPanel title="Title">
        <SustainabilityReportTitle organizationId={organization.id} defaultTitle={defaultTitle} />
      </AssessmentPanel>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-line/80 bg-white px-4 py-3 shadow-sm">
      <dt className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</dt>
      <dd className="mt-1 font-serif text-2xl text-teal tabular-nums">{value}</dd>
    </div>
  );
}

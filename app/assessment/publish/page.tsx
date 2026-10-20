import type { Metadata } from "next";
import { AssessmentPageHeader, AssessmentPanel } from "@/frontend/components/assessment-panel";
import { PublishReportControls } from "@/frontend/components/publish-report-controls";
import { isReportPublished } from "@/backend/lib/report-publish";
import { loadOrganizationReportStats } from "@/backend/lib/organization-report-stats";
import { requireOrganization } from "@/backend/lib/session";

export const metadata: Metadata = { title: "Publish report" };

export default async function PublishReportPage() {
  const { organization } = await requireOrganization();
  const published = isReportPublished(organization);
  const stats = await loadOrganizationReportStats(organization.id);
  const publishedLabel = organization.reportPublishedAt
    ? organization.reportPublishedAt.toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : null;

  return (
    <div className="grid gap-8">
      <AssessmentPageHeader
        title="Publish report"
        description="Release a fixed snapshot for external review. Published reports lock editing in the assessment workspace."
      />

      <AssessmentPanel title="Publishing">
        <PublishReportControls published={published} publishedLabel={publishedLabel} />
      </AssessmentPanel>

      <div className="grid gap-4 sm:grid-cols-2">
        <AssessmentPanel title="Assessment report">
          <PublishRow label="Status" value={published ? "Published" : "Draft"} highlight={published} />
          <PublishRow label="Released" value={published ? "Yes" : "No"} />
          <PublishRow label="Answered" value={`${stats.answeredTotal} of ${stats.totalQuestions}`} />
        </AssessmentPanel>
        <AssessmentPanel title="Audit snapshot">
          <PublishRow
            label="Status"
            value={published ? "Read-only snapshot" : "Updates with your answers"}
            tone={published ? "warn" : undefined}
          />
          <PublishRow label="Released" value={published ? "Yes" : "No"} />
          <PublishRow label="Compliance (answered)" value={`${stats.percent}%`} />
        </AssessmentPanel>
      </div>
    </div>
  );
}

function PublishRow({
  label,
  value,
  tone,
  highlight,
}: {
  label: string;
  value: string;
  tone?: "warn";
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between border-b border-line/60 py-3 last:border-0">
      <span className="text-sm text-muted">{label}</span>
      <span
        className={
          tone === "warn"
            ? "rounded-full bg-brass/15 px-3 py-1 text-xs font-semibold text-brass"
            : highlight
              ? "rounded-full bg-teal/15 px-3 py-1 text-xs font-semibold text-teal-deep"
              : "rounded-full bg-paper px-3 py-1 text-xs font-medium text-ink"
        }
      >
        {value}
      </span>
    </div>
  );
}

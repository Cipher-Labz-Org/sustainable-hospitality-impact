import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { contentContainerClass } from "@/frontend/components/page-shell";
import { ProgressHero, ReportStatGrid, SectionProgressList } from "@/frontend/components/assessment-report-ui";
import { cn } from "@/frontend/components/ui";
import { loadOrganizationReportStats } from "@/backend/lib/organization-report-stats";
import { isReportPublished } from "@/backend/lib/report-publish";
import { prisma } from "@/backend/lib/prisma";

export const metadata: Metadata = {
  title: "Shared GSTC report",
  robots: { index: false, follow: false },
};

export default async function SharedReportPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const organization = await prisma.organization.findFirst({
    where: { reportShareToken: token },
    select: {
      id: true,
      name: true,
      country: true,
      reportPublishedAt: true,
    },
  });

  if (!organization || !isReportPublished(organization)) notFound();

  const stats = await loadOrganizationReportStats(organization.id);
  const publishedLabel = organization.reportPublishedAt!.toLocaleString(undefined, {
    dateStyle: "long",
    timeStyle: "short",
  });

  return (
    <main className={cn(contentContainerClass, "py-10 sm:py-14")}>
      <div className="mb-8 max-w-2xl">
        <p className="text-eyebrow">Read-only shared report</p>
        <h1 className="mt-2 font-serif text-3xl text-ink sm:text-4xl">
          {organization.name.trim() || "GSTC assessment snapshot"}
        </h1>
        <p className="mt-2 text-sm text-muted">
          Published {publishedLabel}
          {organization.country.trim() ? ` · ${organization.country}` : ""}
        </p>
      </div>

      <div className="grid gap-8">
        <ProgressHero
          percent={stats.percent}
          title="Assessment progress"
          subtitle={`${stats.answeredTotal} answered · ${stats.yesCount} marked Yes · ${stats.noCount} marked No`}
        />

        <ReportStatGrid
          stats={[
            { label: "Answered", value: String(stats.answeredTotal), hint: `of ${stats.totalQuestions} total`, tone: "teal" },
            { label: "Marked Yes", value: String(stats.yesCount), hint: "meets criterion", tone: "ok" },
            { label: "Marked No", value: String(stats.noCount), hint: "needs follow-up", tone: "danger" },
            { label: "Marked N/A", value: String(stats.naCount), hint: "not applicable" },
          ]}
        />

        <div className="surface-card p-6 sm:p-8">
          <h2 className="assessment-section-heading mb-4">Progress by GSTC section</h2>
          <SectionProgressList sections={stats.sectionRows} linkSections={false} />
        </div>

        <p className="text-center text-xs text-muted">
          This is a private snapshot shared by the organization. For full detail, contact the property directly.
        </p>
      </div>
    </main>
  );
}

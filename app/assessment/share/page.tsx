import type { Metadata } from "next";
import { AssessmentPageHeader, AssessmentPanel } from "@/frontend/components/assessment-panel";
import { ShareReportControls } from "@/frontend/components/share-report-controls";
import { appBaseUrl, shareReportPath } from "@/backend/lib/app-url";
import { isReportPublished } from "@/backend/lib/report-publish";
import { requireOrganization } from "@/backend/lib/session";

export const metadata: Metadata = { title: "Share report" };

export default async function ShareReportPage() {
  const { organization } = await requireOrganization();
  const published = isReportPublished(organization);
  let shareUrl: string | null = null;
  if (published && organization.reportShareToken) {
    const base = await appBaseUrl();
    shareUrl = `${base}${shareReportPath(organization.reportShareToken)}`;
  }

  return (
    <div className="grid gap-8">
      <AssessmentPageHeader
        title="Share report"
        description="Share a read-only link with coaches, auditors, or partners. No sign-in required for viewers."
      />

      <AssessmentPanel title="Share link">
        <ShareReportControls published={published} shareUrl={shareUrl} />
      </AssessmentPanel>
    </div>
  );
}

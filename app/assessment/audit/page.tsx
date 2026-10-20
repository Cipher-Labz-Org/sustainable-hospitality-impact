import type { Metadata } from "next";
import Link from "next/link";
import { AssessmentModuleNotice } from "@/frontend/components/assessment-module-notice";
import { AssessmentPageHeader, AssessmentPanel } from "@/frontend/components/assessment-panel";
import { prisma } from "@/backend/lib/prisma";
import { requireOrganization } from "@/backend/lib/session";
import { SECTIONS } from "@/backend/lib/sections";

export const metadata: Metadata = { title: "Audit report" };

export default async function AuditReportPage() {
  const { organization } = await requireOrganization();
  const criteria = await prisma.criterion.count();
  const answered = await prisma.response.count({
    where: { organizationId: organization.id, status: { not: null } },
  });
  const compliance = criteria ? Math.round((answered / criteria) * 100) : 0;

  return (
    <div className="grid gap-8">
      <AssessmentPageHeader
        title="Audit report"
        description="Audit-oriented view of compliance progress — aligned with external review workflows."
        actions={
          <Link className="rounded-full bg-teal px-5 py-2.5 text-sm font-semibold text-raised" href="/assessment">
            Assessment &amp; reporting
          </Link>
        }
      />

      <AssessmentModuleNotice>
        Full audit PDF and auditor-only fields are planned. Below is a snapshot from your current assessment data.
      </AssessmentModuleNotice>

      <AssessmentPanel title="% of criteria in compliance">
        <div className="flex flex-wrap items-center gap-6">
          <p className="font-serif text-5xl text-teal tabular-nums">{compliance}</p>
          <div className="min-w-[10rem] flex-1">
            <div className="h-3 overflow-hidden rounded-full bg-line/80">
              <div className="h-full rounded-full bg-ok" style={{ width: `${compliance}%` }} />
            </div>
            <p className="mt-2 text-sm text-muted">{answered} of {criteria} criteria answered</p>
          </div>
        </div>
      </AssessmentPanel>

      <AssessmentPanel title="Sections">
        <ul className="grid gap-2 text-sm">
          {SECTIONS.map((section) => (
            <li key={section.id}>
              <Link className="font-medium text-teal hover:underline" href={`/assessment/${section.id}`}>
                Section {section.id} — {section.title}
              </Link>
            </li>
          ))}
        </ul>
      </AssessmentPanel>
    </div>
  );
}

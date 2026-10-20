import type { Metadata } from "next";
import Link from "next/link";
import { SecondaryLink } from "@/frontend/components/assessment-report-ui";
import { AssessmentPageHeader, AssessmentPanel } from "@/frontend/components/assessment-panel";
import { clientDisplayName, requireAdminClient } from "@/backend/lib/admin-client";
import { prisma } from "@/backend/lib/prisma";
import { adminClientHref, adminClientSectionHref } from "@/frontend/lib/admin-client-nav";

export const metadata: Metadata = { title: "Client action plans" };

export default async function AdminClientActionPlansPage({
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

  const criteria = await prisma.criterion.findMany({ orderBy: { sortOrder: "asc" } });
  const responses = await prisma.response.findMany({
    where: { organizationId: organization.id },
    include: { criterion: true },
  });
  const byCriterion = new Map(responses.map((item) => [item.criterionId, item]));
  const withPlans = responses.filter((item) => item.actionPlan.trim().length > 0);
  const noAnswers = responses.filter((item) => item.status === "NO");
  const unanswered = criteria.filter((item) => !byCriterion.get(item.id)?.status);

  return (
    <div className="grid gap-8">
      <AssessmentPageHeader
        title="Action plans"
        description={`Gaps and follow-up steps recorded by ${name}.`}
        actions={<SecondaryLink href={adminClientHref(userId, "")}>Back to assessment</SecondaryLink>}
      />

      {withPlans.length > 0 ? (
        <AssessmentPanel title={`Documented action plans (${withPlans.length})`}>
          <ul className="grid gap-4">
            {withPlans.map((item) => (
              <li key={item.id} className="rounded-xl border border-line bg-white p-4 shadow-sm">
                <Link
                  className="font-semibold text-teal hover:underline"
                  href={adminClientSectionHref(userId, item.criterion.section, item.criterion.ref)}
                >
                  {item.criterion.ref}
                </Link>
                <p className="mt-1 text-sm leading-relaxed text-muted line-clamp-3">{item.criterion.question}</p>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-ink">{item.actionPlan}</p>
              </li>
            ))}
          </ul>
        </AssessmentPanel>
      ) : (
        <AssessmentPanel title="Documented action plans (0)">
          <p className="rounded-xl border border-dashed border-line bg-white/60 px-4 py-10 text-center text-sm text-muted">
            The client has not written any action plans yet.
          </p>
        </AssessmentPanel>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <AssessmentPanel title={`Marked No (${noAnswers.length})`}>
          {noAnswers.length === 0 ? (
            <p className="text-sm text-muted">No criteria are marked No.</p>
          ) : (
            <ul className="grid gap-3">
              {noAnswers.map((item) => (
                <li key={item.id} className="rounded-xl border border-line bg-white p-4 shadow-sm">
                  <Link
                    className="font-semibold text-teal hover:underline"
                    href={adminClientSectionHref(userId, item.criterion.section, item.criterion.ref)}
                  >
                    {item.criterion.ref}
                  </Link>
                  <p className="mt-1 text-sm text-muted line-clamp-3">{item.criterion.question}</p>
                </li>
              ))}
            </ul>
          )}
        </AssessmentPanel>
        <AssessmentPanel title={`Still to answer (${unanswered.length})`}>
          {unanswered.length === 0 ? (
            <p className="text-sm text-muted">Every question has an answer.</p>
          ) : (
            <ul className="grid gap-3">
              {unanswered.slice(0, 10).map((item) => (
                <li key={item.id} className="rounded-xl border border-line bg-white p-4 shadow-sm">
                  <Link
                    className="font-semibold text-teal hover:underline"
                    href={adminClientSectionHref(userId, item.section, item.ref)}
                  >
                    {item.ref}
                  </Link>
                  <p className="mt-1 text-sm text-muted line-clamp-3">{item.question}</p>
                </li>
              ))}
            </ul>
          )}
        </AssessmentPanel>
      </div>
    </div>
  );
}

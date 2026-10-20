import type { Metadata } from "next";
import Link from "next/link";
import { SecondaryLink } from "@/frontend/components/assessment-report-ui";
import { AssessmentPageHeader, AssessmentPanel } from "@/frontend/components/assessment-panel";
import { prisma } from "@/backend/lib/prisma";
import { requireOrganization } from "@/backend/lib/session";

export const metadata: Metadata = { title: "Action plans" };

export default async function ActionPlansPage() {
  const { organization } = await requireOrganization();
  const criteria = await prisma.criterion.findMany({ orderBy: { sortOrder: "asc" } });
  const responses = await prisma.response.findMany({
    where: { organizationId: organization.id },
    include: { criterion: true },
  });
  const byCriterion = new Map(responses.map((item) => [item.criterionId, item]));
  const withPlans = responses.filter((item) => item.actionPlan.trim().length > 0);
  const noAnswers = responses.filter((item) => item.status === "NO");
  const unanswered = criteria
    .filter((item) => {
      const response = byCriterion.get(item.id);
      return !response?.status;
    })
    .map((item) => ({ criterion: item }));

  return (
    <div className="grid gap-8">
      <AssessmentPageHeader
        title="Action plans"
        description="Work through gaps in order of priority: criteria marked No need remediation; unanswered items still need a decision."
        actions={<SecondaryLink href="/assessment">Back to sections</SecondaryLink>}
      />

      {withPlans.length > 0 ? (
        <AssessmentPanel title={`Documented action plans (${withPlans.length})`}>
          <ul className="grid gap-4">
            {withPlans.map((item) => (
              <li key={item.id} className="rounded-xl border border-line bg-white p-4 shadow-sm">
                <div className="flex gap-3">
                  <ActionBadge
                    label={item.status === "NO" ? "No" : item.status ?? "Open"}
                    tone={item.status === "NO" ? "danger" : "muted"}
                  />
                  <div className="min-w-0">
                    <Link
                      className="font-semibold text-teal hover:underline"
                      href={`/assessment/${item.criterion.section}?ref=${item.criterion.ref}`}
                    >
                      {item.criterion.ref}
                    </Link>
                    <p className="mt-1 text-sm leading-relaxed text-muted line-clamp-3">{item.criterion.question}</p>
                  </div>
                </div>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-ink">{item.actionPlan}</p>
              </li>
            ))}
          </ul>
        </AssessmentPanel>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <AssessmentPanel title={`Marked No (${noAnswers.length})`}>
          {noAnswers.length === 0 ? (
            <EmptyState message="No criteria are marked No. Keep going or review the assignment report for overall status." />
          ) : (
            <ul className="grid gap-3">
              {noAnswers.map((item) => (
                <ActionRow
                  key={item.id}
                  criterionRef={item.criterion.ref}
                  section={item.criterion.section}
                  question={item.criterion.question}
                  badge="No"
                  badgeTone="danger"
                />
              ))}
            </ul>
          )}
        </AssessmentPanel>

        <AssessmentPanel title={`Still to answer (${unanswered.length})`}>
          {unanswered.length === 0 ? (
            <EmptyState message="Every question has an answer. Nice work." />
          ) : (
            <>
              <ul className="grid gap-3">
                {unanswered.slice(0, 10).map((item) => (
                  <ActionRow
                    key={item.criterion.id}
                    criterionRef={item.criterion.ref}
                    section={item.criterion.section}
                    question={item.criterion.question}
                    badge="Open"
                    badgeTone="muted"
                  />
                ))}
              </ul>
              {unanswered.length > 10 ? (
                <p className="mt-4 border-t border-line/60 pt-4 text-sm text-muted">
                  And {unanswered.length - 10} more open questions.{" "}
                  <Link className="font-semibold text-teal hover:underline" href="/assessment">
                    Continue the assessment
                  </Link>
                </p>
              ) : null}
            </>
          )}
        </AssessmentPanel>
      </div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <p className="rounded-xl border border-dashed border-line bg-white/60 px-4 py-10 text-center text-sm leading-relaxed text-muted">
      {message}
    </p>
  );
}

function ActionBadge({ label, tone }: { label: string; tone: "danger" | "muted" }) {
  return (
    <span
      className={
        tone === "danger"
          ? "shrink-0 rounded-md bg-danger/10 px-2 py-1 text-[11px] font-bold tracking-wide text-danger uppercase"
          : "shrink-0 rounded-md bg-paper px-2 py-1 text-[11px] font-bold tracking-wide text-muted uppercase"
      }
    >
      {label}
    </span>
  );
}

function ActionRow({
  criterionRef,
  section,
  question,
  badge,
  badgeTone,
}: {
  criterionRef: string;
  section: string;
  question: string;
  badge: string;
  badgeTone: "danger" | "muted";
}) {
  return (
    <li className="flex gap-3 rounded-xl border border-line bg-white p-4 shadow-sm">
      <ActionBadge label={badge} tone={badgeTone} />
      <div className="min-w-0">
        <Link
          className="font-semibold text-teal hover:underline"
          href={`/assessment/${section}?ref=${criterionRef}`}
        >
          {criterionRef}
        </Link>
        <p className="mt-1 text-sm leading-relaxed text-muted line-clamp-3">{question}</p>
      </div>
    </li>
  );
}

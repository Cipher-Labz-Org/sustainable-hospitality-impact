import type { Metadata } from "next";
import { AdminClientsPanel } from "@/frontend/components/admin-clients-panel";
import { AdminTabs } from "@/frontend/components/admin-tabs";
import { PageShell } from "@/frontend/components/page-shell";
import { prisma } from "@/backend/lib/prisma";
import { requireAdmin } from "@/backend/lib/session";

export const metadata: Metadata = { title: "Client assessments" };

export default async function AdminClientsPage() {
  await requireAdmin();

  const [totalQuestions, users] = await Promise.all([
    prisma.criterion.count(),
    prisma.user.findMany({
      where: { isAdmin: false },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        createdAt: true,
        organization: {
          select: {
            name: true,
            country: true,
            reportPublishedAt: true,
            responses: {
              select: {
                status: true,
                updatedAt: true,
                _count: { select: { evidence: true } },
              },
            },
          },
        },
      },
    }),
  ]);

  return (
    <PageShell width="xl" className="py-8 sm:py-10">
      <div className="surface-banner relative mb-6 p-5 sm:p-6">
        <p className="text-eyebrow text-eyebrow-brass">Administration</p>
        <h1 className="mt-1 font-serif text-3xl tracking-tight text-ink sm:text-4xl">
          Client <span className="text-teal">assessments</span>
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          Review the GSTC assessment and reports each client has filled in. This view is read-only — clients keep editing
          in their own accounts.
        </p>
      </div>

      <AdminTabs />

      <AdminClientsPanel
        clients={users.map((user) => {
          const answeredResponses = (user.organization?.responses ?? []).filter((item) => item.status);
          const lastActivity = answeredResponses.reduce<Date | null>((latest, item) => {
            if (!latest || item.updatedAt > latest) return item.updatedAt;
            return latest;
          }, null);
          const answered = answeredResponses.length;
          return {
            id: user.id,
            email: user.email,
            organizationName: user.organization?.name ?? "",
            country: user.organization?.country ?? "",
            createdAt: user.createdAt.toISOString(),
            lastActivityAt: lastActivity?.toISOString() ?? null,
            answered,
            total: totalQuestions,
            percent: totalQuestions ? Math.round((answered / totalQuestions) * 100) : 0,
            yesCount: answeredResponses.filter((item) => item.status === "YES").length,
            noCount: answeredResponses.filter((item) => item.status === "NO").length,
            evidenceCount: (user.organization?.responses ?? []).reduce((sum, item) => sum + item._count.evidence, 0),
            published: Boolean(user.organization?.reportPublishedAt),
          };
        })}
      />
    </PageShell>
  );
}

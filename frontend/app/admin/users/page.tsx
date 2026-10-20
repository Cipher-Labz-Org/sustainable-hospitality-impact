import type { Metadata } from "next";
import { AdminTabs } from "@/frontend/components/admin-tabs";
import { AdminUsersPanel } from "@/frontend/components/admin-users-panel";
import { PageShell } from "@/frontend/components/page-shell";
import { prisma } from "@/backend/lib/prisma";
import { requireAdmin } from "@/backend/lib/session";

export const metadata: Metadata = { title: "Client sign-in" };

export default async function AdminUsersPage() {
  await requireAdmin();

  const users = await prisma.user.findMany({
    where: { isAdmin: false },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      createdAt: true,
      organization: { select: { name: true } },
    },
  });

  return (
    <PageShell width="lg" className="py-8 sm:py-10">
      <div className="surface-banner relative mb-6 p-5 sm:p-6">
        <p className="text-eyebrow text-eyebrow-brass">Administration</p>
        <h1 className="mt-1 font-serif text-3xl tracking-tight text-ink sm:text-4xl">
          Client <span className="text-teal">sign-in</span>
        </h1>
        <p className="mt-2 text-sm text-muted">
          Set each customer&apos;s login email and password. Clients cannot change these—only you can, from this page. To
          change <strong>your own</strong> admin sign-in, use My Space → Admin sign-in. To read a client&apos;s filled
          assessment and report, open <strong>Client assessments</strong>.
        </p>
      </div>

      <AdminTabs />

      <AdminUsersPanel
        users={users.map((user) => ({
          id: user.id,
          email: user.email,
          organizationName: user.organization?.name ?? "",
          createdAt: user.createdAt.toISOString(),
        }))}
      />
    </PageShell>
  );
}

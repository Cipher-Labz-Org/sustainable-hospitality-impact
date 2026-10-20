import { AdminClientBreadcrumb } from "@/frontend/components/admin-client-breadcrumb";
import { AdminClientMobileNav } from "@/frontend/components/admin-client-mobile-nav";
import { AdminClientSidebar } from "@/frontend/components/admin-client-sidebar";
import { AssessmentWorkspaceBackdrop } from "@/frontend/components/assessment-workspace-backdrop";
import { contentContainerClass } from "@/frontend/components/page-shell";
import { cn } from "@/frontend/components/ui";
import { clientDisplayName, requireAdminClient } from "@/backend/lib/admin-client";

export default async function AdminClientLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const client = await requireAdminClient(userId);
  const organizationName = clientDisplayName(client.organization?.name, client.email);

  return (
    <section className="assessment-canvas relative z-0 min-h-[calc(100svh-var(--site-header-height))] pb-12 pt-3 sm:pb-14">
      <AssessmentWorkspaceBackdrop />
      <div className={cn(contentContainerClass, "relative py-6 sm:py-8")}>
        <div className="mb-4 rounded-2xl border border-teal/25 bg-teal-soft/50 px-4 py-3 text-sm text-ink">
          <strong>Admin review:</strong> {organizationName} ({client.email}). Answers and reports are read-only.
        </div>
        <AdminClientBreadcrumb userId={userId} organizationName={organizationName} />
        <div className="mt-4">
          <AdminClientMobileNav userId={userId} />
        </div>
        <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">
          <AdminClientSidebar userId={userId} organizationName={organizationName} />
          <div className="assessment-main-panel isolate min-w-0 flex-1 p-5 sm:p-6 lg:p-8">{children}</div>
        </div>
      </div>
    </section>
  );
}

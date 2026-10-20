import { AssessmentBreadcrumb } from "@/frontend/components/assessment-breadcrumb";
import { AssessmentWorkspaceBackdrop } from "@/frontend/components/assessment-workspace-backdrop";
import { contentContainerClass } from "@/frontend/components/page-shell";
import { cn } from "@/frontend/components/ui";
import { AssessmentMobileNav } from "@/frontend/components/assessment-mobile-nav";
import { AssessmentSidebar } from "@/frontend/components/assessment-sidebar";
import { requireOrganization } from "@/backend/lib/session";

export default async function AssessmentLayout({ children }: { children: React.ReactNode }) {
  const { organization } = await requireOrganization();

  return (
    <section className="assessment-canvas relative z-0 min-h-[calc(100svh-var(--site-header-height))] pb-12 pt-3 sm:pb-14">
      <AssessmentWorkspaceBackdrop />
      <div className={cn(contentContainerClass, "relative py-6 sm:py-8")}>
        <AssessmentBreadcrumb />
        <div className="mt-4">
          <AssessmentMobileNav />
        </div>
        <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">
          <AssessmentSidebar organizationName={organization.name ?? ""} />
          <div className="assessment-main-panel isolate min-w-0 flex-1 p-5 sm:p-6 lg:p-8">{children}</div>
        </div>
      </div>
    </section>
  );
}

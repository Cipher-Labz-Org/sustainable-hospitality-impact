import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/frontend/components/page-shell";
import { SpaceTabs, type SpaceTabId } from "@/frontend/components/space-tabs";
import { btnPrimary, btnSecondary, cn } from "@/frontend/components/ui";
import { prisma } from "@/backend/lib/prisma";
import { parseBusinessTypes, profileGaps, requireOrganization } from "@/backend/lib/session";

export const metadata: Metadata = { title: "My Space" };

const TAB_IDS: SpaceTabId[] = ["organization", "contact", "security", "brand"];

function resolveTab(tab: string | undefined, canChangePassword: boolean): SpaceTabId {
  const allowed = canChangePassword ? TAB_IDS : TAB_IDS.filter((id) => id !== "security");
  if (tab && allowed.includes(tab as SpaceTabId)) return tab as SpaceTabId;
  return "organization";
}

export default async function SpacePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { organization, session } = await requireOrganization();
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { canChangePassword: true, isAdmin: true, email: true },
  });
  const isAdmin = user?.isAdmin ?? false;
  const canChangePassword = isAdmin;
  const params = await searchParams;
  const tab = resolveTab(params.tab, canChangePassword);
  const gaps = profileGaps(organization);
  const contact = organization.contact!;

  return (
    <PageShell width="xl" className="py-5 sm:py-10">
      <div className="surface-banner relative mb-5 flex flex-col gap-4 p-4 sm:mb-6 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between sm:p-6">
        <div className="relative z-[1] min-w-0">
          <p className="text-eyebrow text-eyebrow-brass">My Space</p>
          <h1 className="mt-1 font-serif text-2xl tracking-tight text-ink sm:text-4xl">
            Your <span className="text-teal">profile</span>
          </h1>
          <p className="mt-2 max-w-xl text-sm text-muted">
            These details appear on your reports. You can update them any time.
          </p>
        </div>
        <Link href="/assessment" className={cn(btnSecondary, "relative z-[1] w-full justify-center sm:w-auto")}>
          Go to assessment
        </Link>
      </div>

      {isAdmin ? (
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-teal/25 bg-teal-soft/50 px-4 py-3 sm:px-5">
          <p className="text-sm text-ink">
            <strong>Admin:</strong> Set client sign-in details, or review the assessments and reports they have filled in.
          </p>
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/users" className={cn(btnSecondary, "shrink-0 text-sm")}>
              Client sign-in
            </Link>
            <Link href="/admin/clients" className={cn(btnPrimary, "shrink-0 text-sm")}>
              Client assessments
            </Link>
          </div>
        </div>
      ) : null}

      {gaps.length > 0 ? (
        <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-brass/25 bg-gradient-to-r from-brass-soft/80 via-raised to-teal-soft/40 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 flex-wrap items-center gap-2 text-sm text-ink">
            <span className="rounded-full bg-brass/20 px-2 py-0.5 text-xs font-semibold text-brass uppercase">To do</span>
            <span>A few details are still needed for your reports.</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {gaps.map((gap) => (
              <Link
                key={gap.key}
                href={gap.href}
                className="rounded-full border border-brass/25 bg-raised px-3 py-1.5 text-sm font-semibold text-ink transition hover:border-teal/35 hover:bg-teal-soft/60"
              >
                Add {gap.label}
              </Link>
            ))}
          </div>
        </div>
      ) : null}

      <SpaceTabs
        initialTab={tab}
        canChangePassword={canChangePassword}
        signInEmail={user?.email ?? session.user.email ?? ""}
        organization={{
          name: organization.name,
          country: organization.country,
          language: organization.language || "English",
          city: organization.city,
          street: organization.street,
          number: organization.number,
          postcode: organization.postcode,
          businessTypes: parseBusinessTypes(organization.businessTypes),
        }}
        contact={{
          firstName: contact.firstName,
          lastName: contact.lastName,
          title: contact.title,
          phone: contact.phone,
          email: contact.email,
        }}
        hasLogo={!!organization.brand}
        logoVersion={organization.brand?.updatedAt.toISOString()}
      />
    </PageShell>
  );
}

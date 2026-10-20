"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AssessmentNavIconGlyph } from "@/frontend/components/assessment-nav-icons";
import {
  ADMIN_CLIENT_NAV,
  adminClientHref,
  adminClientNavActive,
} from "@/frontend/lib/admin-client-nav";
import { ASSESSMENT_NAV_ACCENT } from "@/frontend/lib/assessment-nav-accent";
import { cn } from "./ui";

export function AdminClientSidebar({
  userId,
  organizationName,
}: {
  userId: string;
  organizationName: string;
}) {
  const pathname = usePathname();
  const displayName = organizationName.trim() || "Client assessment";

  return (
    <aside className="hidden w-full shrink-0 lg:z-30 lg:block lg:w-[17rem] lg:sticky lg:top-[var(--site-header-height)] lg:self-start">
      <div className="assessment-sidebar-shell overflow-hidden rounded-2xl border border-teal/20 shadow-[var(--shadow-float)]">
        <div className="relative overflow-hidden border-b border-teal-deep/50 px-4 py-4 assessment-sidebar-header">
          <div className="pointer-events-none absolute inset-0 assessment-sidebar-header-shine" aria-hidden="true" />
          <p className="relative text-[11px] font-semibold tracking-[0.18em] text-brass-soft uppercase">Client review</p>
          <p className="relative mt-1.5 font-serif text-[1.05rem] leading-snug text-raised">{displayName}</p>
        </div>
        <nav aria-label="Client assessment" className="assessment-sidebar-nav max-h-[calc(100vh-7.5rem)] overflow-y-auto overscroll-contain px-2 py-3">
          <p className="mb-1.5 px-2 text-[10px] font-bold leading-snug tracking-[0.12em] text-teal-muted uppercase">
            Submitted work
          </p>
          <ul className="grid gap-1">
            {ADMIN_CLIENT_NAV.map((item) => {
              const href = adminClientHref(userId, item.suffix);
              const active = adminClientNavActive(pathname, userId, item.suffix);
              const accent = ASSESSMENT_NAV_ACCENT[item.icon];
              return (
                <li key={item.suffix || "hub"}>
                  <Link
                    href={href}
                    className={cn(
                      "group relative flex items-center gap-2.5 rounded-xl border px-2.5 py-2.5 text-[13px] leading-tight transition duration-200",
                      active
                        ? cn("font-semibold shadow-sm ring-1", accent.rowActive, accent.labelActive)
                        : cn("border-transparent text-muted", accent.rowHover),
                    )}
                    aria-current={active ? "page" : undefined}
                  >
                    {active ? (
                      <span className={cn("absolute inset-y-2 left-0 w-1 rounded-full", accent.bar)} aria-hidden="true" />
                    ) : null}
                    <span
                      className={cn(
                        "grid h-8 w-8 shrink-0 place-items-center rounded-lg border transition duration-200",
                        active ? accent.iconActive : accent.icon,
                      )}
                    >
                      <AssessmentNavIconGlyph icon={item.icon} active={active} />
                    </span>
                    <span className="min-w-0 flex-1">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </aside>
  );
}

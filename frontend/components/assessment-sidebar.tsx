"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AssessmentNavIconGlyph } from "@/frontend/components/assessment-nav-icons";
import { ASSESSMENT_NAV, assessmentNavActive } from "@/frontend/lib/assessment-nav";
import { ASSESSMENT_NAV_ACCENT } from "@/frontend/lib/assessment-nav-accent";
import { SUSTAINABILITY_MANAGEMENT_NAME } from "@/backend/lib/sustainability-management";
import { cn } from "./ui";

const NAV_GROUPS: { label: string; hrefs: string[] }[] = [
  {
    label: SUSTAINABILITY_MANAGEMENT_NAME,
    hrefs: ["/assessment"],
  },
  {
    label: "Reports & outputs",
    hrefs: [
      "/assessment/action-plans",
      "/assessment/sustainability",
      "/assessment/remarks",
      "/assessment/publish",
      "/assessment/share",
      "/assessment/audit",
      "/assessment/library",
      "/assessment/overview",
    ],
  },
];

export function AssessmentSidebar({ organizationName }: { organizationName: string }) {
  const pathname = usePathname();
  const displayName = organizationName.trim() || "Your organization";

  return (
    <aside className="hidden w-full shrink-0 lg:z-30 lg:block lg:w-[17rem] lg:sticky lg:top-[var(--site-header-height)] lg:self-start">
      <div className="assessment-sidebar-shell overflow-hidden rounded-2xl border border-teal/20 shadow-[var(--shadow-float)]">
        <div className="relative overflow-hidden border-b border-teal-deep/50 px-4 py-4 assessment-sidebar-header">
          <div className="pointer-events-none absolute inset-0 assessment-sidebar-header-shine" aria-hidden="true" />
          <p className="relative text-[11px] font-semibold tracking-[0.18em] text-brass-soft uppercase">Assignments</p>
          <p className="relative mt-1.5 font-serif text-[1.05rem] leading-snug text-raised">{displayName}</p>
        </div>

        <nav
          aria-label="Assessment modules"
          className="assessment-sidebar-nav max-h-[calc(100vh-7.5rem)] overflow-y-auto overscroll-contain px-2 py-3"
        >
          {NAV_GROUPS.map((group) => {
            const items = ASSESSMENT_NAV.filter((entry) => group.hrefs.includes(entry.href));
            return (
              <div key={group.label} className="mb-3 last:mb-0">
                <p className="mb-1.5 px-2 text-[10px] font-bold leading-snug tracking-[0.12em] text-teal-muted uppercase">
                  {group.label}
                </p>
                <ul className="grid gap-1">
                  {items.map((item) => {
                    const active = assessmentNavActive(pathname, item.href);
                    const accent = ASSESSMENT_NAV_ACCENT[item.icon];
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          prefetch={true}
                          className={cn(
                            "group relative flex items-center gap-2.5 rounded-xl border px-2.5 py-2.5 text-[13px] leading-tight transition duration-200",
                            active
                              ? cn("font-semibold shadow-sm ring-1", accent.rowActive, accent.labelActive)
                              : cn("border-transparent text-muted", accent.rowHover),
                          )}
                          aria-current={active ? "page" : undefined}
                        >
                          {active ? (
                            <span
                              className={cn("absolute inset-y-2 left-0 w-1 rounded-full", accent.bar)}
                              aria-hidden="true"
                            />
                          ) : null}
                          <span
                            className={cn(
                              "grid h-8 w-8 shrink-0 place-items-center rounded-lg border transition duration-200",
                              active ? accent.iconActive : accent.icon,
                              !active && "group-hover:scale-[1.03]",
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
              </div>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}

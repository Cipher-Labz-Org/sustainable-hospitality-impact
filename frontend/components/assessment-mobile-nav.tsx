"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ASSESSMENT_NAV, assessmentNavActive } from "@/frontend/lib/assessment-nav";
import { cn } from "./ui";

/** Horizontal module strip when the left sidebar is stacked or cramped. */
export function AssessmentMobileNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Assessment modules"
      className="-mx-1 flex gap-2 overflow-x-auto rounded-2xl border border-teal/15 bg-white/80 px-2 py-2 shadow-[0_4px_18px_rgba(19,107,100,0.06)] backdrop-blur-md lg:hidden"
    >
      {ASSESSMENT_NAV.map((item) => {
        const active = assessmentNavActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "shrink-0 rounded-full border px-3.5 py-2 text-xs font-semibold transition",
              active
                ? "border-teal bg-teal text-raised shadow-sm"
                : "border-line bg-raised text-muted hover:border-teal/30 hover:bg-teal-soft/40 hover:text-teal",
            )}
            aria-current={active ? "page" : undefined}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

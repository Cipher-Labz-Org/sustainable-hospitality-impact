"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ADMIN_CLIENT_NAV, adminClientHref, adminClientNavActive } from "@/frontend/lib/admin-client-nav";
import { cn } from "./ui";

export function AdminClientMobileNav({ userId }: { userId: string }) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Client assessment"
      className="-mx-1 flex gap-2 overflow-x-auto rounded-2xl border border-teal/15 bg-white/80 px-2 py-2 shadow-[0_4px_18px_rgba(19,107,100,0.06)] backdrop-blur-md lg:hidden"
    >
      {ADMIN_CLIENT_NAV.map((item) => {
        const href = adminClientHref(userId, item.suffix);
        const active = adminClientNavActive(pathname, userId, item.suffix);
        return (
          <Link
            key={item.suffix || "hub"}
            href={href}
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

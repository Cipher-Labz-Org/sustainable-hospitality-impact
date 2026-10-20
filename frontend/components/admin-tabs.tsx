"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "./ui";

const TABS = [
  { href: "/admin/users", label: "Client sign-in", hint: "Email and password" },
  { href: "/admin/clients", label: "Client assessments", hint: "Answers and reports" },
] as const;

export function AdminTabs() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Administration"
      className="mb-6 flex flex-wrap gap-2 rounded-2xl border border-line/70 bg-white/80 p-1.5 shadow-sm"
    >
      {TABS.map((tab) => {
        const active = pathname === tab.href || pathname.startsWith(`${tab.href}/`);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex min-w-[10rem] flex-1 flex-col rounded-xl px-4 py-2.5 transition",
              active ? "bg-teal text-raised shadow-sm" : "text-ink hover:bg-teal-soft/50",
            )}
          >
            <span className="text-sm font-semibold">{tab.label}</span>
            <span className={cn("text-xs", active ? "text-raised/80" : "text-muted")}>{tab.hint}</span>
          </Link>
        );
      })}
    </nav>
  );
}

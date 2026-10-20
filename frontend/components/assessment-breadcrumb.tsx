"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { assessmentBackLink, assessmentNavLabel } from "@/frontend/lib/assessment-nav";
import { SECTIONS } from "@/backend/lib/sections";
import { BackLink } from "./ui";

function crumbLabel(pathname: string): string {
  const section = SECTIONS.find((item) => pathname === `/assessment/${item.id}`);
  if (section) return `Section ${section.id} · ${section.title}`;
  return assessmentNavLabel(pathname);
}

export function AssessmentBreadcrumb() {
  const pathname = usePathname();
  const current = crumbLabel(pathname);
  const back = assessmentBackLink(pathname);
  const showCrumbTail = pathname !== "/assessment";

  return (
    <div className="grid gap-3">
      {back ? (
        <BackLink href={back.href} className="w-fit">
          {back.label}
        </BackLink>
      ) : null}

      <nav
        aria-label="Breadcrumb"
        className="rounded-2xl border border-teal/15 bg-white/85 px-3.5 py-2.5 text-sm text-muted shadow-[0_4px_22px_rgba(19,107,100,0.07)] backdrop-blur-md"
      >
        <ol className="flex flex-wrap items-center gap-1.5">
          <li>
            <Link className="rounded-md px-1 py-0.5 text-teal hover:bg-teal-soft hover:underline" href="/">
              Home
            </Link>
          </li>
          <li aria-hidden="true" className="text-line select-none">/</li>
          <li>
            {showCrumbTail ? (
              <Link className="rounded-md px-1 py-0.5 text-teal hover:bg-teal-soft hover:underline" href="/assessment">
                Assessment &amp; reporting
              </Link>
            ) : (
              <span className="px-1 font-medium text-ink" aria-current="page">Assessment &amp; reporting</span>
            )}
          </li>
          {showCrumbTail ? (
            <>
              <li aria-hidden="true" className="text-line select-none">/</li>
              <li>
                <span className="px-1 font-medium text-ink" aria-current="page">{current}</span>
              </li>
            </>
          ) : null}
        </ol>
      </nav>
    </div>
  );
}

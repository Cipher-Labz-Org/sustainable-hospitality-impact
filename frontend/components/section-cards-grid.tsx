"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { cn } from "./ui";

export type SectionCardStat = {
  id: string;
  title: string;
  official: string;
  description: string;
  done: number;
  total: number;
  percent: number;
};

function SectionDetailPanel({
  section,
  className,
}: {
  section: SectionCardStat;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-3xl border border-line/70 bg-gradient-to-br from-white to-raised/40 p-5 shadow-[0_8px_32px_rgba(26,24,20,0.08)]",
        className,
      )}
    >
      <div className="flex items-start gap-4">
        <span
          className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-teal-soft font-serif text-3xl text-teal"
          aria-hidden="true"
        >
          {section.id}
        </span>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold tracking-[0.14em] text-brass uppercase">Section {section.id}</p>
          <h3 className="mt-1 font-serif text-xl leading-snug text-ink">{section.title}</h3>
        </div>
      </div>
      <div className="mt-4 space-y-3 border-t border-line/70 pt-4">
        <p className="text-sm leading-relaxed text-muted">{section.official}</p>
        <p className="text-sm leading-relaxed text-muted/95">{section.description}</p>
      </div>
      <p className="mt-4 text-xs font-medium text-teal">
        {section.done}/{section.total} answered · {section.percent}% complete
      </p>
    </div>
  );
}

export function SectionCardsGrid({
  sections,
  sectionBasePath = "/assessment",
}: {
  sections: SectionCardStat[];
  sectionBasePath?: string;
}) {
  const [activeId, setActiveId] = useState<string>(sections[0]?.id ?? "A");

  const active = sections.find((item) => item.id === activeId) ?? sections[0];

  const selectSection = useCallback((id: string) => {
    setActiveId(id);
  }, []);

  if (!active) return null;

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_18.5rem] xl:items-start">
      <div className="grid gap-5">
        <div className="grid gap-4 sm:grid-cols-2">
        {sections.map((section) => {
          const isActive = section.id === activeId;
          return (
            <div
              key={section.id}
              className="relative"
              onMouseEnter={() => selectSection(section.id)}
              onFocusCapture={() => selectSection(section.id)}
            >
              <Link
                href={`${sectionBasePath}/${section.id}`}
                className={cn(
                  "relative block h-full rounded-3xl border bg-gradient-to-br from-white to-raised/20 p-5 shadow-sm transition duration-200",
                  isActive
                    ? "border-teal/40 shadow-[0_10px_32px_rgba(14,75,72,0.14)] ring-2 ring-teal/15"
                    : "border-line/70 hover:-translate-y-0.5 hover:border-teal/30 hover:shadow-md",
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <span
                    className={cn(
                      "grid h-11 w-11 place-items-center rounded-xl font-serif text-xl transition-colors",
                      isActive ? "bg-teal text-raised" : "bg-teal-soft text-teal",
                    )}
                  >
                    {section.id}
                  </span>
                  <span className="rounded-full bg-paper px-2.5 py-1 text-xs font-medium text-muted">
                    {section.done}/{section.total}
                  </span>
                </div>
                <p className="mt-4 text-[11px] font-semibold tracking-[0.14em] text-brass uppercase">
                  Section {section.id}
                </p>
                <h3 className={cn("mt-1 font-serif text-xl", isActive ? "text-teal" : "text-ink")}>{section.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted line-clamp-2 xl:line-clamp-3">{section.description}</p>
                <div className="mt-4 flex items-center gap-3">
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-line/80">
                    <div
                      className={cn("h-full rounded-full transition-all", isActive ? "bg-teal" : "bg-ok")}
                      style={{ width: `${section.percent}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold tabular-nums text-muted">{section.percent}%</span>
                </div>
              </Link>
            </div>
          );
        })}
        </div>

        <div className="xl:hidden">
          <p className="mb-3 text-xs font-medium tracking-wide text-muted uppercase">Section preview</p>
          <SectionDetailPanel key={active.id} section={active} />
          <Link
            href={`${sectionBasePath}/${active.id}`}
            className="mt-4 inline-flex w-full items-center justify-center rounded-full bg-teal px-4 py-2.5 text-sm font-semibold text-raised transition hover:bg-teal-deep sm:w-auto"
          >
            Open section {active.id}
          </Link>
        </div>
      </div>

      <aside className="hidden xl:z-30 xl:block xl:sticky xl:top-[calc(var(--site-header-height)+1.5rem)]">
        <p className="mb-3 text-xs font-medium tracking-wide text-muted uppercase">Section preview</p>
        <SectionDetailPanel key={active.id} section={active} />
        <Link
          href={`${sectionBasePath}/${active.id}`}
          className="mt-4 inline-flex w-full items-center justify-center rounded-full bg-teal px-4 py-2.5 text-sm font-semibold text-raised transition hover:bg-teal-deep"
        >
          Open section {active.id}
        </Link>
      </aside>
    </div>
  );
}

import Link from "next/link";
import type { ReactNode } from "react";
import { btnPrimary, btnSecondary, cn } from "./ui";

function ArrowRight({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className={className}>
      <path d="M3 8h10M9 4l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}

export function ProgressHero({
  percent,
  title,
  subtitle,
  footer,
}: {
  percent: number;
  title: string;
  subtitle: string;
  footer?: ReactNode;
}) {
  const clamped = Math.min(100, Math.max(0, percent));
  return (
    <div className="assessment-feature-card relative overflow-hidden rounded-3xl border border-line/70 bg-white p-6 sm:p-8">
      <div
        className="pointer-events-none absolute -top-16 -right-10 h-48 w-48 rounded-full bg-teal-soft/80 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-20 -left-10 h-40 w-40 rounded-full bg-brass/10 blur-3xl"
        aria-hidden="true"
      />
      <div className="relative flex flex-col gap-8 sm:flex-row sm:items-center">
        <div
          className="relative mx-auto grid h-[8.5rem] w-[8.5rem] shrink-0 place-items-center sm:mx-0"
          role="img"
          aria-label={`${clamped}% complete`}
        >
          <div
            className="absolute inset-0 rounded-full opacity-90"
            style={{
              background: `conic-gradient(from -90deg, var(--teal) ${clamped * 3.6}deg, color-mix(in srgb, var(--line) 85%, white) 0deg)`,
            }}
          />
          <div className="absolute inset-[7px] rounded-full bg-gradient-to-b from-white to-raised shadow-[inset_0_1px_2px_rgba(26,24,20,0.06)]" />
          <p className="relative font-serif text-[2rem] tabular-nums leading-none text-teal">{clamped}%</p>
        </div>
        <div className="min-w-0 flex-1 text-center sm:text-left">
          <p className="text-lg font-semibold tracking-tight text-ink">{title}</p>
          <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-muted">{subtitle}</p>
          {footer ? <div className="mt-4">{footer}</div> : null}
        </div>
      </div>
    </div>
  );
}

type StatItem = {
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "ok" | "danger" | "teal";
};

const statAccent: Record<NonNullable<StatItem["tone"]> | "default", string> = {
  default: "from-ink/40 to-ink/10",
  teal: "from-teal to-teal/30",
  ok: "from-ok to-ok/30",
  danger: "from-danger to-danger/30",
};

export function ReportStatGrid({ stats }: { stats: StatItem[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => {
        const tone = stat.tone ?? "default";
        return (
          <div
            key={stat.label}
            className="group relative overflow-hidden rounded-2xl border border-line/70 bg-white px-4 py-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-teal/25 hover:shadow-md"
          >
            <div className={cn("absolute inset-x-0 top-0 h-1 bg-gradient-to-r", statAccent[tone])} />
            <p className="text-[11px] font-semibold tracking-wide text-muted uppercase">{stat.label}</p>
            <p
              className={cn(
                "mt-2 font-serif text-[2rem] leading-none tabular-nums",
                tone === "ok" && "text-ok",
                tone === "danger" && "text-danger",
                tone === "teal" && "text-teal",
                tone === "default" && "text-ink",
              )}
            >
              {stat.value}
            </p>
            {stat.hint ? <p className="mt-2 text-xs text-muted">{stat.hint}</p> : null}
          </div>
        );
      })}
    </div>
  );
}

export function SectionProgressList({
  sections,
  linkSections = true,
}: {
  sections: { id: string; title: string; done: number; total: number; percent: number }[];
  linkSections?: boolean;
}) {
  return (
    <ul className="grid gap-3">
      {sections.map((section) => {
        const rowClass =
          "group flex flex-col gap-3 rounded-2xl border border-line/70 bg-gradient-to-r from-white to-raised/30 px-4 py-4 shadow-sm sm:flex-row sm:items-center";
        const inner = (
          <>
            <span
              className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-teal-soft font-serif text-xl text-teal shadow-sm transition group-hover:bg-teal group-hover:text-raised"
            >
              {section.id}
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-ink transition group-hover:text-teal">{section.title}</p>
              <p className="mt-1 text-xs text-muted">
                {section.done} of {section.total} answered
              </p>
            </div>
            <div className="flex w-full items-center gap-3 sm:w-auto sm:min-w-[9rem]">
              <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-line/80">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-teal to-teal-muted transition-all"
                  style={{ width: `${section.percent}%` }}
                />
              </div>
              <span className="w-11 text-right text-sm font-bold tabular-nums text-teal">{section.percent}%</span>
            </div>
            {linkSections ? (
              <ArrowRight className="hidden h-4 w-4 shrink-0 text-teal/0 transition group-hover:text-teal sm:block" />
            ) : null}
          </>
        );
        return (
          <li key={section.id}>
            {linkSections ? (
              <Link
                href={`/assessment/${section.id}`}
                className={cn(rowClass, "transition duration-200 hover:border-teal/30 hover:shadow-md")}
              >
                {inner}
              </Link>
            ) : (
              <div className={rowClass}>{inner}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

const QUICK_LINKS = [
  { href: "/assessment/overview", label: "Overview & download", desc: "PDF / CSV exports" },
  { href: "/assessment/action-plans", label: "Action plans", desc: "Gaps to close" },
  { href: "/assessment/library", label: "All documents", desc: "Evidence files" },
  { href: "/assessment/sustainability", label: "Sustainability report", desc: "Export settings" },
] as const;

export function AssessmentQuickLinks({
  activeHref,
  links = QUICK_LINKS,
}: {
  activeHref?: string;
  links?: readonly { href: string; label: string; desc: string }[];
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {links.map((item) => {
        const active = activeHref === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "group flex items-start justify-between gap-3 rounded-2xl border px-4 py-4 transition duration-200",
              active
                ? "border-teal/40 bg-teal-soft/60 shadow-sm ring-1 ring-teal/10"
                : "border-line/70 bg-white shadow-sm hover:border-teal/25 hover:bg-raised/80 hover:shadow-md",
            )}
          >
            <div>
              <p className={cn("text-sm font-semibold", active ? "text-teal" : "text-ink")}>{item.label}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted">{item.desc}</p>
            </div>
            <ArrowRight
              className={cn(
                "mt-0.5 h-4 w-4 shrink-0 transition",
                active ? "text-teal" : "text-muted group-hover:translate-x-0.5 group-hover:text-teal",
              )}
            />
          </Link>
        );
      })}
    </div>
  );
}

export function PrimaryLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className={btnPrimary}>
      {children}
    </Link>
  );
}

export function SecondaryLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className={btnSecondary}>
      {children}
    </Link>
  );
}

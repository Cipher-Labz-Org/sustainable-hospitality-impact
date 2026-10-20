import type { ReactNode } from "react";
import { cn } from "./ui";

export function AssessmentPageHeader({
  title,
  description,
  actions,
  eyebrow,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  eyebrow?: string;
}) {
  return (
    <header className="surface-hero surface-hero-assessment">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div className="min-w-0">
          {eyebrow ? <p className="text-eyebrow">{eyebrow}</p> : null}
          <h1 className={cn("font-serif text-ink sm:leading-tight", eyebrow ? "mt-2" : "mt-0")}>{title}</h1>
          {description ? <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-muted">{description}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap gap-2.5">{actions}</div> : null}
      </div>
    </header>
  );
}

export function AssessmentPanel({
  title,
  children,
  action,
  className,
  tone = "teal",
  flush,
}: {
  title: string;
  children: ReactNode;
  action?: ReactNode;
  className?: string;
  tone?: "teal" | "muted";
  flush?: boolean;
}) {
  return (
    <section className={cn("assessment-panel overflow-hidden rounded-3xl border border-line/70 bg-white", className)}>
      <div
        className={cn(
          "flex items-center justify-between gap-3 px-5 py-3.5 text-raised",
          tone === "teal" ? "assessment-panel-header" : "assessment-panel-header-muted border-b border-line/80 text-ink",
        )}
      >
        <h2 className="text-sm font-semibold tracking-wide">{title}</h2>
        {action}
      </div>
      <div className={cn(flush ? "bg-raised/30" : "bg-gradient-to-b from-raised/50 to-white p-5 sm:p-6")}>{children}</div>
    </section>
  );
}

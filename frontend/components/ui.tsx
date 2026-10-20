import Link from "next/link";
import type { ReactNode } from "react";

export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export const fieldClass =
  "w-full rounded-xl border border-line/90 bg-raised px-3.5 py-2.5 text-ink outline-none transition placeholder:text-muted/70 focus:border-teal focus:ring-4 focus:ring-teal/15";

export const btnPrimary =
  "inline-flex items-center justify-center rounded-full bg-gradient-to-r from-teal via-teal to-teal-deep px-5 py-2.5 text-sm font-semibold text-raised shadow-[var(--shadow-teal)] transition hover:brightness-105 hover:shadow-[0_8px_22px_color-mix(in_srgb,var(--teal)_36%,transparent)] active:scale-[0.98]";

export const btnSecondary =
  "inline-flex items-center justify-center rounded-full border border-teal/20 bg-raised px-5 py-2.5 text-sm font-semibold text-teal-deep shadow-sm transition hover:border-teal/35 hover:bg-teal-soft/60 active:scale-[0.98]";

export const btnDangerOutline =
  "inline-flex items-center justify-center rounded-full border border-danger/35 bg-danger-soft px-5 py-2.5 text-sm font-semibold text-[#8f3d3d] shadow-sm transition hover:border-danger/50 hover:bg-[color-mix(in_srgb,var(--danger)_16%,var(--raised))] active:scale-[0.98]";

export function Button({
  children,
  variant = "primary",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
}) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-full px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60",
        variant === "primary" && btnPrimary,
        variant === "secondary" && btnSecondary,
        variant === "ghost" && "text-teal hover:bg-teal-soft",
        variant === "danger" && btnDangerOutline,
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-ink">{label}</span>
      <div className="mt-2.5">{children}</div>
      {hint ? <span className="mt-1.5 block text-xs leading-relaxed text-muted">{hint}</span> : null}
      {error ? <span className="mt-1.5 block text-sm font-medium text-danger">{error}</span> : null}
    </label>
  );
}

export function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <section className={cn("surface-card p-6 sm:p-8", className)}>
      {children}
    </section>
  );
}

export function TextLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link className="font-medium text-teal underline decoration-teal/30 underline-offset-4 hover:decoration-teal" href={href}>
      {children}
    </Link>
  );
}

function ChevronLeftIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 shrink-0">
      <path
        d="M14.5 6 9 12l5.5 6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function BackLink({ href, children, className }: { href: string; children: ReactNode; className?: string }) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-line bg-white px-4 py-2.5 text-sm font-medium text-ink shadow-sm transition-colors",
        "hover:border-teal hover:bg-teal hover:text-raised",
        "active:bg-teal-deep active:text-raised",
        className,
      )}
    >
      <ChevronLeftIcon />
      {children}
    </Link>
  );
}

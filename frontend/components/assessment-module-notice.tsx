import type { ReactNode } from "react";

export function AssessmentModuleNotice({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-2xl border border-teal/15 bg-gradient-to-r from-teal-soft/50 to-white px-5 py-4 text-sm leading-relaxed text-ink shadow-sm">
      {children}
    </p>
  );
}

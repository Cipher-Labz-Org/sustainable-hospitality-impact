import type { AssessmentNavIcon } from "@/frontend/lib/assessment-nav";
import { cn } from "./ui";

const base = "h-[1.05rem] w-[1.05rem] shrink-0";

export function AssessmentNavIconGlyph({
  icon,
  active,
}: {
  icon: AssessmentNavIcon;
  active: boolean;
}) {
  const className = cn(base, active ? "text-current" : "text-current opacity-90");

  switch (icon) {
    case "assessment":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
          <path
            d="M9 12l2 2 4-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <rect x="4" y="4" width="16" height="16" rx="3" fill="none" stroke="currentColor" strokeWidth="1.8" />
        </svg>
      );
    case "report":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
          <path d="M6 18V8M10 18V5M14 18v-6M18 18v-9" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case "action-plans":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
          <rect x="3" y="5" width="18" height="16" rx="2" fill="none" stroke="currentColor" strokeWidth="1.8" />
          <path d="M8 10h8M8 14h5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case "sustainability":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
          <path d="M8 6h13M8 12h13M8 18h13M4 6h.01M4 12h.01M4 18h.01" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case "remarks":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
          <path d="M8 6h13M8 12h13M8 18h10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <circle cx="5" cy="6" r="1" fill="currentColor" />
          <circle cx="5" cy="12" r="1" fill="currentColor" />
          <circle cx="5" cy="18" r="1" fill="currentColor" />
        </svg>
      );
    case "publish":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
          <path d="M9 11l3 3L22 4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" fill="none" stroke="currentColor" strokeWidth="1.8" />
        </svg>
      );
    case "share":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
          <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" fill="none" stroke="currentColor" strokeWidth="1.8" />
          <path d="M16 6l-4-4-4 4M12 2v13" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case "audit":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
          <path d="M8 6h13M8 12h13M8 18h13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case "documents":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
          <path d="M4 7h8l2 2h6v10H4V7Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
          <path d="M12 7V5a1 1 0 0 1 1-1h3v3" fill="none" stroke="currentColor" strokeWidth="1.8" />
        </svg>
      );
    case "overview":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
          <path d="M7 3h10v18H7V3Z" fill="none" stroke="currentColor" strokeWidth="1.8" />
          <path d="M9 7h6M9 11h6M9 15h4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
  }
}

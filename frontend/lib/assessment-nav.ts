export type AssessmentNavIcon =
  | "assessment"
  | "report"
  | "action-plans"
  | "sustainability"
  | "remarks"
  | "publish"
  | "share"
  | "audit"
  | "documents"
  | "overview";

export const ASSESSMENT_NAV = [
  { href: "/assessment", label: "Assessment & reporting", icon: "assessment" as AssessmentNavIcon },
  { href: "/assessment/action-plans", label: "Action plans", icon: "action-plans" as AssessmentNavIcon },
  { href: "/assessment/sustainability", label: "Sustainability report", icon: "sustainability" as AssessmentNavIcon },
  { href: "/assessment/remarks", label: "Remarks report", icon: "remarks" as AssessmentNavIcon },
  { href: "/assessment/publish", label: "Publish report", icon: "publish" as AssessmentNavIcon },
  { href: "/assessment/share", label: "Share report", icon: "share" as AssessmentNavIcon },
  { href: "/assessment/audit", label: "Audit report", icon: "audit" as AssessmentNavIcon },
  { href: "/assessment/library", label: "All documents", icon: "documents" as AssessmentNavIcon },
  { href: "/assessment/overview", label: "Overview", icon: "overview" as AssessmentNavIcon },
] as const;

function matchNavEntry(pathname: string) {
  for (const entry of ASSESSMENT_NAV) {
    if (entry.href === "/assessment") {
      if (pathname === "/assessment" || /^\/assessment\/[A-D]$/.test(pathname)) return entry;
      continue;
    }
    if (pathname === entry.href || pathname.startsWith(`${entry.href}/`)) return entry;
  }
  return null;
}

export function assessmentNavLabel(pathname: string): string {
  const item = matchNavEntry(pathname);
  if (item) return item.label;
  return "Assessment";
}

export function isAssessmentHub(pathname: string) {
  return pathname === "/assessment";
}

/** Parent route for “back” on assessment sub-pages (sections use hub; modules use /assessment). */
export function assessmentBackLink(pathname: string): { href: string; label: string } | null {
  if (isAssessmentHub(pathname)) return null;
  if (/^\/assessment\/[A-D]$/.test(pathname)) {
    return { href: "/assessment", label: "Back to assessment" };
  }
  if (pathname.startsWith("/assessment/")) {
    return { href: "/assessment", label: "Back to assessment" };
  }
  return null;
}

export function assessmentNavActive(pathname: string, href: string) {
  if (href === "/assessment") {
    return pathname === "/assessment" || /^\/assessment\/[A-D]$/.test(pathname);
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

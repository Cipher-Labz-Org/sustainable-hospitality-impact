import type { AssessmentNavIcon } from "@/frontend/lib/assessment-nav";

export function adminClientBase(userId: string) {
  return `/admin/clients/${userId}`;
}

export function adminClientSectionBase(userId: string) {
  return `${adminClientBase(userId)}/assessment`;
}

export function adminClientSectionHref(userId: string, sectionId: string, ref?: string) {
  const href = `${adminClientSectionBase(userId)}/${sectionId}`;
  return ref ? `${href}?ref=${encodeURIComponent(ref)}` : href;
}

export const ADMIN_CLIENT_NAV = [
  { suffix: "", label: "Assessment & reporting", icon: "assessment" as AssessmentNavIcon },
  { suffix: "/action-plans", label: "Action plans", icon: "action-plans" as AssessmentNavIcon },
  { suffix: "/remarks", label: "Remarks report", icon: "remarks" as AssessmentNavIcon },
  { suffix: "/library", label: "All documents", icon: "documents" as AssessmentNavIcon },
  { suffix: "/overview", label: "Overview & download", icon: "overview" as AssessmentNavIcon },
] as const;

export function adminClientHref(userId: string, suffix: string) {
  return `${adminClientBase(userId)}${suffix}`;
}

export function adminClientNavActive(pathname: string, userId: string, suffix: string) {
  const href = adminClientHref(userId, suffix);
  if (suffix === "") {
    return pathname === href || pathname.startsWith(`${href}/assessment/`);
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function adminClientNavLabel(pathname: string, userId: string) {
  const sectionPrefix = `${adminClientBase(userId)}/assessment/`;
  if (pathname.startsWith(sectionPrefix)) {
    const section = pathname.slice(sectionPrefix.length);
    if (/^[A-D]$/.test(section)) return `Section ${section}`;
  }
  const item = ADMIN_CLIENT_NAV.find((entry) => adminClientNavActive(pathname, userId, entry.suffix));
  return item?.label ?? "Client assessment";
}

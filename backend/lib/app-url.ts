import { headers } from "next/headers";

/** Origin for share links in server components and actions. */
export async function appBaseUrl() {
  const headerList = await headers();
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host");
  const proto = headerList.get("x-forwarded-proto") ?? "http";
  if (host) return `${proto}://${host}`;
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

export function shareReportPath(token: string) {
  return `/share/${token}`;
}

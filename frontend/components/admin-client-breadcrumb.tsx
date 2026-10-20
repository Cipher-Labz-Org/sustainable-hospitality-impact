"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { adminClientBase, adminClientNavLabel } from "@/frontend/lib/admin-client-nav";
import { BackLink } from "./ui";

export function AdminClientBreadcrumb({
  userId,
  organizationName,
}: {
  userId: string;
  organizationName: string;
}) {
  const pathname = usePathname();
  const hub = adminClientBase(userId);
  const onHub = pathname === hub;
  const current = adminClientNavLabel(pathname, userId);
  const name = organizationName.trim() || "Client";

  return (
    <div className="grid gap-3">
      <BackLink href="/admin/clients" className="w-fit">
        All client assessments
      </BackLink>
      <nav
        aria-label="Breadcrumb"
        className="rounded-2xl border border-teal/15 bg-white/85 px-3.5 py-2.5 text-sm text-muted shadow-[0_4px_22px_rgba(19,107,100,0.07)] backdrop-blur-md"
      >
        <ol className="flex flex-wrap items-center gap-1.5">
          <li>
            <Link className="rounded-md px-1 py-0.5 text-teal hover:bg-teal-soft hover:underline" href="/admin/clients">
              Client assessments
            </Link>
          </li>
          <li aria-hidden="true" className="text-line select-none">
            /
          </li>
          <li>
            {onHub ? (
              <span className="px-1 font-medium text-ink" aria-current="page">
                {name}
              </span>
            ) : (
              <Link className="rounded-md px-1 py-0.5 text-teal hover:bg-teal-soft hover:underline" href={hub}>
                {name}
              </Link>
            )}
          </li>
          {onHub ? null : (
            <>
              <li aria-hidden="true" className="text-line select-none">
                /
              </li>
              <li>
                <span className="px-1 font-medium text-ink" aria-current="page">
                  {current}
                </span>
              </li>
            </>
          )}
        </ol>
      </nav>
    </div>
  );
}

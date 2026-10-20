"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/frontend/components/ui";

type SiteBrandProps = {
  signedIn: boolean;
  hasLogo: boolean;
  logoVersion?: string;
  organizationName?: string;
};

function BrandFrame({
  href,
  label,
  className,
  children,
}: {
  href: string;
  label: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      className={cn("group flex shrink-0 items-center rounded-2xl outline-offset-4", className)}
    >
      {children}
    </Link>
  );
}

function AddLogoPlate({ children }: { children: ReactNode }) {
  return (
    <span className="flex h-12 shrink-0 items-center justify-center rounded-2xl bg-white px-2.5 py-1 shadow-[0_6px_18px_rgba(19,107,100,0.08)] ring-1 ring-teal/15 transition group-hover:ring-teal/30 sm:h-16 sm:px-3">
      {children}
    </span>
  );
}

function brandSrc(logoVersion: string | undefined, userId?: string | null) {
  const params = new URLSearchParams();
  params.set("v", logoVersion ?? "1");
  if (userId) params.set("userId", userId);
  return `/api/files/brand?${params.toString()}`;
}

function HeaderLogoImage({
  src,
  alt,
  fallback,
}: {
  src: string;
  alt: string;
  fallback: string;
}) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-teal-soft to-white text-sm font-semibold text-teal-deep sm:h-16 sm:w-16">
        {fallback}
      </span>
    );
  }

  return (
    // Authenticated API image — not a static public asset.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      onError={() => setFailed(true)}
      className="h-12 w-auto max-w-[9.5rem] rounded-xl object-contain object-left sm:h-16 sm:max-w-[14rem]"
    />
  );
}

function clientUserIdFromPath(pathname: string) {
  const match = pathname.match(/^\/admin\/clients\/([^/]+)/);
  return match?.[1] ?? null;
}

export function SiteBrand({ signedIn, hasLogo, logoVersion, organizationName = "" }: SiteBrandProps) {
  const pathname = usePathname();
  const clientUserId = clientUserIdFromPath(pathname);
  const showClientLogo = Boolean(clientUserId);
  const initial = organizationName.trim().charAt(0).toUpperCase() || "+";
  const src = brandSrc(logoVersion, clientUserId);
  const name = organizationName.trim();

  if (signedIn && (hasLogo || showClientLogo)) {
    return (
      <BrandFrame href="/" label={name || "Organization home"}>
        <HeaderLogoImage key={src} src={src} alt={name || "Organization logo"} fallback={initial} />
      </BrandFrame>
    );
  }

  if (signedIn) {
    return (
      <BrandFrame href="/space?tab=brand" label="Add your organization logo">
        <AddLogoPlate>
          <span className="flex items-center gap-2.5 px-1">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-teal-soft text-sm font-semibold text-teal-deep sm:h-10 sm:w-10">
              {initial}
            </span>
            <span className="hidden min-w-0 flex-col leading-tight sm:flex">
              <span className="truncate text-sm font-semibold text-ink">{name || "Your logo"}</span>
              <span className="text-[11px] font-medium text-muted">Add logo</span>
            </span>
          </span>
        </AddLogoPlate>
      </BrandFrame>
    );
  }

  return (
    <BrandFrame href="/" label="Home" className="rounded-lg">
      <span className="font-serif text-lg tracking-tight text-teal-deep sm:text-xl">Assessment</span>
    </BrandFrame>
  );
}

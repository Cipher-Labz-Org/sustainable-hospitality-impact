"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { btnPrimary, cn } from "./ui";

function MainNavLink({
  href,
  active,
  children,
  title,
}: {
  href: string;
  active: boolean;
  children: ReactNode;
  title?: string;
}) {
  return (
    <Link
      href={href}
      title={title}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative shrink-0 px-3 py-2 text-sm font-semibold transition-colors sm:px-4",
        active ? "text-teal-deep" : "text-muted hover:text-teal",
      )}
    >
      {children}
      <span
        className={cn(
          "absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-gradient-to-r from-teal-muted to-teal transition-opacity sm:inset-x-4",
          active ? "opacity-100" : "opacity-0",
        )}
        aria-hidden="true"
      />
    </Link>
  );
}

function Avatar({ name }: { name: string }) {
  const initial = name.trim().charAt(0).toUpperCase() || "?";
  return (
    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-teal to-teal-deep text-xs font-bold text-raised shadow-[var(--shadow-teal)]">
      {initial}
    </span>
  );
}

/** Primary app routes — centered on desktop, scrollable row on small screens. */
export function SiteMainNav({ signedIn, isAdmin = false }: { signedIn: boolean; isAdmin?: boolean }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab");

  const onHome = pathname === "/";
  const onSpace = pathname === "/space" && tab !== "contact";
  const onAssessment = pathname === "/assessment" || pathname.startsWith("/assessment/");
  const onAdminUsers = pathname === "/admin" || pathname.startsWith("/admin/users");
  const onAdminClients = pathname.startsWith("/admin/clients");

  if (!signedIn) {
    return (
      <nav aria-label="Main" className="flex items-center gap-0.5 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] md:gap-1 [&::-webkit-scrollbar]:hidden">
        <MainNavLink href="/" active={onHome}>Home</MainNavLink>
      </nav>
    );
  }

  return (
    <nav
      aria-label="Main"
      className="flex items-center gap-0.5 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] md:gap-1 [&::-webkit-scrollbar]:hidden"
    >
      <MainNavLink href="/" active={onHome}>Home</MainNavLink>
      <MainNavLink href="/space" active={onSpace}>My Space</MainNavLink>
      <MainNavLink
        href="/assessment"
        active={onAssessment}
        title="Assessment and reporting"
      >
        <span className="hidden lg:inline">Assessment &amp; reporting</span>
        <span className="lg:hidden">Assessment</span>
      </MainNavLink>
      {isAdmin ? (
        <>
          <MainNavLink href="/admin/users" active={onAdminUsers} title="Set client sign-in email and password">
            Client sign-in
          </MainNavLink>
          <MainNavLink href="/admin/clients" active={onAdminClients} title="Review assessments and reports filled by clients">
            <span className="hidden lg:inline">Client assessments</span>
            <span className="lg:hidden">Client work</span>
          </MainNavLink>
        </>
      ) : null}
    </nav>
  );
}

export function SiteUserMenu({ profileLabel }: { profileLabel: string }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const onProfile = pathname === "/space" && searchParams.get("tab") === "contact";

  return (
    <Link
      href="/space?tab=contact"
      title="Your contact details"
      aria-current={onProfile ? "page" : undefined}
      className={cn(
        "flex max-w-[2.75rem] items-center gap-2.5 rounded-full border py-1 pl-1 pr-1 transition sm:max-w-[13rem] sm:pr-4",
        onProfile
          ? "border-teal/30 bg-teal-soft/90 ring-1 ring-teal/10"
          : "border-line/70 bg-raised hover:border-teal/25 hover:bg-teal-soft/40",
      )}
    >
      <Avatar name={profileLabel} />
      <span className="hidden min-w-0 truncate text-sm font-semibold text-ink sm:inline">
        <span className="sr-only">Profile: </span>
        {profileLabel}
      </span>
    </Link>
  );
}

export function SiteGuestActions({ showSignup = false }: { showSignup?: boolean }) {
  const pathname = usePathname();
  const onLogin = pathname === "/login";
  const onSignup = pathname === "/signup";

  return (
    <div className="flex shrink-0 items-center gap-2 sm:gap-3">
      <Link
        href="/login"
        aria-current={onLogin ? "page" : undefined}
        className={cn(
          "rounded-full px-3 py-2 text-sm font-semibold transition sm:px-4",
          onLogin ? "text-teal" : "text-muted hover:text-ink",
        )}
      >
        Sign in
      </Link>
      {showSignup ? (
        <Link href="/signup" className={cn(btnPrimary, "px-4 py-2 text-sm sm:px-5")} aria-current={onSignup ? "page" : undefined}>
          Get started
        </Link>
      ) : null}
    </div>
  );
}

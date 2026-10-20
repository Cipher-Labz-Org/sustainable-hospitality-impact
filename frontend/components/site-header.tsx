import { Suspense } from "react";
import { signOutAction } from "@/backend/actions/auth";
import { SiteBrand } from "@/frontend/components/site-brand";
import { contentContainerClass } from "@/frontend/components/page-shell";
import { SiteGuestActions, SiteMainNav, SiteUserMenu } from "@/frontend/components/site-nav";
import { cn } from "@/frontend/components/ui";

function NavFallback() {
  return <div className="h-9 w-56 animate-pulse rounded-lg bg-line/30" aria-hidden="true" />;
}

export function SiteHeader({
  signedIn,
  isAdmin,
  profileLabel,
  showSignup,
  hasLogo,
  logoVersion,
  organizationName,
}: {
  signedIn: boolean;
  isAdmin: boolean;
  profileLabel: string;
  showSignup: boolean;
  hasLogo: boolean;
  logoVersion?: string;
  organizationName?: string;
}) {
  return (
    <header className="site-header border-b border-teal/12 shadow-[0_1px_0_color-mix(in_srgb,var(--teal)_8%,transparent),0_8px_28px_color-mix(in_srgb,var(--teal)_6%,transparent)]">
      <div className={cn(contentContainerClass, "relative")}>
        <div className="flex h-16 min-w-0 items-center justify-between gap-2 sm:h-20 sm:gap-4">
          <div className="flex h-full shrink-0 items-center">
            <SiteBrand
              signedIn={signedIn}
              hasLogo={hasLogo}
              logoVersion={logoVersion}
              organizationName={organizationName}
            />
          </div>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
            {signedIn ? (
              <>
                <Suspense fallback={<NavFallback />}>
                  <SiteUserMenu profileLabel={profileLabel} />
                </Suspense>
                <form action={signOutAction}>
                  <button
                    type="submit"
                    className="hidden rounded-full px-3 py-2 text-sm font-semibold text-danger transition hover:text-[#8a3838] sm:inline sm:px-4"
                  >
                    Sign out
                  </button>
                  <button
                    type="submit"
                    className="rounded-full p-2 text-danger transition hover:text-[#8a3838] sm:hidden"
                    aria-label="Sign out"
                  >
                    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
                      <path
                        d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.75"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                </form>
              </>
            ) : (
              <Suspense fallback={<NavFallback />}>
                <SiteGuestActions showSignup={showSignup} />
              </Suspense>
            )}
          </div>
        </div>

        <div className="relative z-10 border-t border-line/50 lg:absolute lg:top-0 lg:left-1/2 lg:flex lg:h-20 lg:w-max lg:-translate-x-1/2 lg:items-center lg:border-0">
          <Suspense fallback={<NavFallback />}>
            <SiteMainNav signedIn={signedIn} isAdmin={isAdmin} />
          </Suspense>
        </div>
      </div>
    </header>
  );
}

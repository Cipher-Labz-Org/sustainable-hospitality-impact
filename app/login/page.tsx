import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/frontend/components/login-form";
import { getSession } from "@/backend/lib/get-session";
import { isPublicSignupEnabled } from "@/backend/lib/public-signup";
import { safeNextPath } from "@/backend/lib/paths";

export const metadata: Metadata = { title: "Sign in" };

function LeafMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6 text-white" fill="none" aria-hidden="true">
      <path
        d="M5 19C5 11 11 5 19 5c0 8-6 14-14 14Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M5 19C9 15 13 11 17 9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const session = await getSession();
  const params = await searchParams;
  const callbackUrl = safeNextPath(params.callbackUrl);
  if (session) redirect(callbackUrl);

  return (
    <main className="relative flex min-h-[calc(100svh-3.5rem)] items-center justify-center overflow-hidden px-4 py-10 sm:py-14">
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
        <div className="absolute -top-28 left-1/2 h-[34rem] w-[34rem] -translate-x-1/2 rounded-full bg-teal-soft/55 blur-3xl" />
        <div className="absolute -bottom-32 -right-24 h-[26rem] w-[26rem] rounded-full bg-brass-soft/45 blur-3xl" />
        <div className="absolute -bottom-28 -left-24 h-[22rem] w-[22rem] rounded-full bg-sage-soft/40 blur-3xl" />
      </div>

      <div className="w-full max-w-md">
        <div className="overflow-hidden rounded-[1.75rem] border border-line/70 bg-raised shadow-[0_28px_80px_rgba(14,75,72,0.18)]">
          <div
            className="relative overflow-hidden px-7 pb-7 pt-8 text-raised sm:px-8"
            style={{ background: "linear-gradient(145deg, #0a4540 0%, #136b64 100%)" }}
          >
            <svg
              className="pointer-events-none absolute -right-6 -top-8 h-44 w-44 text-white/[0.07]"
              viewBox="0 0 120 120"
              fill="none"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path d="M18 100C18 52 52 18 100 18c0 48-34 82-82 82Z" strokeWidth="2.4" strokeLinejoin="round" />
              <path d="M18 100C38 80 60 58 86 42" strokeWidth="2.4" strokeLinecap="round" />
            </svg>

            <span className="relative grid h-12 w-12 place-items-center rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md">
              <LeafMark />
            </span>
            <p className="relative mt-5 text-[0.7rem] font-bold tracking-[0.2em] text-white/70 uppercase">
              Welcome back
            </p>
            <h1 className="relative mt-1.5 font-serif text-3xl sm:text-4xl">Sign in</h1>
            <p className="relative mt-2.5 max-w-sm text-sm leading-relaxed text-white/75">
              Access your organization&rsquo;s GSTC assessment workspace.
            </p>
          </div>

          <div className="px-7 py-7 sm:px-8 sm:py-8">
            <LoginForm callbackUrl={callbackUrl} showSignupLink={isPublicSignupEnabled()} />
          </div>
        </div>

        <p className="mt-6 text-center text-xs font-medium tracking-wide text-muted">
          Private workspace &middot; Your data stays yours
        </p>
      </div>
    </main>
  );
}

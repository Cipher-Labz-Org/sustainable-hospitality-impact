import Link from "next/link";
import { HomeHero } from "@/frontend/components/home-hero";
import { contentContainerClass } from "@/frontend/components/page-shell";
import { getSession } from "@/backend/lib/get-session";
import { prisma } from "@/backend/lib/prisma";
import { SECTIONS } from "@/backend/lib/sections";
import { sectionTone } from "@/frontend/lib/section-tones";
import { SUSTAINABILITY_MANAGEMENT_NAME } from "@/backend/lib/sustainability-management";
import { isPublicSignupEnabled } from "@/backend/lib/public-signup";
import { btnSecondary, cn } from "@/frontend/components/ui";

const STEPS = [
  {
    title: "Profile",
    body: "Add organization and contact details in My Space.",
  },
  {
    title: SUSTAINABILITY_MANAGEMENT_NAME,
    body: "Answer GSTC criteria across sections A through D in one structured record.",
  },
  {
    title: "Evidence",
    body: "Attach files that support each response.",
  },
] as const;

export default async function HomePage() {
  const session = await getSession();
  const publicSignup = isPublicSignupEnabled();
  const guestHref = publicSignup ? "/signup" : "/login";
  let continueHref = "/assessment";
  let answeredTotal = 0;
  let criteriaTotal = 0;

  if (session?.user?.id) {
    const organization = await prisma.organization.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });
    if (organization) {
      criteriaTotal = await prisma.criterion.count();
      answeredTotal = await prisma.response.count({
        where: { organizationId: organization.id, status: { not: null } },
      });
      const latest = await prisma.response.findFirst({
        where: { organizationId: organization.id, status: { not: null } },
        orderBy: { updatedAt: "desc" },
        include: { criterion: { select: { section: true, ref: true } } },
      });
      if (latest) continueHref = `/assessment/${latest.criterion.section}?ref=${latest.criterion.ref}`;
    }
  }

  const progressPercent =
    criteriaTotal > 0 ? Math.min(100, Math.round((answeredTotal / criteriaTotal) * 100)) : 0;

  return (
    <main className="overflow-x-hidden">
      <HomeHero
        signedIn={!!session}
        publicSignup={publicSignup}
        continueHref={continueHref}
        answeredTotal={answeredTotal}
        criteriaTotal={criteriaTotal}
        progressPercent={progressPercent}
      />

      <section className={cn(contentContainerClass, "relative pb-6 pt-2 sm:pt-4")}>
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { value: criteriaTotal > 0 ? String(criteriaTotal) : "200+", label: "CSM criteria" },
            { value: "4", label: "GSTC pillars" },
            { value: "1", label: "Private record" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="home-rise rounded-2xl border border-teal/14 bg-gradient-to-b from-white to-teal-soft/30 px-6 py-5 text-center shadow-[var(--shadow-card)]"
            >
              <p className="font-serif text-4xl text-teal-deep">{stat.value}</p>
              <p className="mt-1 text-sm font-medium text-muted">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className={cn(contentContainerClass, "py-8 sm:py-10")}>
        <div className="max-w-2xl">
          <p className="text-eyebrow">How it works</p>
          <h2 className="mt-3 font-serif text-4xl text-ink sm:text-[2.75rem]">Built for steady progress</h2>
          <p className="mt-4 text-muted">
            No rush—save anytime, return where you left off, and keep evidence tied to each answer.
          </p>
        </div>

        <ol className="mt-12 grid gap-6 md:grid-cols-3">
          {STEPS.map((step, i) => (
            <li
              key={step.title}
              className="group relative overflow-hidden rounded-[1.75rem] border border-line/80 bg-gradient-to-b from-white to-teal-soft/25 p-8 shadow-[var(--shadow-card)] transition hover:-translate-y-1 hover:shadow-[var(--shadow-float)]"
            >
              <span
                className="font-serif text-6xl leading-none text-teal/15 transition group-hover:text-teal/25"
                aria-hidden="true"
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-4 font-serif text-2xl text-ink">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="border-t border-line/60 bg-gradient-to-b from-shell/50 to-paper">
        <div className={cn(contentContainerClass, "pb-8 pt-8 sm:pb-9 sm:pt-10")}>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-eyebrow">The framework</p>
              <h2 className="mt-2 font-serif text-3xl text-ink sm:text-4xl">Every GSTC theme, in one place</h2>
            </div>
            {session ? (
              <Link className={btnSecondary} href="/assessment/library">Evidence library</Link>
            ) : (
              <Link className={btnSecondary} href={guestHref}>{publicSignup ? "Get started" : "Sign in"}</Link>
            )}
          </div>

          <div className="mt-10 grid gap-4 lg:grid-cols-4">
            {SECTIONS.map((section) => {
              const tone = sectionTone(section.id);
              const href = session ? `/assessment/${section.id}` : guestHref;
              return (
                <Link
                  key={section.id}
                  href={href}
                  className={cn(
                    "group flex min-h-[220px] flex-col rounded-[1.5rem] border p-6 transition duration-300 hover:-translate-y-1",
                    tone.card,
                  )}
                >
                  <span className={cn("inline-grid h-11 w-11 place-items-center rounded-xl font-serif text-xl", tone.badge)}>
                    {section.id}
                  </span>
                  <h3 className="mt-5 font-serif text-xl text-ink group-hover:text-teal-deep">{section.title}</h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">{section.official}</p>
                  <span className="mt-4 text-xs font-bold uppercase tracking-wider text-teal">Open section →</span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {!session ? (
        <section className={cn(contentContainerClass, "py-8 sm:py-10")}>
          <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-teal-deep via-teal to-teal-muted px-8 py-14 text-center text-raised shadow-[var(--shadow-float)] sm:px-16">
            <div
              className="pointer-events-none absolute inset-0 opacity-30"
              aria-hidden="true"
              style={{
                backgroundImage: "radial-gradient(circle at 30% 20%, white, transparent 45%)",
              }}
            />
            <p className="relative text-eyebrow !text-teal-soft/90">{publicSignup ? "Start today" : "Client access"}</p>
            <p className="relative mt-4 font-serif text-3xl sm:text-5xl">
              {publicSignup
                ? "Your sustainability story deserves a clear record."
                : "Sign in with the email and password from your administrator."}
            </p>
            <Link
              className="relative mt-8 inline-flex items-center justify-center rounded-full bg-raised px-8 py-3.5 text-sm font-bold text-teal-deep shadow-xl transition hover:scale-[1.02] hover:bg-white"
              href={guestHref}
            >
              {publicSignup ? "Create your workspace" : "Sign in"}
            </Link>
          </div>
        </section>
      ) : null}

    </main>
  );
}

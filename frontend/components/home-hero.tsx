import Link from "next/link";
import { contentContainerClass } from "@/frontend/components/page-shell";
import { SECTIONS } from "@/backend/lib/sections";
import { SUSTAINABILITY_MANAGEMENT_NAME } from "@/backend/lib/sustainability-management";
import { sectionTone } from "@/frontend/lib/section-tones";
import { btnPrimary, btnSecondary, cn } from "@/frontend/components/ui";

type HomeHeroProps = {
  signedIn: boolean;
  publicSignup: boolean;
  continueHref: string;
  answeredTotal: number;
  criteriaTotal: number;
  progressPercent: number;
};

function HeroFoliage() {
  return (
    <svg
      className="absolute inset-0 h-full w-full text-white/[0.055]"
      viewBox="0 0 1440 820"
      preserveAspectRatio="xMidYMid slice"
      fill="none"
      stroke="currentColor"
      aria-hidden="true"
    >
      <defs>
        <g id="hero-leaf" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M0 0C34 24 34 74 0 108C-34 74 -34 24 0 0Z" />
          <path d="M0 12V96" />
          <path d="M0 36C9 42 15 46 19 54" />
          <path d="M0 36C-9 42 -15 46 -19 54" />
          <path d="M0 60C9 66 15 70 19 78" />
          <path d="M0 60C-9 66 -15 70 -19 78" />
        </g>
      </defs>
      <use href="#hero-leaf" transform="translate(128 96) rotate(-20) scale(1.05)" />
      <use href="#hero-leaf" transform="translate(64 244) rotate(26) scale(0.68)" />
      <use href="#hero-leaf" transform="translate(236 612) rotate(-42) scale(1.18)" />
      <use href="#hero-leaf" transform="translate(690 724) rotate(8) scale(0.78)" />
      <use href="#hero-leaf" transform="translate(1318 128) rotate(34) scale(1.3)" />
      <use href="#hero-leaf" transform="translate(1224 332) rotate(-14) scale(0.9)" />
      <use href="#hero-leaf" transform="translate(1388 540) rotate(62) scale(1.02)" />
    </svg>
  );
}

function HeroMesh() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="home-hero-glow absolute -left-[18%] top-[5%] h-[50%] w-[50%] rounded-full bg-teal-soft/20 blur-3xl" />
      <div className="home-hero-glow-delay absolute right-[-5%] top-[28%] h-[42%] w-[34%] rounded-full bg-brass/10 blur-3xl" />
      <HeroFoliage />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_90%_55%_at_28%_0%,rgba(255,255,255,0.1),transparent_52%)]" />
    </div>
  );
}

function HeroWave() {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-px text-paper" aria-hidden="true">
      <svg viewBox="0 0 1440 88" className="block w-full" preserveAspectRatio="none">
        <path fill="currentColor" d="M0,48 C400,92 720,12 1080,52 C1260,72 1380,64 1440,58 L1440,88 L0,88 Z" />
      </svg>
    </div>
  );
}

const VINE_NODES = [
  { y: 312, fill: "var(--teal-soft)", glow: "var(--teal)" },
  { y: 234, fill: "var(--sun-soft)", glow: "var(--sun)" },
  { y: 156, fill: "var(--sage-soft)", glow: "var(--sage)" },
  { y: 78, fill: "var(--brass-soft)", glow: "var(--brass)" },
] as const;

function HeroVine() {
  return (
    <div
      className="home-rise home-rise-delay-2 relative hidden h-full w-full items-center justify-center lg:flex"
      aria-hidden="true"
    >
      <div className="absolute inset-y-8 left-1/2 w-20 -translate-x-1/2 rounded-full bg-teal-soft/12 blur-2xl" />
      <svg
        className="home-hero-vine relative h-full max-h-[23rem] min-h-[15rem] w-auto"
        viewBox="0 0 120 404"
        fill="none"
      >
        <defs>
          <linearGradient id="hero-vine-stem" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="rgba(223,243,239,0.12)" />
            <stop offset="55%" stopColor="rgba(223,243,239,0.5)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0.32)" />
          </linearGradient>
          <g id="hero-vine-leaf" strokeLinejoin="round" strokeLinecap="round">
            <path
              d="M0 0C18 -12 40 -4 48 18C26 24 4 18 0 0Z"
              fill="rgba(255,255,255,0.06)"
              stroke="rgba(255,255,255,0.22)"
              strokeWidth="1.6"
            />
            <path d="M5 3C16 7 30 13 42 18" stroke="rgba(255,255,255,0.2)" strokeWidth="1.4" />
          </g>
        </defs>

        <path
          d="M60 398 C52 364 68 352 60 312 C52 278 68 268 60 234 C52 200 68 190 60 156 C52 122 68 112 60 78 C56 50 58 32 60 14"
          stroke="url(#hero-vine-stem)"
          strokeWidth="3"
          strokeLinecap="round"
        />

        <use href="#hero-vine-leaf" transform="translate(60 300) rotate(-32) scale(1.05)" />
        <use href="#hero-vine-leaf" transform="translate(60 258) rotate(150) scale(0.82)" />
        <use href="#hero-vine-leaf" transform="translate(60 210) rotate(-24) scale(1.1)" />
        <use href="#hero-vine-leaf" transform="translate(60 168) rotate(152) scale(0.88)" />
        <use href="#hero-vine-leaf" transform="translate(60 120) rotate(-30) scale(1.02)" />
        <use href="#hero-vine-leaf" transform="translate(60 74) rotate(150) scale(0.78)" />

        {VINE_NODES.map((node, index) => (
          <g key={node.y} transform={`translate(60 ${node.y})`}>
            <circle r="10" fill={node.glow} opacity="0.2" />
            <circle
              className="home-hero-vine-dot"
              r="4.5"
              fill={node.fill}
              style={{ animationDelay: `${index * 0.5}s` }}
            />
          </g>
        ))}
      </svg>
    </div>
  );
}

function FourPillarsPanel({ signedIn, guestHref }: { signedIn: boolean; guestHref: string }) {
  return (
    <div className="home-rise home-rise-delay-2 w-full lg:max-w-[23rem] lg:justify-self-end">
      <div className="home-pillars-panel p-6 sm:p-7">
        <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-5">
          <div className="min-w-0 pr-1">
            <p className="text-[0.62rem] font-bold tracking-[0.18em] text-white/50 uppercase">GSTC framework</p>
            <p className="mt-2 font-serif text-[1.4rem] leading-tight text-white sm:text-[1.6rem]">Four pillars</p>
            <p className="mt-1.5 text-[0.8125rem] leading-relaxed text-white/55">One living sustainability record.</p>
          </div>
          <span
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/20 bg-white/10 font-serif text-lg text-white"
            aria-hidden="true"
          >
            4
          </span>
        </div>

        <ul className="mt-6 grid grid-cols-2 gap-3.5 sm:gap-4">
          {SECTIONS.map((section) => {
            const tone = sectionTone(section.id);
            const href = signedIn ? `/assessment/${section.id}` : guestHref;
            return (
              <li key={section.id} className="min-w-0">
                <Link
                  href={href}
                  className={cn(
                    "pillar-card flex h-full min-h-[7.75rem] flex-col gap-2 rounded-xl border border-line/40 bg-raised p-3.5 shadow-sm transition duration-300 sm:min-h-[8rem] sm:p-4",
                    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/80",
                  )}
                >
                  <span
                    className={cn(
                      "grid h-9 w-9 shrink-0 place-items-center rounded-lg font-serif text-[0.95rem]",
                      tone.badge,
                    )}
                  >
                    {section.id}
                  </span>
                  <span className="text-[0.8125rem] font-semibold leading-snug text-ink sm:text-sm">
                    {section.title}
                  </span>
                  <span className="text-[0.7rem] leading-relaxed text-muted line-clamp-3 sm:text-xs">
                    {section.description}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

export function HomeHero({
  signedIn,
  publicSignup,
  continueHref,
  answeredTotal,
  criteriaTotal,
  progressPercent,
}: HomeHeroProps) {
  const guestHref = publicSignup ? "/signup" : "/login";
  return (
    <section
      className={cn(
        "home-hero relative flex flex-col justify-center overflow-hidden text-raised",
        "min-h-[calc(100svh-6.25rem)] lg:min-h-[calc(100svh-3.5rem)]",
      )}
      style={{
        background: "linear-gradient(150deg, #052a27 0%, #0a4540 40%, #136b64 100%)",
      }}
    >
      <HeroMesh />
      <HeroWave />

      <div className={cn(contentContainerClass, "relative pb-20 pt-8 sm:pb-24 sm:pt-10 lg:pb-28")}>
        <div
          className={cn(
            "flex flex-col gap-10",
            "lg:grid lg:grid-cols-[minmax(0,1fr)_auto_21rem] lg:grid-rows-[auto_1fr] lg:items-center lg:gap-x-7 lg:gap-y-8",
            "xl:grid-cols-[minmax(0,1fr)_auto_23rem] xl:gap-x-10",
          )}
        >
          <div className="home-rise flex flex-wrap items-center gap-2.5 lg:col-start-1 lg:row-start-1 lg:self-end">
            <span className="rounded-full border border-white/20 bg-white/8 px-3.5 py-1.5 text-[0.65rem] font-bold tracking-[0.16em] text-white/90 uppercase">
              Global Sustainable Tourism Council
            </span>
            {signedIn && criteriaTotal > 0 ? (
              <span className="rounded-full bg-brass/90 px-3 py-1 text-xs font-semibold text-ink">
                {answeredTotal} / {criteriaTotal} answered
              </span>
            ) : null}
          </div>

          <div className="home-rise min-w-0 space-y-9 lg:col-start-1 lg:row-start-2 lg:self-start lg:pr-4 xl:pr-8">
            <header className="space-y-6">
              <h1 className="home-hero-headline font-serif text-balance">
                <span className="home-hero-headline-line1 block">
                  Record your <span className="text-teal-soft">sustainability</span>
                </span>
                <span className="mt-2.5 block text-white/95">with clarity.</span>
              </h1>
              <p className="max-w-xl text-[1.05rem] leading-8 text-white/80 sm:text-lg sm:leading-9">
                One private workspace for {SUSTAINABILITY_MANAGEMENT_NAME}—answers, notes, and evidence—organized across
                four pillars.
              </p>
              <p className="text-sm font-medium tracking-wide text-white/55">
                Self-paced framework · Evidence per question · Private by design
              </p>
            </header>

            <div className="space-y-6 border-t border-white/10 pt-8">
              {signedIn && criteriaTotal > 0 ? (
                <div className="home-hero-glass max-w-md p-4 sm:p-5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-white/90">Assessment progress</span>
                    <span className="font-serif text-2xl tabular-nums">{progressPercent}%</span>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/12">
                    <div
                      className="h-full rounded-full bg-white/90"
                      style={{ width: `${Math.max(progressPercent, 4)}%` }}
                    />
                  </div>
                </div>
              ) : null}

              <div className="flex flex-wrap gap-3">
                {signedIn ? (
                  <>
                    <Link className={cn(btnPrimary, "px-6 py-3 sm:px-7")} href={continueHref}>
                      Continue assessment
                    </Link>
                    <Link
                      className={cn(
                        btnSecondary,
                        "border-white/30 bg-transparent px-6 py-3 text-white hover:bg-white/10 hover:text-white sm:px-7",
                      )}
                      href="/assessment"
                    >
                      View dashboard
                    </Link>
                  </>
                ) : (
                  <>
                    {publicSignup ? (
                      <Link className={cn(btnPrimary, "px-6 py-3 sm:px-7")} href="/signup">Create an account</Link>
                    ) : null}
                    <Link
                      className={cn(
                        publicSignup ? btnSecondary : btnPrimary,
                        "border-white/30 bg-transparent px-6 py-3 text-white hover:bg-white/10 hover:text-white sm:px-7",
                        !publicSignup && "border-white/40 bg-white/10",
                      )}
                      href="/login"
                    >
                      Sign in
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="hidden lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:block lg:self-stretch">
            <HeroVine />
          </div>

          <div className="w-full lg:col-start-3 lg:row-span-2 lg:row-start-1 lg:self-center">
            <FourPillarsPanel signedIn={signedIn} guestHref={guestHref} />
          </div>
        </div>
      </div>
    </section>
  );
}

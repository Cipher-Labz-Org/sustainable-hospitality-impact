/** Decorative background for Assessment & reporting — flagship workspace atmosphere. */
export function AssessmentWorkspaceBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="assessment-canvas-glow absolute -left-[14%] top-[-10%] h-[min(58vh,32rem)] w-[min(75vw,40rem)] rounded-full bg-teal/14 blur-3xl" />
      <div className="assessment-canvas-glow-delay absolute right-[-8%] top-[8%] h-[min(48vh,26rem)] w-[min(58vw,32rem)] rounded-full bg-brass/14 blur-3xl" />
      <div className="absolute bottom-[8%] left-[10%] h-[min(44vh,24rem)] w-[min(52vw,30rem)] rounded-full bg-sage/12 blur-3xl" />
      <div className="absolute right-[22%] bottom-[-4%] h-[min(36vh,18rem)] w-[min(40vw,22rem)] rounded-full bg-sun/10 blur-3xl" />
      <div className="assessment-canvas-dots absolute inset-0" />
      <div className="assessment-canvas-contours absolute inset-0" />
      <svg
        className="absolute inset-0 h-full w-full text-teal/[0.065]"
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
        stroke="currentColor"
      >
        <defs>
          <g id="assessment-leaf" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M0 0C30 22 30 68 0 98C-30 68 -30 22 0 0Z" />
            <path d="M0 10V88" />
            <path d="M0 32C8 38 14 42 17 50" />
            <path d="M0 32C-8 38 -14 42 -17 50" />
          </g>
        </defs>
        <use href="#assessment-leaf" transform="translate(88 120) rotate(-18) scale(1.15)" />
        <use href="#assessment-leaf" transform="translate(1340 72) rotate(28) scale(1.35)" />
        <use href="#assessment-leaf" transform="translate(32 480) rotate(42) scale(0.95)" />
        <use href="#assessment-leaf" transform="translate(1308 620) rotate(-36) scale(1.12)" />
        <use href="#assessment-leaf" transform="translate(680 760) rotate(8) scale(0.8)" />
        <use href="#assessment-leaf" transform="translate(420 180) rotate(-8) scale(0.65)" />
        <use href="#assessment-leaf" transform="translate(1020 820) rotate(22) scale(0.9)" />
      </svg>
      <div
        className="absolute inset-0 bg-[radial-gradient(ellipse_85%_55%_at_50%_-8%,color-mix(in_srgb,var(--teal-soft)_62%,transparent),transparent_60%)]"
      />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-teal/35 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-paper/90 to-transparent" />
    </div>
  );
}

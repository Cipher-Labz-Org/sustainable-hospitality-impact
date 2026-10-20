/** GSTC section A–D accents — vivid but harmonized with the core teal/brass palette. */
export const SECTION_TONES: Record<
  string,
  { badge: string; card: string; dot: string }
> = {
  A: {
    badge: "bg-teal-soft text-teal-deep ring-1 ring-teal/25",
    card: "border-teal/20 bg-gradient-to-br from-teal-soft/50 via-raised to-white hover:border-teal/35 hover:shadow-[var(--shadow-float)]",
    dot: "bg-teal",
  },
  B: {
    badge: "bg-brass-soft text-brass ring-1 ring-brass/25",
    card: "border-brass/20 bg-gradient-to-br from-brass-soft/45 via-raised to-white hover:border-brass/35 hover:shadow-[var(--shadow-float)]",
    dot: "bg-brass",
  },
  C: {
    badge: "bg-sage-soft text-sage ring-1 ring-sage/25",
    card: "border-sage/20 bg-gradient-to-br from-sage-soft/45 via-raised to-white hover:border-sage/35 hover:shadow-[var(--shadow-float)]",
    dot: "bg-sage",
  },
  D: {
    badge: "bg-sun-soft text-sun ring-1 ring-sun/25",
    card: "border-sun/20 bg-gradient-to-br from-sun-soft/45 via-raised to-white hover:border-sun/35 hover:shadow-[var(--shadow-float)]",
    dot: "bg-sun",
  },
};

export function sectionTone(id: string) {
  return SECTION_TONES[id] ?? SECTION_TONES.A;
}

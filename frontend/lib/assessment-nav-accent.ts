import type { AssessmentNavIcon } from "@/frontend/lib/assessment-nav";

export type NavAccent = {
  icon: string;
  iconActive: string;
  rowActive: string;
  rowHover: string;
  bar: string;
  labelActive: string;
};

/** Per-module accents — teal family + brass, sage, sun, sky for variety. */
export const ASSESSMENT_NAV_ACCENT: Record<AssessmentNavIcon, NavAccent> = {
  assessment: {
    icon: "border-teal/20 bg-teal-soft/80 text-teal",
    iconActive: "border-teal/30 bg-teal text-raised shadow-[var(--shadow-teal)]",
    rowActive: "border-teal/30 bg-gradient-to-r from-teal-soft/95 via-white to-teal-soft/50 ring-teal/20",
    rowHover: "hover:border-teal/20 hover:bg-teal-soft/45 hover:text-teal-deep",
    bar: "bg-teal",
    labelActive: "text-teal-deep",
  },
  report: {
    icon: "border-sky/25 bg-sky-soft/90 text-sky",
    iconActive: "border-sky/35 bg-sky text-white shadow-[0_4px_14px_color-mix(in_srgb,var(--sky)_35%,transparent)]",
    rowActive: "border-sky/30 bg-gradient-to-r from-sky-soft/90 via-white to-sky-soft/40 ring-sky/20",
    rowHover: "hover:border-sky/25 hover:bg-sky-soft/50 hover:text-sky",
    bar: "bg-sky",
    labelActive: "text-[#2d6f82]",
  },
  "action-plans": {
    icon: "border-sun/25 bg-sun-soft/90 text-sun",
    iconActive: "border-sun/35 bg-sun text-white shadow-[0_4px_14px_color-mix(in_srgb,var(--sun)_38%,transparent)]",
    rowActive: "border-sun/30 bg-gradient-to-r from-sun-soft/95 via-white to-sun-soft/45 ring-sun/20",
    rowHover: "hover:border-sun/25 hover:bg-sun-soft/55 hover:text-sun",
    bar: "bg-sun",
    labelActive: "text-[#9a5c24]",
  },
  sustainability: {
    icon: "border-sage/25 bg-sage-soft/90 text-sage",
    iconActive: "border-sage/35 bg-sage text-white shadow-[0_4px_14px_color-mix(in_srgb,var(--sage)_35%,transparent)]",
    rowActive: "border-sage/30 bg-gradient-to-r from-sage-soft/95 via-white to-sage-soft/45 ring-sage/20",
    rowHover: "hover:border-sage/25 hover:bg-sage-soft/55 hover:text-sage",
    bar: "bg-sage",
    labelActive: "text-[#2d6b4a]",
  },
  remarks: {
    icon: "border-brass/25 bg-brass-soft/90 text-brass",
    iconActive: "border-brass/40 bg-brass text-white shadow-[0_4px_14px_color-mix(in_srgb,var(--brass)_38%,transparent)]",
    rowActive: "border-brass/30 bg-gradient-to-r from-brass-soft/95 via-white to-brass-soft/50 ring-brass/20",
    rowHover: "hover:border-brass/25 hover:bg-brass-soft/55 hover:text-brass",
    bar: "bg-brass",
    labelActive: "text-[#7a5a32]",
  },
  publish: {
    icon: "border-teal-muted/30 bg-teal-soft/70 text-teal-muted",
    iconActive: "border-teal-deep/40 bg-teal-deep text-raised shadow-[var(--shadow-teal)]",
    rowActive: "border-teal-deep/25 bg-gradient-to-r from-teal-soft/80 via-white to-brass-soft/35 ring-teal-deep/15",
    rowHover: "hover:border-teal-muted/30 hover:bg-teal-soft/40 hover:text-teal-deep",
    bar: "bg-teal-deep",
    labelActive: "text-teal-deep",
  },
  share: {
    icon: "border-sky/20 bg-sky-soft/75 text-sky",
    iconActive: "border-sky/35 bg-gradient-to-br from-sky to-teal text-white shadow-[0_4px_14px_color-mix(in_srgb,var(--sky)_32%,transparent)]",
    rowActive: "border-sky/28 bg-gradient-to-r from-sky-soft/85 via-white to-teal-soft/35 ring-sky/18",
    rowHover: "hover:border-sky/22 hover:bg-sky-soft/45 hover:text-sky",
    bar: "bg-gradient-to-b from-sky to-teal",
    labelActive: "text-[#2d6f82]",
  },
  audit: {
    icon: "border-line bg-paper text-muted",
    iconActive: "border-ink/20 bg-ink text-raised shadow-sm",
    rowActive: "border-line bg-gradient-to-r from-shell via-white to-teal-soft/30 ring-line/80",
    rowHover: "hover:border-line hover:bg-shell/80 hover:text-ink",
    bar: "bg-ink/70",
    labelActive: "text-ink",
  },
  documents: {
    icon: "border-brass/20 bg-brass-soft/75 text-brass",
    iconActive: "border-brass/35 bg-gradient-to-br from-brass to-sun text-white shadow-[0_4px_14px_color-mix(in_srgb,var(--brass)_35%,transparent)]",
    rowActive: "border-brass/28 bg-gradient-to-r from-brass-soft/90 via-white to-sun-soft/40 ring-brass/18",
    rowHover: "hover:border-brass/22 hover:bg-brass-soft/50 hover:text-brass",
    bar: "bg-gradient-to-b from-brass to-sun",
    labelActive: "text-[#7a5a32]",
  },
  overview: {
    icon: "border-sage/20 bg-sage-soft/75 text-sage",
    iconActive: "border-sage/35 bg-gradient-to-br from-sage to-teal text-white shadow-[0_4px_14px_color-mix(in_srgb,var(--sage)_32%,transparent)]",
    rowActive: "border-sage/28 bg-gradient-to-r from-sage-soft/90 via-white to-teal-soft/40 ring-sage/18",
    rowHover: "hover:border-sage/22 hover:bg-sage-soft/50 hover:text-sage",
    bar: "bg-gradient-to-b from-sage to-teal",
    labelActive: "text-[#2d6b4a]",
  },
};

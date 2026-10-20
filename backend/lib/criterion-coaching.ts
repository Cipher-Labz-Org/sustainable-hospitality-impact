import { getSection } from "@/backend/lib/sections";

export type CoachingCriterion = {
  ref: string;
  section: string;
  categoryCode: string;
  categoryName: string;
  question: string;
};

const EVIDENCE_HINTS: Record<string, string> = {
  A: "Policies, management plans, meeting minutes, org charts, training records, supplier lists, audit logs, and signed approvals.",
  B: "Payroll summaries, contracts, community donation records, local hiring stats, guest feedback, and partnership agreements.",
  C: "Cultural briefings, code-of-conduct materials, heritage site procedures, artwork licences, and staff training attendance.",
  D: "Utility bills, meter readings, maintenance logs, waste manifests, chemical inventories, biodiversity assessments, and environmental permits.",
};

function sectionIntro(sectionId: string) {
  const section = getSection(sectionId);
  if (!section) return "";
  return `${section.official}. ${section.description}`;
}

/** Coach text shown on the Guidance tab (not editable by the hotel). */
export function buildCriterionGuidance(criterion: CoachingCriterion): string {
  const evidence = EVIDENCE_HINTS[criterion.section] ?? "Written procedures, records, photos, and signed documents.";
  return [
    `Criterion ${criterion.ref} · ${criterion.categoryCode} ${criterion.categoryName}`,
    "",
    sectionIntro(criterion.section),
    "",
    "How to answer",
    `• Read the question carefully: “${criterion.question}”`,
    "• Choose Yes only if the practice is in place today, not planned for later.",
    "• Use N/A when the criterion clearly does not apply to your property type or context (explain why in Reporting).",
    "• Attach evidence that an auditor could verify without visiting every day (policy PDFs, photos, logs, contracts).",
    "",
    "Evidence that usually works",
    `• ${evidence}`,
    "",
    "GSTC tip",
    "Cross-check related questions in the same category — consistent answers and shared evidence strengthen your file.",
  ].join("\n");
}

/** Examples and ideas for the Best practices tab. */
export function buildCriterionBestPractices(criterion: CoachingCriterion): string {
  const category = criterion.categoryName.toLowerCase();
  const ideas: string[] = [];

  if (category.includes("policy") || category.includes("management")) {
    ideas.push(
      "Publish a one-page sustainability summary at reception and in guest rooms.",
      "Review targets annually with department heads and document decisions in meeting minutes.",
    );
  } else if (category.includes("employ") || category.includes("work") || category.includes("staff")) {
    ideas.push(
      "Track local hiring % and fair-wage compliance in a simple HR dashboard.",
      "Run annual staff satisfaction surveys and act on recurring themes.",
    );
  } else if (category.includes("community") || category.includes("local")) {
    ideas.push(
      "Partner with vetted local NGOs for skills training or micro-grants.",
      "Source produce and crafts from cooperatives with transparent pricing.",
    );
  } else if (category.includes("cultural") || category.includes("heritage")) {
    ideas.push(
      "Brief guests on respectful photography and dress codes before excursions.",
      "Use licensed interpreters and pay fair fees for cultural performances.",
    );
  } else if (
    category.includes("energy") ||
    category.includes("water") ||
    category.includes("waste") ||
    category.includes("emission") ||
    category.includes("biodiversity") ||
    category.includes("animal")
  ) {
    ideas.push(
      "Set monthly consumption targets per occupied room and share results with the team.",
      "Label bins and train housekeeping on separation; audit waste monthly.",
    );
  } else {
    ideas.push(
      "Name a single owner for this topic and add it to your sustainability action register.",
      "Photograph the practice in use (signage, equipment, training) for quick evidence.",
    );
  }

  return [
    `Ideas for ${criterion.ref}`,
    "",
    ...ideas.map((line) => `• ${line}`),
    "",
    "Benchmark",
    "Properties that score well keep proof close to daily operations — short notes plus one strong file per criterion beat long narratives alone.",
  ].join("\n");
}

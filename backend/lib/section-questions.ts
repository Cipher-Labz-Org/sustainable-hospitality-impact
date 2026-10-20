import type { QuestionRow } from "@/backend/lib/assessment-types";
import { buildCriterionBestPractices, buildCriterionGuidance } from "@/backend/lib/criterion-coaching";
import { prisma } from "@/backend/lib/prisma";

export async function loadSectionQuestions(organizationId: string, sectionId: string): Promise<QuestionRow[]> {
  const criteria = await prisma.criterion.findMany({
    where: { section: sectionId },
    orderBy: { sortOrder: "asc" },
    include: {
      responses: {
        where: { organizationId },
        include: { evidence: { orderBy: { createdAt: "asc" } } },
      },
    },
  });

  return criteria.map((criterion) => {
    const response = criterion.responses[0];
    const status =
      response?.status === "YES" || response?.status === "NO" || response?.status === "NA" ? response.status : null;
    const coaching = {
      ref: criterion.ref,
      section: criterion.section,
      categoryCode: criterion.categoryCode,
      categoryName: criterion.categoryName,
      question: criterion.question,
    };
    return {
      ref: criterion.ref,
      categoryCode: criterion.categoryCode,
      categoryName: criterion.categoryName,
      question: criterion.question,
      status,
      notes: response?.notes ?? "",
      remarks: response?.remarks ?? "",
      actionPlan: response?.actionPlan ?? "",
      guidance: buildCriterionGuidance(coaching),
      bestPractices: buildCriterionBestPractices(coaching),
      evidence: (response?.evidence ?? []).map((file) => ({
        id: file.id,
        originalName: file.originalName,
        mimeType: file.mimeType,
        size: file.size,
        createdAt: file.createdAt.toISOString(),
      })),
    };
  });
}

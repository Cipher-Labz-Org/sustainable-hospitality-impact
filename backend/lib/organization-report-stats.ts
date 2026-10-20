import { prisma } from "@/backend/lib/prisma";
import { SECTIONS } from "@/backend/lib/sections";

export async function loadOrganizationReportStats(organizationId: string) {
  const criteria = await prisma.criterion.findMany({
    select: { id: true, section: true },
    orderBy: { sortOrder: "asc" },
  });
  const responses = await prisma.response.findMany({
    where: { organizationId, status: { not: null } },
    select: { criterionId: true, status: true, criterion: { select: { section: true } } },
  });

  const totals = Object.fromEntries(SECTIONS.map((section) => [section.id, 0])) as Record<string, number>;
  const answered = Object.fromEntries(SECTIONS.map((section) => [section.id, 0])) as Record<string, number>;
  for (const item of criteria) totals[item.section] = (totals[item.section] ?? 0) + 1;
  for (const response of responses) {
    answered[response.criterion.section] = (answered[response.criterion.section] ?? 0) + 1;
  }

  const totalQuestions = criteria.length;
  const answeredTotal = responses.length;
  const yesCount = responses.filter((item) => item.status === "YES").length;
  const noCount = responses.filter((item) => item.status === "NO").length;
  const naCount = responses.filter((item) => item.status === "NA").length;
  const percent = totalQuestions ? Math.round((answeredTotal / totalQuestions) * 100) : 0;

  const sectionRows = SECTIONS.map((section) => {
    const total = totals[section.id] ?? 0;
    const done = answered[section.id] ?? 0;
    return {
      id: section.id,
      title: section.title,
      done,
      total,
      percent: total ? Math.round((done / total) * 100) : 0,
    };
  });

  return {
    totalQuestions,
    answeredTotal,
    yesCount,
    noCount,
    naCount,
    percent,
    sectionRows,
  };
}

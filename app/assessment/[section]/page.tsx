import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AssessmentWorkspace } from "@/frontend/components/assessment-workspace";
import { getSection } from "@/backend/lib/sections";
import { isReportPublished } from "@/backend/lib/report-publish";
import { loadSectionQuestions } from "@/backend/lib/section-questions";
import { requireOrganization } from "@/backend/lib/session";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ section: string }>;
}): Promise<Metadata> {
  const { section } = await params;
  const found = getSection(section.toUpperCase());
  return { title: found ? `Section ${found.id}` : "Assessment and Reporting" };
}

export default async function SectionPage({
  params,
  searchParams,
}: {
  params: Promise<{ section: string }>;
  searchParams: Promise<{ ref?: string }>;
}) {
  const { section: rawSection } = await params;
  const query = await searchParams;
  const section = getSection(rawSection.toUpperCase());
  if (!section) notFound();

  const { organization } = await requireOrganization();
  const questions = await loadSectionQuestions(organization.id, section.id);

  return (
    <AssessmentWorkspace
      sectionId={section.id}
      official={section.official}
      questions={questions}
      initialRef={query.ref}
      readOnly={isReportPublished(organization)}
    />
  );
}

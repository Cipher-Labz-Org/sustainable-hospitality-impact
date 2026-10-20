import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AssessmentPageHeader } from "@/frontend/components/assessment-panel";
import { AssessmentWorkspace } from "@/frontend/components/assessment-workspace";
import { clientDisplayName, requireAdminClient } from "@/backend/lib/admin-client";
import { getSection } from "@/backend/lib/sections";
import { loadSectionQuestions } from "@/backend/lib/section-questions";
import { adminClientHref } from "@/frontend/lib/admin-client-nav";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ userId: string; section: string }>;
}): Promise<Metadata> {
  const { section } = await params;
  const found = getSection(section.toUpperCase());
  return { title: found ? `Client section ${found.id}` : "Client assessment" };
}

export default async function AdminClientSectionPage({
  params,
  searchParams,
}: {
  params: Promise<{ userId: string; section: string }>;
  searchParams: Promise<{ ref?: string }>;
}) {
  const { userId, section: rawSection } = await params;
  const query = await searchParams;
  const section = getSection(rawSection.toUpperCase());
  if (!section) notFound();

  const client = await requireAdminClient(userId);
  const organization = client.organization;
  if (!organization) {
    return (
      <AssessmentPageHeader
        title={clientDisplayName(undefined, client.email)}
        description="This account does not have an organization record yet."
      />
    );
  }

  const questions = await loadSectionQuestions(organization.id, section.id);

  return (
    <AssessmentWorkspace
      sectionId={section.id}
      official={section.official}
      questions={questions}
      initialRef={query.ref}
      readOnly
      viewer="admin"
      documentsHref={adminClientHref(userId, "/library")}
    />
  );
}

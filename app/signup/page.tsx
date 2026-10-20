import type { Metadata } from "next";
import { PageIntro, PageShell } from "@/frontend/components/page-shell";
import { SignupWizard } from "@/frontend/components/signup-wizard";
import { Panel } from "@/frontend/components/ui";
import { getSession } from "@/backend/lib/get-session";
import { prisma } from "@/backend/lib/prisma";
import { isPublicSignupEnabled } from "@/backend/lib/public-signup";
import { parseBusinessTypes } from "@/backend/lib/session";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Create account" };

const emptyOrganization = {
  name: "",
  country: "",
  language: "English",
  city: "",
  street: "",
  number: "",
  postcode: "",
  businessTypes: [] as string[],
};

const emptyContact = { firstName: "", lastName: "", title: "", phone: "", email: "" };

export default async function SignupPage() {
  const session = await getSession();
  if (!session?.user?.id && !isPublicSignupEnabled()) {
    redirect("/login");
  }

  if (!session?.user?.id) {
    return (
      <PageShell width="lg">
        <PageIntro eyebrow="Get started" title="Create your account" description="Set up your organization and begin the GSTC assessment." />
        <Panel>
          <SignupWizard initialStep="account" organization={emptyOrganization} contact={emptyContact} hasLogo={false} />
        </Panel>
      </PageShell>
    );
  }

  const organization = await prisma.organization.findUnique({
    where: { userId: session.user.id },
    include: { contact: true, brand: true },
  });
  const contact = organization?.contact;
  const hasName = !!organization?.name.trim();
  const hasContact = !!contact?.firstName.trim() && !!contact.lastName.trim();
  const step = !hasName ? "organization" : !hasContact ? "contact" : "brand";

  return (
    <PageShell width="lg">
      <PageIntro eyebrow="Get started" title="Complete your profile" description="Finish organization details to unlock the full assessment workspace." />
      <Panel>
        <SignupWizard
          initialStep={step}
          email={session.user.email ?? undefined}
          organization={{
            name: organization?.name ?? "",
            country: organization?.country ?? "",
            language: organization?.language || "English",
            city: organization?.city ?? "",
            street: organization?.street ?? "",
            number: organization?.number ?? "",
            postcode: organization?.postcode ?? "",
            businessTypes: parseBusinessTypes(organization?.businessTypes ?? "[]"),
          }}
          contact={{
            firstName: contact?.firstName ?? "",
            lastName: contact?.lastName ?? "",
            title: contact?.title ?? "",
            phone: contact?.phone ?? "",
            email: contact?.email ?? "",
          }}
          hasLogo={!!organization?.brand}
          logoVersion={organization?.brand?.updatedAt.toISOString()}
        />
      </Panel>
    </PageShell>
  );
}

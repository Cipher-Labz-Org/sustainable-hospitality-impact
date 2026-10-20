import { getSession } from "@/backend/lib/get-session";
import { prisma } from "@/backend/lib/prisma";
import { isPublicSignupEnabled } from "@/backend/lib/public-signup";
import { personDisplayName } from "@/backend/lib/session";

export async function getSiteHeaderData() {
  const session = await getSession();
  let profileLabel = session?.user?.email ?? "";
  let isAdmin = session?.user?.isAdmin ?? false;

  let hasLogo = false;
  let logoVersion: string | undefined;
  let organizationName = "";

  if (session?.user?.id) {
    const [organization, adminRow] = await Promise.all([
      prisma.organization.findUnique({
        where: { userId: session.user.id },
        select: {
          name: true,
          brand: { select: { updatedAt: true } },
          contact: { select: { firstName: true, lastName: true } },
        },
      }),
      prisma.user.findUnique({
        where: { id: session.user.id },
        select: { isAdmin: true },
      }),
    ]);
    profileLabel = personDisplayName(session.user.email ?? "", organization?.contact);
    isAdmin = adminRow?.isAdmin ?? false;
    hasLogo = Boolean(organization?.brand);
    logoVersion = organization?.brand?.updatedAt.toISOString();
    organizationName = organization?.name.trim() ?? "";
  }

  return {
    signedIn: Boolean(session),
    isAdmin,
    profileLabel,
    showSignup: isPublicSignupEnabled(),
    hasLogo,
    logoVersion,
    organizationName,
  };
}

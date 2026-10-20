import { redirect } from "next/navigation";
import { signOut } from "@/backend/auth";
import { getSession } from "@/backend/lib/get-session";
import { prisma } from "@/backend/lib/prisma";

/** Session cookie can outlive the DB user (reset DB, deleted account). Never create rows for a missing user. */
async function requireSessionUser() {
  const session = await getSession();
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, isAdmin: true },
  });

  if (!user) {
    await signOut({ redirectTo: "/login" });
    redirect("/login");
  }

  return { session, user };
}

export async function requireAdmin() {
  const { session, user } = await requireSessionUser();
  if (!user.isAdmin) redirect("/assessment");
  return { session, user };
}

export async function getAdminUser() {
  const session = await getSession();
  if (!session?.user?.id) return null;
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, isAdmin: true },
  });
  if (!user?.isAdmin) return null;
  return user;
}

export async function requireOrganization() {
  const { session, user } = await requireSessionUser();
  const userId = user.id;

  let organization = await prisma.organization.findUnique({
    where: { userId },
    include: { contact: true, brand: true },
  });

  if (!organization) {
    try {
      organization = await prisma.organization.create({
        data: {
          userId,
          language: "English",
          contact: { create: {} },
        },
        include: { contact: true, brand: true },
      });
    } catch {
      // Session user id out of sync with the database (stale cookie after reset).
      await signOut({ redirectTo: "/login" });
      redirect("/login");
    }
  } else if (!organization.contact) {
    await prisma.contact.create({ data: { organizationId: organization.id } });
    organization = await prisma.organization.findUnique({
      where: { userId },
      include: { contact: true, brand: true },
    });
  }

  if (!organization?.contact) redirect("/signup");
  return { session, organization };
}

export function personDisplayName(
  email: string,
  contact?: { firstName: string; lastName: string } | null,
) {
  const first = contact?.firstName.trim() ?? "";
  const last = contact?.lastName.trim() ?? "";
  if (first && last) return `${first} ${last}`;
  if (first) return first;
  if (last) return last;
  return email;
}

export function parseBusinessTypes(value: string) {
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

export type ProfileGap = {
  key: "name" | "country" | "contact";
  label: string;
  href: string;
};

export function profileGaps(organization: {
  name: string;
  country: string;
  contact: { firstName: string; lastName: string } | null;
}): ProfileGap[] {
  const gaps: ProfileGap[] = [];
  if (!organization.name.trim()) {
    gaps.push({ key: "name", label: "organization name", href: "/space?tab=organization" });
  }
  if (!organization.country.trim()) {
    gaps.push({ key: "country", label: "country", href: "/space?tab=organization" });
  }
  if (!organization.contact?.firstName.trim() || !organization.contact.lastName.trim()) {
    gaps.push({ key: "contact", label: "contact person", href: "/space?tab=contact" });
  }
  return gaps;
}

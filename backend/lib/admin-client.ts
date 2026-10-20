import { notFound } from "next/navigation";
import { prisma } from "@/backend/lib/prisma";
import { requireAdmin } from "@/backend/lib/session";

export async function requireAdminClient(userId: string) {
  await requireAdmin();

  const client = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      createdAt: true,
      isAdmin: true,
      organization: {
        include: { contact: true, brand: true },
      },
    },
  });

  if (!client || client.isAdmin) notFound();
  return client;
}

export function clientDisplayName(organizationName: string | null | undefined, email: string) {
  const name = organizationName?.trim() ?? "";
  return name || email;
}

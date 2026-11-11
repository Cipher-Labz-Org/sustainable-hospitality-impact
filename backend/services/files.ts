import { prisma } from "@/backend/lib/prisma";
import { readStoredFile } from "@/backend/lib/storage";

export async function loadEvidenceFileRecord(id: string) {
  return prisma.evidenceFile.findUnique({
    where: { id },
    include: { response: { select: { organizationId: true } } },
  });
}

export async function loadOrganizationBrand(userId: string) {
  return prisma.organization.findUnique({
    where: { userId },
    include: { brand: true, user: { select: { isAdmin: true } } },
  });
}

export async function readEvidenceBytes(organizationId: string, storedName: string) {
  return readStoredFile("evidence", organizationId, storedName);
}

export async function readBrandBytes(organizationId: string, storedName: string) {
  return readStoredFile("brand", organizationId, storedName);
}

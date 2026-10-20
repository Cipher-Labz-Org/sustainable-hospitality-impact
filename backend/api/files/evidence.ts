import { NextRequest } from "next/server";
import { auth } from "@/backend/auth";
import { verifyEvidenceDownloadToken } from "@/backend/lib/evidence-download-token";
import { prisma } from "@/backend/lib/prisma";
import { getAdminUser } from "@/backend/lib/session";
import { contentDisposition, readStoredFile } from "@/backend/lib/storage";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const reportToken = request.nextUrl.searchParams.get("reportToken");

  const file = await prisma.evidenceFile.findUnique({
    where: { id },
    include: { response: { select: { organizationId: true } } },
  });
  if (!file) return new Response("File not found.", { status: 404 });

  let organizationId: string | null = null;

  if (reportToken) {
    if (!verifyEvidenceDownloadToken(reportToken, file.id, file.response.organizationId)) {
      return new Response("Download link expired or invalid.", { status: 403 });
    }
    organizationId = file.response.organizationId;
  } else {
    const session = await auth();
    if (!session?.user?.id) return new Response("Sign in required.", { status: 401 });

    const admin = await getAdminUser();
    if (admin) {
      organizationId = file.response.organizationId;
    } else {
      const organization = await prisma.organization.findUnique({
        where: { userId: session.user.id },
        select: { id: true },
      });
      if (!organization) return new Response("Sign in required.", { status: 401 });
      if (file.response.organizationId !== organization.id) {
        return new Response("File not found.", { status: 404 });
      }
      organizationId = organization.id;
    }
  }

  try {
    const bytes = await readStoredFile("evidence", organizationId, file.storedName);
    const download = request.nextUrl.searchParams.get("download") === "1";
    const inline = !download && file.mimeType.startsWith("image/");
    return new Response(new Uint8Array(bytes), {
      headers: {
        "Content-Type": file.mimeType,
        "Content-Length": String(bytes.length),
        "Content-Disposition": contentDisposition(file.originalName, inline),
        "Cache-Control": "private, no-store",
      },
    });
  } catch {
    return new Response("File not found.", { status: 404 });
  }
}

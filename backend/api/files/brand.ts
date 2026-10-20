import { auth } from "@/backend/auth";
import { prisma } from "@/backend/lib/prisma";
import { getAdminUser } from "@/backend/lib/session";
import { contentDisposition, readStoredFile } from "@/backend/lib/storage";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return new Response("Sign in required.", { status: 401 });

  const userId = new URL(request.url).searchParams.get("userId")?.trim() ?? "";
  const admin = userId && userId !== session.user.id ? await getAdminUser() : null;

  const organization = await prisma.organization.findUnique({
    where: { userId: admin ? userId : session.user.id },
    include: { brand: true, user: { select: { isAdmin: true } } },
  });

  if (admin && organization?.user.isAdmin) return new Response("Logo not found.", { status: 404 });
  if (!organization?.brand) return new Response("Logo not found.", { status: 404 });

  try {
    const bytes = await readStoredFile("brand", organization.id, organization.brand.storedName);
    return new Response(new Uint8Array(bytes), {
      headers: {
        "Content-Type": organization.brand.mimeType,
        "Content-Length": String(bytes.length),
        "Content-Disposition": contentDisposition(organization.brand.originalName, true),
        "Cache-Control": "private, no-store",
      },
    });
  } catch {
    return new Response("Logo not found.", { status: 404 });
  }
}

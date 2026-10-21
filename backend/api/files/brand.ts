import { auth } from "@/backend/auth";
import { getAdminUser } from "@/backend/lib/session";
import { contentDisposition } from "@/backend/lib/storage";
import { loadOrganizationBrand, readBrandBytes } from "@/backend/services/files";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return new Response("Sign in required.", { status: 401 });

  const userId = new URL(request.url).searchParams.get("userId")?.trim() ?? "";
  const admin = userId && userId !== session.user.id ? await getAdminUser() : null;

  const organization = await loadOrganizationBrand(admin ? userId : session.user.id);

  if (admin && organization?.user.isAdmin) return new Response("Logo not found.", { status: 404 });
  if (!organization?.brand) return new Response("Logo not found.", { status: 404 });

  try {
    const bytes = await readBrandBytes(organization.id, organization.brand.storedName);
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

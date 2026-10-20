import { redirect } from "next/navigation";
import { requireAdmin } from "@/backend/lib/session";

export default async function AdminIndexPage() {
  await requireAdmin();
  redirect("/admin/users");
}

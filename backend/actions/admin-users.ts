"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/backend/lib/session";
import type { ActionResult } from "@/backend/lib/validators";
import {
  createManagedUserForAdmin,
  deleteManagedUserForAdmin,
  updateManagedUserForAdmin,
} from "@/backend/services/admin-users";

function revalidateUsers() {
  revalidatePath("/admin/users");
  revalidatePath("/admin/clients");
}

export async function createManagedUser(formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  const result = await createManagedUserForAdmin({
    organizationName: formData.get("organizationName"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!result.ok) return result;
  revalidateUsers();
  return { ok: true };
}

export async function updateManagedUser(formData: FormData): Promise<ActionResult> {
  const { user: admin } = await requireAdmin();
  const result = await updateManagedUserForAdmin(admin.id, {
    userId: formData.get("userId"),
    password: formData.get("password") ?? "",
    confirmPassword: formData.get("confirmPassword") ?? "",
  });
  if (!result.ok) return result;
  revalidateUsers();
  return { ok: true };
}

export async function deleteManagedUser(formData: FormData): Promise<ActionResult> {
  const { user: admin } = await requireAdmin();
  const userId = String(formData.get("userId") ?? "").trim();
  const result = await deleteManagedUserForAdmin(admin.id, userId);
  if (!result.ok) return result;
  revalidateUsers();
  revalidatePath(`/admin/clients/${userId}`);
  return { ok: true };
}

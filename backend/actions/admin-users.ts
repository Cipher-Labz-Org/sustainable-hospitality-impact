"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { prisma } from "@/backend/lib/prisma";
import { requireAdmin } from "@/backend/lib/session";
import {
  adminCreateUserSchema,
  adminUpdateUserSchema,
  fieldErrors,
  type ActionResult,
} from "@/backend/lib/validators";

function revalidateUsers() {
  revalidatePath("/admin/users");
  revalidatePath("/admin/clients");
}

export async function createManagedUser(formData: FormData): Promise<ActionResult> {
  const { user: admin } = await requireAdmin();
  const parsed = adminCreateUserSchema.safeParse({
    organizationName: formData.get("organizationName"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    return { ok: false, error: "Check the form and try again.", fieldErrors: fieldErrors(parsed.error) };
  }

  const email = parsed.data.email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return {
      ok: false,
      error: "That email is already in use.",
      fieldErrors: { email: "This email is already registered." },
    };
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  await prisma.user.create({
    data: {
      email,
      passwordHash,
      canChangePassword: false,
      isAdmin: false,
      organization: {
        create: {
          name: parsed.data.organizationName,
          language: "English",
          contact: { create: {} },
        },
      },
    },
  });

  revalidateUsers();
  return { ok: true };
}

export async function updateManagedUser(formData: FormData): Promise<ActionResult> {
  const { user: admin } = await requireAdmin();
  const parsed = adminUpdateUserSchema.safeParse({
    userId: formData.get("userId"),
    password: formData.get("password") ?? "",
    confirmPassword: formData.get("confirmPassword") ?? "",
  });
  if (!parsed.success) {
    return { ok: false, error: "Check the form and try again.", fieldErrors: fieldErrors(parsed.error) };
  }

  const target = await prisma.user.findUnique({ where: { id: parsed.data.userId } });
  if (!target) {
    return { ok: false, error: "That user no longer exists." };
  }
  if (target.isAdmin) {
    return { ok: false, error: "Admin accounts cannot be edited here." };
  }
  if (target.id === admin.id) {
    return { ok: false, error: "Use My Space to update your own account." };
  }

  const password = parsed.data.password?.trim() ?? "";
  if (!password) {
    return { ok: false, error: "Enter a new password, or cancel without saving." };
  }

  await prisma.user.update({
    where: { id: target.id },
    data: {
      passwordHash: await bcrypt.hash(password, 12),
      canChangePassword: false,
    },
  });

  revalidateUsers();
  return { ok: true };
}

export async function deleteManagedUser(formData: FormData): Promise<ActionResult> {
  const { user: admin } = await requireAdmin();
  const userId = String(formData.get("userId") ?? "").trim();
  if (!userId) {
    return { ok: false, error: "Choose a user to remove." };
  }

  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target) {
    return { ok: false, error: "That user no longer exists." };
  }
  if (target.isAdmin) {
    return { ok: false, error: "Admin accounts cannot be deleted here." };
  }
  if (target.id === admin.id) {
    return { ok: false, error: "You cannot delete your own account." };
  }

  await prisma.user.delete({ where: { id: target.id } });
  revalidateUsers();
  revalidatePath(`/admin/clients/${target.id}`);
  return { ok: true };
}

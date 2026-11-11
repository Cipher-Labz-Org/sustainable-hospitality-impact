import bcrypt from "bcryptjs";
import { prisma } from "@/backend/lib/prisma";
import { adminCreateUserSchema, adminUpdateUserSchema, fieldErrors, type ActionResult } from "@/backend/lib/validators";

export async function createManagedUserForAdmin(input: {
  organizationName: unknown;
  email: unknown;
  password: unknown;
  confirmPassword: unknown;
}): Promise<ActionResult> {
  const parsed = adminCreateUserSchema.safeParse(input);
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

  return { ok: true };
}

export async function updateManagedUserForAdmin(
  adminUserId: string,
  input: {
    userId: unknown;
    password: unknown;
    confirmPassword: unknown;
  },
): Promise<ActionResult> {
  const parsed = adminUpdateUserSchema.safeParse(input);
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
  if (target.id === adminUserId) {
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

  return { ok: true };
}

export async function deleteManagedUserForAdmin(adminUserId: string, userId: string): Promise<ActionResult> {
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
  if (target.id === adminUserId) {
    return { ok: false, error: "You cannot delete your own account." };
  }

  await prisma.user.delete({ where: { id: target.id } });
  return { ok: true };
}

"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { prisma } from "@/backend/lib/prisma";
import { requireOrganization } from "@/backend/lib/session";
import { removeStoredFile, storeUpload } from "@/backend/lib/storage";
import {
  adminSignInUpdateSchema,
  contactSchema,
  fieldErrors,
  organizationSchema,
  passwordChangeSchema,
  type ActionResult,
} from "@/backend/lib/validators";

function revalidateProfile() {
  revalidatePath("/", "layout");
  revalidatePath("/space");
  revalidatePath("/signup");
  revalidatePath("/assessment");
  revalidatePath("/");
}

export async function saveOrganization(formData: FormData): Promise<ActionResult> {
  const { organization } = await requireOrganization();
  const businessTypes = formData.getAll("businessTypes").map(String);
  const parsed = organizationSchema.safeParse({
    name: formData.get("name"),
    country: formData.get("country"),
    language: formData.get("language"),
    city: formData.get("city"),
    street: formData.get("street"),
    number: formData.get("number"),
    postcode: formData.get("postcode"),
    businessTypes,
  });
  if (!parsed.success) {
    return { ok: false, error: "Check the organization details.", fieldErrors: fieldErrors(parsed.error) };
  }

  await prisma.organization.update({
    where: { id: organization.id },
    data: {
      ...parsed.data,
      businessTypes: JSON.stringify(parsed.data.businessTypes),
    },
  });
  revalidateProfile();
  return { ok: true };
}

export async function saveContact(formData: FormData): Promise<ActionResult> {
  const { organization } = await requireOrganization();
  const parsed = contactSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    title: formData.get("title") ?? "",
    phone: formData.get("phone"),
    email: formData.get("email"),
  });
  if (!parsed.success) {
    return { ok: false, error: "Check the contact details.", fieldErrors: fieldErrors(parsed.error) };
  }

  await prisma.contact.update({
    where: { organizationId: organization.id },
    data: parsed.data,
  });
  revalidateProfile();
  return { ok: true };
}

export async function updateAdminSignIn(formData: FormData): Promise<ActionResult> {
  const { session } = await requireOrganization();
  const parsed = adminSignInUpdateSchema.safeParse({
    signInEmail: formData.get("signInEmail"),
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword") ?? "",
    confirmPassword: formData.get("confirmPassword") ?? "",
  });
  if (!parsed.success) {
    return { ok: false, error: "Check the sign-in details.", fieldErrors: fieldErrors(parsed.error) };
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) return { ok: false, error: "Your session has expired. Sign in again." };
  if (!user.isAdmin) {
    return { ok: false, error: "Only an administrator can change sign-in details here." };
  }

  const matches = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash);
  if (!matches) {
    return {
      ok: false,
      error: "The current password is not correct.",
      fieldErrors: { currentPassword: "That password is not correct." },
    };
  }

  const email = parsed.data.signInEmail.toLowerCase();
  const newPassword = parsed.data.newPassword?.trim() ?? "";
  const emailChanged = email !== user.email;

  if (emailChanged) {
    const clash = await prisma.user.findUnique({ where: { email } });
    if (clash) {
      return {
        ok: false,
        error: "That sign-in email is already in use.",
        fieldErrors: { signInEmail: "This email is already registered." },
      };
    }
  }

  const data: { email?: string; passwordHash?: string } = {};
  if (emailChanged) data.email = email;
  if (newPassword) data.passwordHash = await bcrypt.hash(newPassword, 12);

  if (!data.email && !data.passwordHash) {
    return { ok: false, error: "Change the sign-in email or enter a new password to save." };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { ...data, canChangePassword: true },
  });
  revalidateProfile();
  return { ok: true };
}

export async function changePassword(formData: FormData): Promise<ActionResult> {
  const { session } = await requireOrganization();
  const parsed = passwordChangeSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    return { ok: false, error: "Check the password fields.", fieldErrors: fieldErrors(parsed.error) };
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) return { ok: false, error: "Your session has expired. Sign in again." };
  if (!user.isAdmin) {
    return { ok: false, error: "Only an administrator can change sign-in passwords. Contact your administrator." };
  }

  const matches = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash);
  if (!matches) {
    return { ok: false, error: "The current password is not correct.", fieldErrors: { currentPassword: "That password is not correct." } };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await bcrypt.hash(parsed.data.newPassword, 12) },
  });
  return { ok: true };
}

export async function saveLogo(formData: FormData): Promise<ActionResult> {
  const { organization } = await requireOrganization();
  const file = formData.get("logo");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Choose a logo image to upload." };
  }

  const stored = await storeUpload("brand", organization.id, file);
  if (!stored.ok) return { ok: false, error: stored.error };

  if (organization.brand) {
    await removeStoredFile("brand", organization.id, organization.brand.storedName);
  }

  await prisma.brandAsset.upsert({
    where: { organizationId: organization.id },
    create: {
      organizationId: organization.id,
      originalName: stored.originalName,
      storedName: stored.storedName,
      mimeType: stored.mimeType,
      size: stored.size,
    },
    update: {
      originalName: stored.originalName,
      storedName: stored.storedName,
      mimeType: stored.mimeType,
      size: stored.size,
    },
  });
  revalidateProfile();
  return { ok: true };
}

export async function removeLogo(): Promise<ActionResult> {
  const { organization } = await requireOrganization();
  if (!organization.brand) return { ok: true };
  await removeStoredFile("brand", organization.id, organization.brand.storedName);
  await prisma.brandAsset.delete({ where: { organizationId: organization.id } });
  revalidateProfile();
  return { ok: true };
}

import bcrypt from "bcryptjs";
import { prisma } from "@/backend/lib/prisma";
import { removeStoredFile, storeUpload } from "@/backend/lib/storage";
import {
  adminSignInUpdateSchema,
  contactSchema,
  fieldErrors,
  organizationSchema,
  passwordChangeSchema,
  type ActionResult,
} from "@/backend/lib/validators";

export async function saveOrganizationProfile(
  organizationId: string,
  input: {
    name: unknown;
    country: unknown;
    language: unknown;
    city: unknown;
    street: unknown;
    number: unknown;
    postcode: unknown;
    businessTypes: unknown;
  },
): Promise<ActionResult> {
  const parsed = organizationSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Check the organization details.", fieldErrors: fieldErrors(parsed.error) };
  }

  await prisma.organization.update({
    where: { id: organizationId },
    data: {
      ...parsed.data,
      businessTypes: JSON.stringify(parsed.data.businessTypes),
    },
  });
  return { ok: true };
}

export async function saveContactProfile(
  organizationId: string,
  input: {
    firstName: unknown;
    lastName: unknown;
    title: unknown;
    phone: unknown;
    email: unknown;
  },
): Promise<ActionResult> {
  const parsed = contactSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Check the contact details.", fieldErrors: fieldErrors(parsed.error) };
  }

  await prisma.contact.update({
    where: { organizationId },
    data: parsed.data,
  });
  return { ok: true };
}

export async function updateAdminSignInDetails(
  userId: string,
  input: {
    signInEmail: unknown;
    currentPassword: unknown;
    newPassword: unknown;
    confirmPassword: unknown;
  },
): Promise<ActionResult> {
  const parsed = adminSignInUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Check the sign-in details.", fieldErrors: fieldErrors(parsed.error) };
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
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
  return { ok: true };
}

export async function changeAdminPassword(
  userId: string,
  input: {
    currentPassword: unknown;
    newPassword: unknown;
    confirmPassword: unknown;
  },
): Promise<ActionResult> {
  const parsed = passwordChangeSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Check the password fields.", fieldErrors: fieldErrors(parsed.error) };
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return { ok: false, error: "Your session has expired. Sign in again." };
  if (!user.isAdmin) {
    return { ok: false, error: "Only an administrator can change sign-in passwords. Contact your administrator." };
  }

  const matches = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash);
  if (!matches) {
    return {
      ok: false,
      error: "The current password is not correct.",
      fieldErrors: { currentPassword: "That password is not correct." },
    };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await bcrypt.hash(parsed.data.newPassword, 12) },
  });
  return { ok: true };
}

export async function saveOrganizationLogo(
  organization: { id: string; brand: { storedName: string } | null },
  file: File,
): Promise<ActionResult> {
  if (file.size === 0) {
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
  return { ok: true };
}

export async function removeOrganizationLogo(organization: {
  id: string;
  brand: { storedName: string } | null;
}): Promise<ActionResult> {
  if (!organization.brand) return { ok: true };
  await removeStoredFile("brand", organization.id, organization.brand.storedName);
  await prisma.brandAsset.delete({ where: { organizationId: organization.id } });
  return { ok: true };
}

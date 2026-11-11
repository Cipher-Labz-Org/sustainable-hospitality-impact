"use server";

import { revalidatePath } from "next/cache";
import { requireOrganization } from "@/backend/lib/session";
import type { ActionResult } from "@/backend/lib/validators";
import {
  changeAdminPassword,
  removeOrganizationLogo,
  saveContactProfile,
  saveOrganizationLogo,
  saveOrganizationProfile,
  updateAdminSignInDetails,
} from "@/backend/services/profile";

function revalidateProfile() {
  revalidatePath("/", "layout");
  revalidatePath("/space");
  revalidatePath("/signup");
  revalidatePath("/assessment");
  revalidatePath("/");
}

export async function saveOrganization(formData: FormData): Promise<ActionResult> {
  const { organization } = await requireOrganization();
  const result = await saveOrganizationProfile(organization.id, {
    name: formData.get("name"),
    country: formData.get("country"),
    language: formData.get("language"),
    city: formData.get("city"),
    street: formData.get("street"),
    number: formData.get("number"),
    postcode: formData.get("postcode"),
    businessTypes: formData.getAll("businessTypes").map(String),
  });
  if (!result.ok) return result;
  revalidateProfile();
  return { ok: true };
}

export async function saveContact(formData: FormData): Promise<ActionResult> {
  const { organization } = await requireOrganization();
  const result = await saveContactProfile(organization.id, {
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    title: formData.get("title") ?? "",
    phone: formData.get("phone"),
    email: formData.get("email"),
  });
  if (!result.ok) return result;
  revalidateProfile();
  return { ok: true };
}

export async function updateAdminSignIn(formData: FormData): Promise<ActionResult> {
  const { session } = await requireOrganization();
  const result = await updateAdminSignInDetails(session.user.id, {
    signInEmail: formData.get("signInEmail"),
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword") ?? "",
    confirmPassword: formData.get("confirmPassword") ?? "",
  });
  if (!result.ok) return result;
  revalidateProfile();
  return { ok: true };
}

export async function changePassword(formData: FormData): Promise<ActionResult> {
  const { session } = await requireOrganization();
  return changeAdminPassword(session.user.id, {
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });
}

export async function saveLogo(formData: FormData): Promise<ActionResult> {
  const { organization } = await requireOrganization();
  const file = formData.get("logo");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Choose a logo image to upload." };
  }
  const result = await saveOrganizationLogo(organization, file);
  if (!result.ok) return result;
  revalidateProfile();
  return { ok: true };
}

export async function removeLogo(): Promise<ActionResult> {
  const { organization } = await requireOrganization();
  const result = await removeOrganizationLogo(organization);
  if (!result.ok) return result;
  revalidateProfile();
  return { ok: true };
}

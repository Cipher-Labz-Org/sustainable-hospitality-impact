"use server";

import bcrypt from "bcryptjs";
import { signOut } from "@/backend/auth";
import { signInWithCredentials } from "@/backend/lib/auth-signin";
import { prisma } from "@/backend/lib/prisma";
import { isPublicSignupEnabled } from "@/backend/lib/public-signup";
import { safeNextPath } from "@/backend/lib/paths";
import { fieldErrors, loginSchema, signupSchema, type ActionResult } from "@/backend/lib/validators";

export async function loginAction(formData: FormData): Promise<ActionResult<{ redirectTo: string }>> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    callbackUrl: formData.get("callbackUrl") || undefined,
  });
  if (!parsed.success) {
    return { ok: false, error: "Check the form and try again.", fieldErrors: fieldErrors(parsed.error) };
  }

  const signedIn = await signInWithCredentials(parsed.data.email.toLowerCase(), parsed.data.password);
  if (!signedIn.ok) {
    if (signedIn.reason === "not_found") {
      return {
        ok: false,
        error:
          "No account exists for this email. Your administrator must add you under Client sign-in before you can log in.",
      };
    }
    if (signedIn.reason === "bad_password") {
      return { ok: false, error: "Incorrect password for this email. Use the password your administrator set." };
    }
    return { ok: false, error: "Sign-in could not be completed. Try again or contact your administrator." };
  }

  return { ok: true, data: { redirectTo: safeNextPath(parsed.data.callbackUrl) } };
}

export async function signupAction(formData: FormData): Promise<ActionResult<{ redirectTo: string }>> {
  if (!isPublicSignupEnabled()) {
    return { ok: false, error: "Accounts are created by your administrator. Use the email and password they sent you to sign in." };
  }

  const parsed = signupSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    const errors = fieldErrors(parsed.error);
    return { ok: false, error: "Check the form and try again.", fieldErrors: errors };
  }

  const email = parsed.data.email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { ok: false, error: "An account with that email already exists. Sign in instead.", fieldErrors: { email: "This email is already registered." } };
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
          language: "English",
          contact: { create: {} },
        },
      },
    },
  });

  const signedIn = await signInWithCredentials(email, parsed.data.password);
  if (!signedIn.ok) {
    return {
      ok: false,
      error: "The account was created, but signing in failed. Try the sign-in page.",
    };
  }

  return { ok: true, data: { redirectTo: "/signup" } };
}

export async function signOutAction() {
  await signOut({ redirectTo: "/" });
}

"use server";

import { signOut } from "@/backend/auth";
import { signInWithCredentials } from "@/backend/lib/auth-signin";
import { safeNextPath } from "@/backend/lib/paths";
import { fieldErrors, loginSchema, type ActionResult } from "@/backend/lib/validators";
import { createSelfSignupAccount } from "@/backend/services/auth";

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
  const password = formData.get("password");
  const created = await createSelfSignupAccount({
    email: formData.get("email"),
    password,
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!created.ok) return created;
  if (!created.data) {
    return { ok: false, error: "The account was created, but signing in failed. Try the sign-in page." };
  }

  const signedIn = await signInWithCredentials(created.data.email, String(password ?? ""));
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

import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { signIn } from "@/backend/auth";
import { prisma } from "@/backend/lib/prisma";

/** Auth.js may return the sign-in page URL on success when `redirect: false`; only `?error=` means failure. */
export function credentialsSignInFailed(result: unknown) {
  if (result == null || result === undefined) return true;
  if (typeof result === "object" && result !== null && "error" in result) {
    return Boolean((result as { error?: string }).error);
  }
  if (typeof result !== "string" || !result.trim()) return true;

  try {
    const url = new URL(result, "http://localhost");
    return Boolean(url.searchParams.get("error"));
  } catch {
    return false;
  }
}

function isNextRedirect(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    typeof (error as { digest?: unknown }).digest === "string" &&
    (error as { digest: string }).digest.startsWith("NEXT_REDIRECT")
  );
}

/**
 * Auth.js throws `CredentialsSignin` from a Server Action when the password
 * does not match. That throw becomes the Next.js "1 Issue" overlay, so reject
 * unknown emails and wrong passwords before calling `signIn`.
 */
export type CredentialsSignInResult =
  | { ok: true }
  | { ok: false; reason: "not_found" | "bad_password" | "session" };

export async function signInWithCredentials(email: string, password: string): Promise<CredentialsSignInResult> {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return { ok: false, reason: "not_found" };
  const matches = await bcrypt.compare(password, user.passwordHash);
  if (!matches) return { ok: false, reason: "bad_password" };

  try {
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
      redirectTo: "/",
    });
    if (credentialsSignInFailed(result)) return { ok: false, reason: "session" };
    return { ok: true };
  } catch (error) {
    if (isNextRedirect(error)) throw error;
    if (error instanceof AuthError && error.type === "CredentialsSignin") {
      return { ok: false, reason: "bad_password" };
    }
    if (
      typeof error === "object" &&
      error !== null &&
      "type" in error &&
      (error as { type?: string }).type === "CredentialsSignin"
    ) {
      return { ok: false, reason: "bad_password" };
    }
    throw error;
  }
}

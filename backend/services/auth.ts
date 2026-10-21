import bcrypt from "bcryptjs";
import { prisma } from "@/backend/lib/prisma";
import { isPublicSignupEnabled } from "@/backend/lib/public-signup";
import { fieldErrors, signupSchema, type ActionResult } from "@/backend/lib/validators";

export async function createSelfSignupAccount(input: {
  email: unknown;
  password: unknown;
  confirmPassword: unknown;
}): Promise<ActionResult<{ email: string }>> {
  if (!isPublicSignupEnabled()) {
    return {
      ok: false,
      error: "Accounts are created by your administrator. Use the email and password they sent you to sign in.",
    };
  }

  const parsed = signupSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Check the form and try again.", fieldErrors: fieldErrors(parsed.error) };
  }

  const email = parsed.data.email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return {
      ok: false,
      error: "An account with that email already exists. Sign in instead.",
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
          language: "English",
          contact: { create: {} },
        },
      },
    },
  });

  return { ok: true, data: { email } };
}

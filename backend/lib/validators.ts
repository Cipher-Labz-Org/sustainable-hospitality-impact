import { z } from "zod";
import { BUSINESS_TYPE_IDS, TITLES } from "./options";

export type ActionResult<T = undefined> =
  | { ok: true; data?: T; warning?: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

const emailSchema = z
  .string()
  .trim()
  .max(200)
  .refine((value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value), {
    message: "Enter a valid email address.",
  });

export const signupSchema = z
  .object({
    email: emailSchema,
    password: z
      .string()
      .min(8, "Use at least 8 characters.")
      .max(128, "Use 128 characters or fewer."),
    confirmPassword: z.string(),
  })
  .refine((value) => value.password === value.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match.",
  });

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Enter your password."),
  callbackUrl: z.string().optional(),
});

export const organizationSchema = z.object({
  name: z.string().trim().min(1, "Enter the organization name.").max(160),
  country: z.string().trim().max(80),
  language: z.string().trim().min(1, "Choose a language.").max(40),
  city: z.string().trim().max(80),
  street: z.string().trim().max(160),
  number: z.string().trim().max(40),
  postcode: z.string().trim().max(20),
  businessTypes: z
    .array(z.enum(BUSINESS_TYPE_IDS as [string, ...string[]]))
    .max(BUSINESS_TYPE_IDS.length),
});

export const contactSchema = z.object({
  firstName: z.string().trim().min(1, "Enter a first name.").max(80),
  lastName: z.string().trim().min(1, "Enter a last name.").max(80),
  title: z.union([z.literal(""), z.enum(TITLES)]),
  phone: z.string().trim().max(40),
  email: z.union([z.literal(""), emailSchema]),
});

export const adminCreateUserSchema = z
  .object({
    organizationName: z.string().trim().min(1, "Enter the hotel or organization name.").max(160),
    email: emailSchema,
    password: z
      .string()
      .min(8, "Use at least 8 characters.")
      .max(128, "Use 128 characters or fewer."),
    confirmPassword: z.string(),
  })
  .refine((value) => value.password === value.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match.",
  });

export const adminUpdateUserSchema = z
  .object({
    userId: z.string().trim().min(1, "Choose a user."),
    password: z
      .string()
      .max(128, "Use 128 characters or fewer.")
      .optional()
      .or(z.literal("")),
    confirmPassword: z.string().optional().or(z.literal("")),
  })
  .superRefine((value, ctx) => {
    const wantsPassword = value.password && value.password.length > 0;
    if (!wantsPassword) return;
    if (value.password!.length < 8) {
      ctx.addIssue({
        code: "custom",
        path: ["password"],
        message: "Use at least 8 characters.",
      });
    }
    if (value.password !== value.confirmPassword) {
      ctx.addIssue({
        code: "custom",
        path: ["confirmPassword"],
        message: "Passwords do not match.",
      });
    }
  });

export const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password."),
    newPassword: z
      .string()
      .min(8, "Use at least 8 characters.")
      .max(128, "Use 128 characters or fewer."),
    confirmPassword: z.string(),
  })
  .refine((value) => value.newPassword === value.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match.",
  })
  .refine((value) => value.newPassword !== value.currentPassword, {
    path: ["newPassword"],
    message: "Choose a password that is different from the current one.",
  });

/** Admin: change sign-in email and/or password used at /login. */
export const adminSignInUpdateSchema = z
  .object({
    signInEmail: emailSchema,
    currentPassword: z.string().min(1, "Enter your current password."),
    newPassword: z
      .string()
      .max(128, "Use 128 characters or fewer.")
      .optional()
      .or(z.literal("")),
    confirmPassword: z.string().optional().or(z.literal("")),
  })
  .superRefine((value, ctx) => {
    const wantsPassword = Boolean(value.newPassword && value.newPassword.length > 0);
    if (!wantsPassword) return;
    if (value.newPassword!.length < 8) {
      ctx.addIssue({
        code: "custom",
        path: ["newPassword"],
        message: "Use at least 8 characters.",
      });
    }
    if (value.newPassword !== value.confirmPassword) {
      ctx.addIssue({
        code: "custom",
        path: ["confirmPassword"],
        message: "Passwords do not match.",
      });
    }
    if (value.newPassword === value.currentPassword) {
      ctx.addIssue({
        code: "custom",
        path: ["newPassword"],
        message: "Choose a password that is different from the current one.",
      });
    }
  });

export const responseSchema = z.object({
  ref: z.string().trim().min(1).max(20),
  status: z.union([z.enum(["YES", "NO", "NA"]), z.null()]),
  notes: z.string().max(4000, "Keep the explanation under 4,000 characters."),
  remarks: z.string().max(4000, "Keep remarks under 4,000 characters."),
  actionPlan: z.string().max(4000, "Keep the action plan under 4,000 characters."),
});

export function fieldErrors(error: z.ZodError) {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !errors[key]) errors[key] = issue.message;
  }
  return errors;
}

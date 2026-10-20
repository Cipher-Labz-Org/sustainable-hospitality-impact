"use client";

import { useState } from "react";
import Link from "next/link";
import { loginAction } from "@/backend/actions/auth";
import { PasswordInput } from "./password-input";
import { Button, Field, fieldClass } from "./ui";

export function LoginForm({
  callbackUrl,
  showSignupLink = false,
}: {
  callbackUrl: string;
  showSignupLink?: boolean;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="grid gap-5"
      onSubmit={async (event) => {
        event.preventDefault();
        const form = event.currentTarget;
        setPending(true);
        setError(null);
        try {
          const result = await loginAction(new FormData(form));
          if (!result.ok) {
            setError(result.error ?? "That email and password do not match an account.");
            return;
          }
          window.location.assign(result.data?.redirectTo ?? callbackUrl);
        } catch (error) {
          if (
            typeof error === "object" &&
            error !== null &&
            "digest" in error &&
            typeof (error as { digest?: unknown }).digest === "string" &&
            (error as { digest: string }).digest.startsWith("NEXT_REDIRECT")
          ) {
            throw error;
          }
          setError("Sign-in failed. Try again.");
        } finally {
          setPending(false);
        }
      }}
    >
      <input type="hidden" name="callbackUrl" value={callbackUrl} />
      <Field label="Email">
        <input className={fieldClass} name="email" type="email" autoComplete="email" required />
      </Field>
      <Field label="Password">
        <PasswordInput name="password" autoComplete="current-password" placeholder="Enter your password" />
      </Field>
      {error ? (
        <p className="rounded-xl border border-danger/25 bg-danger/5 px-3.5 py-2.5 text-sm font-medium text-danger">
          {error}
        </p>
      ) : null}
      <Button disabled={pending} type="submit" className="w-full">
        {pending ? "Signing in…" : "Sign in"}
      </Button>
      {showSignupLink ? (
        <p className="border-t border-line/60 pt-5 text-center text-sm text-muted">
          New here?{" "}
          <Link className="font-semibold text-teal hover:text-teal-deep" href="/signup">
            Create an account
          </Link>
        </p>
      ) : (
        <p className="border-t border-line/60 pt-5 text-center text-sm text-muted">
          Use the email and password from your administrator to sign in.
        </p>
      )}
    </form>
  );
}

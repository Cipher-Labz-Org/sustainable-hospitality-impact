"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { signupAction } from "@/backend/actions/auth";
import { saveContact, saveOrganization } from "@/backend/actions/profile";
import { BrandForm, ContactForm, OrganizationForm } from "./profile-forms";
import { Button, Field, fieldClass, cn } from "./ui";

type Step = "account" | "organization" | "contact" | "brand";

const STEPS: { id: Step; label: string }[] = [
  { id: "account", label: "Account" },
  { id: "organization", label: "Organization" },
  { id: "contact", label: "Contact" },
  { id: "brand", label: "Logo" },
];

export function SignupWizard({
  initialStep,
  email,
  organization,
  contact,
  hasLogo,
  logoVersion,
}: {
  initialStep: Step;
  email?: string;
  organization: {
    name: string;
    country: string;
    language: string;
    city: string;
    street: string;
    number: string;
    postcode: string;
    businessTypes: string[];
  };
  contact: { firstName: string; lastName: string; title: string; phone: string; email: string };
  hasLogo: boolean;
  logoVersion?: string;
}) {
  const router = useRouter();
  const signedIn = initialStep !== "account";
  const [step, setStep] = useState<Step>(initialStep);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [orgFieldErrors, setOrgFieldErrors] = useState<Record<string, string>>({});
  const [profileError, setProfileError] = useState<string | null>(null);
  const orgFormRef = useRef<HTMLFormElement>(null);
  const contactFormRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    setStep(initialStep);
  }, [initialStep]);

  return (
    <div className="grid gap-8 lg:grid-cols-[200px_1fr]">
      <ol className="flex gap-2 lg:flex-col">
        {STEPS.map((item, index) => {
          const locked = !signedIn && item.id !== "account";
          return (
            <li key={item.id}>
              <button
                type="button"
                disabled={locked}
                aria-current={step === item.id ? "step" : undefined}
                title={locked ? "Create your account to open this step." : undefined}
                onClick={() => {
                  if (!locked) {
                    setProfileError(null);
                    setStep(item.id);
                  }
                }}
                className={cn(
                  "flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-left text-sm",
                  step === item.id ? "bg-teal text-raised" : "text-muted hover:bg-white",
                  locked && "cursor-not-allowed opacity-45 hover:bg-transparent",
                )}
              >
                <span className={cn("grid h-6 w-6 place-items-center rounded-full text-xs", step === item.id ? "bg-white/15" : "bg-line text-ink")}>
                  {index + 1}
                </span>
                {item.label}
              </button>
            </li>
          );
        })}
      </ol>
      <div>
        {step === "account" && signedIn ? (
          <div className="grid gap-5">
            <div>
              <h2 className="font-serif text-3xl">Account</h2>
              <p className="mt-2 text-muted">
                This account is ready{email ? <> and signed in as <span className="font-medium text-ink">{email}</span></> : null}. You can change the password later in My Space.
              </p>
            </div>
            <div>
              <Button type="button" onClick={() => setStep("organization")}>
                Continue
              </Button>
            </div>
          </div>
        ) : null}

        {step === "account" && !signedIn ? (
          <form
            className="grid gap-5"
            onSubmit={async (event) => {
              event.preventDefault();
              const form = event.currentTarget;
              setPending(true);
              setError(null);
              setFieldErrors({});
              try {
                const result = await signupAction(new FormData(form));
                if (!result.ok) {
                  setError(result.error);
                  setFieldErrors(result.fieldErrors ?? {});
                  return;
                }
                window.location.assign("/signup");
              } catch {
                setError("The account could not be created. Try again.");
              } finally {
                setPending(false);
              }
            }}
          >
            <div>
              <h2 className="font-serif text-3xl">Create your account</h2>
              <p className="mt-2 text-muted">Use the email you want to sign in with. You can add a different contact email on the next steps.</p>
            </div>
            <Field label="Email" error={fieldErrors.email}>
              <input className={fieldClass} name="email" type="email" autoComplete="email" required />
            </Field>
            <Field label="Password" hint="At least 8 characters." error={fieldErrors.password}>
              <input className={fieldClass} name="password" type="password" autoComplete="new-password" required minLength={8} />
            </Field>
            <Field label="Confirm password" error={fieldErrors.confirmPassword}>
              <input className={fieldClass} name="confirmPassword" type="password" autoComplete="new-password" required minLength={8} />
            </Field>
            {error ? <p className="text-sm text-danger">{error}</p> : null}
            <Button disabled={pending} type="submit">
              {pending ? "Creating account…" : "Continue"}
            </Button>
          </form>
        ) : null}

        {signedIn ? (
          <>
            <div className={cn("grid gap-6", step !== "organization" && "hidden")}>
              <div>
                <h2 className="font-serif text-3xl">Organization</h2>
                <p className="mt-2 text-muted">
                  Fill in your organization, then continue to contact details. Everything is saved when you click Save and continue on the Contact step.
                </p>
              </div>
              <OrganizationForm
                formRef={orgFormRef}
                initial={organization}
                continueOnly
                submitLabel="Continue"
                errorOverrides={orgFieldErrors}
                onSaved={() => {
                  setOrgFieldErrors({});
                  setProfileError(null);
                  setStep("contact");
                }}
              />
            </div>

            <div className={cn("grid gap-6", step !== "contact" && "hidden")}>
              <div>
                <h2 className="font-serif text-3xl">Contact</h2>
                <p className="mt-2 text-muted">Who should be reached about this assessment.</p>
              </div>
              {profileError ? <p className="text-sm text-danger">{profileError}</p> : null}
              <ContactForm
                formRef={contactFormRef}
                initial={contact}
                submitLabel="Save and continue"
                onSaved={() => {
                  setProfileError(null);
                  setOrgFieldErrors({});
                  setStep("brand");
                }}
                saveAction={async (contactFormData) => {
                  setProfileError(null);
                  setOrgFieldErrors({});
                  const orgForm = orgFormRef.current;
                  if (!orgForm) {
                    return { ok: false, error: "Organization details are missing. Open the Organization step first." };
                  }
                  const orgResult = await saveOrganization(new FormData(orgForm));
                  if (!orgResult.ok) {
                    setStep("organization");
                    setOrgFieldErrors(orgResult.fieldErrors ?? {});
                    setProfileError(orgResult.error ?? "Check the organization details.");
                    return orgResult;
                  }
                  const contactResult = await saveContact(contactFormData);
                  if (!contactResult.ok) {
                    setProfileError(contactResult.error ?? "Check the contact details.");
                  }
                  return contactResult;
                }}
              />
            </div>

            <div className={cn("grid gap-6", step !== "brand" && "hidden")}>
              <div>
                <h2 className="font-serif text-3xl">Your logo</h2>
                <p className="mt-2 text-muted">Optional. You can add or replace it any time from My Space.</p>
              </div>
              <BrandForm hasLogo={hasLogo} logoVersion={logoVersion} />
              <div className="flex flex-wrap gap-3">
                <Button type="button" onClick={() => router.push("/assessment")}>
                  Go to assessment
                </Button>
                <Button type="button" variant="secondary" onClick={() => router.push("/space")}>
                  Finish in My Space
                </Button>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}

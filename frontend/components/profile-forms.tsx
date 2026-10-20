"use client";

import { useEffect, useRef, useState, type DragEvent, type Ref } from "react";
import { useRouter } from "next/navigation";
import { removeLogo, saveContact, saveLogo, saveOrganization, updateAdminSignIn } from "@/backend/actions/profile";
import { BUSINESS_TYPES, LANGUAGES, TITLES } from "@/backend/lib/options";
import { CountrySelect } from "./country-select";
import { PasswordInput } from "./password-input";
import { SpaceFormLayout, SpaceTipsList, SpaceTipsTitle } from "./space-form-layout";
import { Button, cn, Field, fieldClass } from "./ui";

type Errors = Record<string, string>;

function useFormState(onSaved?: () => void) {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [tone, setTone] = useState<"ok" | "danger">("ok");
  const [errors, setErrors] = useState<Errors>({});

  async function submit(
    action: (formData: FormData) => Promise<{ ok: boolean; error?: string; fieldErrors?: Errors }>,
    formData: FormData,
    successMessage = "Saved.",
  ) {
    setPending(true);
    setMessage(null);
    const result = await action(formData);
    setPending(false);
    if (!result.ok) {
      setErrors(result.fieldErrors ?? {});
      setTone("danger");
      setMessage(result.error ?? "Something went wrong.");
      return false;
    }
    setErrors({});
    setTone("ok");
    setMessage(successMessage);
    onSaved?.();
    return true;
  }

  return { pending, message, tone, errors, submit };
}

function StatusLine({ message, tone }: { message: string | null; tone: "ok" | "danger" }) {
  if (!message) return null;
  return <p className={tone === "ok" ? "text-sm text-ok" : "text-sm text-danger"}>{message}</p>;
}

type ProfileActionResult = { ok: boolean; error?: string; fieldErrors?: Errors };

function LogoPlaceholderIcon() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true" className="h-12 w-12 text-teal-muted/50">
      <rect x="6" y="10" width="36" height="28" rx="4" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="17" cy="20" r="3" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M6 32l10-9 8 6 8-10 10 13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
      <path
        d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m-9 0 10a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V7H6v10Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M10 11v5M14 11v5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function OrganizationForm({
  initial,
  submitLabel = "Save organization",
  onSaved,
  formRef,
  continueOnly = false,
  errorOverrides,
}: {
  initial: {
    name: string;
    country: string;
    language: string;
    city: string;
    street: string;
    number: string;
    postcode: string;
    businessTypes: string[];
  };
  submitLabel?: string;
  onSaved?: () => void;
  formRef?: Ref<HTMLFormElement>;
  continueOnly?: boolean;
  errorOverrides?: Errors;
}) {
  const form = useFormState(continueOnly ? undefined : onSaved);
  const languageOptions = LANGUAGES.includes(initial.language as (typeof LANGUAGES)[number])
    ? LANGUAGES
    : [initial.language, ...LANGUAGES];
  const fieldError = (key: string) => errorOverrides?.[key] ?? form.errors[key];

  return (
    <form
      ref={formRef}
      className="grid gap-5"
      onSubmit={async (event) => {
        event.preventDefault();
        if (continueOnly) {
          onSaved?.();
          return;
        }
        await form.submit(saveOrganization, new FormData(event.currentTarget));
      }}
    >
      <Field label="Organization name" error={fieldError("name")}>
        <input className={fieldClass} name="name" defaultValue={initial.name} required />
      </Field>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Country" error={fieldError("country")}>
          <CountrySelect name="country" defaultValue={initial.country} />
        </Field>
        <Field label="Language" error={fieldError("language")}>
          <select className={fieldClass} name="language" defaultValue={initial.language || "English"}>
            {languageOptions.map((language) => (
              <option key={language} value={language}>
                {language}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <Field label="City" error={fieldError("city")}>
        <input className={fieldClass} name="city" defaultValue={initial.city} />
      </Field>
      <Field label="Street address" error={fieldError("street")}>
        <input className={fieldClass} name="street" defaultValue={initial.street} />
      </Field>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Number" error={fieldError("number")}>
          <input className={fieldClass} name="number" defaultValue={initial.number} />
        </Field>
        <Field label="Postcode" error={fieldError("postcode")}>
          <input className={fieldClass} name="postcode" defaultValue={initial.postcode} />
        </Field>
      </div>
      <fieldset>
        <legend className="text-sm font-medium">Type of business</legend>
        <p className="mt-1 text-sm text-muted">Choose every type that applies.</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {BUSINESS_TYPES.map((type) => (
            <label key={type.id} className="flex items-start gap-2 rounded-xl border border-line bg-white px-3 py-2.5 text-sm">
              <input
                className="mt-0.5 accent-teal"
                type="checkbox"
                name="businessTypes"
                value={type.id}
                defaultChecked={initial.businessTypes.includes(type.id)}
              />
              <span>{type.label}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <div className="flex flex-wrap items-center gap-4 border-t border-line/60 pt-5">
        <Button disabled={form.pending} type="submit">
          {form.pending ? "Saving…" : submitLabel}
        </Button>
        <StatusLine message={form.message} tone={form.tone} />
      </div>
    </form>
  );
}

export function ContactForm({
  initial,
  submitLabel = "Save contact",
  onSaved,
  formRef,
  saveAction,
}: {
  initial: { firstName: string; lastName: string; title: string; phone: string; email: string };
  submitLabel?: string;
  onSaved?: () => void;
  formRef?: Ref<HTMLFormElement>;
  saveAction?: (formData: FormData) => Promise<ProfileActionResult>;
}) {
  const form = useFormState(onSaved);
  const action = saveAction ?? saveContact;

  return (
    <form
      ref={formRef}
      className="grid gap-5"
      onSubmit={async (event) => {
        event.preventDefault();
        await form.submit(action, new FormData(event.currentTarget));
      }}
    >
      <fieldset>
        <legend className="text-sm font-medium">Title</legend>
        <div className="mt-3 flex flex-wrap gap-3">
          {TITLES.map((title) => (
            <label key={title} className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-3 py-1.5 text-sm">
              <input className="accent-teal" type="radio" name="title" value={title} defaultChecked={initial.title === title} />
              {title}
            </label>
          ))}
          <label className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-3 py-1.5 text-sm">
            <input className="accent-teal" type="radio" name="title" value="" defaultChecked={!initial.title} />
            Prefer not to say
          </label>
        </div>
      </fieldset>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="First name" error={form.errors.firstName}>
          <input className={fieldClass} name="firstName" defaultValue={initial.firstName} required />
        </Field>
        <Field label="Last name" error={form.errors.lastName}>
          <input className={fieldClass} name="lastName" defaultValue={initial.lastName} required />
        </Field>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Phone" error={form.errors.phone}>
          <input className={fieldClass} name="phone" defaultValue={initial.phone} inputMode="tel" />
        </Field>
        <Field label="Contact email" error={form.errors.email} hint="This can be different from your sign-in email.">
          <input className={fieldClass} name="email" type="email" defaultValue={initial.email} />
        </Field>
      </div>
      <div className="flex flex-wrap items-center gap-4 border-t border-line/60 pt-5">
        <Button disabled={form.pending} type="submit">
          {form.pending ? "Saving…" : submitLabel}
        </Button>
        <StatusLine message={form.message} tone={form.tone} />
      </div>
    </form>
  );
}

export function SecurityForm({ signInEmail }: { signInEmail: string }) {
  const router = useRouter();
  const form = useFormState();
  return (
    <SpaceFormLayout
      aside={
        <>
          <SpaceTipsTitle>Your admin sign-in</SpaceTipsTitle>
          <SpaceTipsList
            items={[
              "This email and password are what you use at /login—not the contact person email.",
              "Client sign-in is managed under Client sign-in in the top menu.",
              "Leave new password blank if you only want to change the sign-in email.",
            ]}
          />
        </>
      }
    >
      <form
        className="surface-inset p-5 sm:p-6"
        onSubmit={async (event) => {
          event.preventDefault();
          const formElement = event.currentTarget;
          const saved = await form.submit(
            updateAdminSignIn,
            new FormData(formElement),
            "Sign-in details saved. Use the updated email and password on the Sign in page.",
          );
          if (saved) {
            formElement.querySelectorAll<HTMLInputElement>('input[type="password"]').forEach((el) => {
              el.value = "";
            });
            router.refresh();
          }
        }}
      >
        <div className="grid max-w-xl gap-5">
          <Field
            label="Sign-in email"
            hint="Used on the Sign in page. Changing this does not change client accounts."
            error={form.errors.signInEmail}
          >
            <input
              className={fieldClass}
              name="signInEmail"
              type="email"
              autoComplete="username"
              required
              defaultValue={signInEmail}
            />
          </Field>
          <Field label="Current password" error={form.errors.currentPassword}>
            <PasswordInput name="currentPassword" autoComplete="current-password" required />
          </Field>
          <Field
            label="New password"
            hint="Optional. Leave blank to keep your current password."
            error={form.errors.newPassword}
          >
            <PasswordInput name="newPassword" autoComplete="new-password" minLength={8} />
          </Field>
          <Field label="Confirm new password" error={form.errors.confirmPassword}>
            <PasswordInput name="confirmPassword" autoComplete="new-password" minLength={8} />
          </Field>
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-4 border-t border-line/60 pt-5">
          <Button disabled={form.pending} type="submit">
            {form.pending ? "Saving…" : "Save sign-in details"}
          </Button>
          <StatusLine message={form.message} tone={form.tone} />
        </div>
      </form>
    </SpaceFormLayout>
  );
}

const MAX_LOGO_BYTES = 5 * 1024 * 1024;

function logoFileError(file: File) {
  const name = file.name.toLowerCase();
  const okType =
    ["image/png", "image/jpeg", "image/webp"].includes(file.type) || /\.(png|jpe?g|webp)$/.test(name);
  if (!okType) return "Please choose a PNG, JPG, or WEBP image.";
  if (file.size <= 0) return "That file looks empty. Please try another image.";
  if (file.size > MAX_LOGO_BYTES) return "That image is over 5 MB. Please choose a smaller one.";
  return null;
}

export function BrandForm({
  hasLogo,
  logoVersion,
  onSaved,
}: {
  hasLogo: boolean;
  logoVersion?: string;
  onSaved?: () => void;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [tone, setTone] = useState<"ok" | "danger">("ok");
  const [preview, setPreview] = useState<string | null>(null);
  const [pendingSelection, setPendingSelection] = useState(false);
  const [savedLogo, setSavedLogo] = useState(hasLogo);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setSavedLogo(hasLogo);
  }, [hasLogo, logoVersion]);

  const displaySrc = preview ?? (savedLogo ? `/api/files/brand?v=${logoVersion ?? "1"}` : null);

  const selectionHint = pendingSelection
    ? "New image selected — click Save logo to keep it."
    : savedLogo
      ? "This is the logo on your profile."
      : "Choose an image, then click Save logo.";

  function clearFileSelection() {
    setPreview((current) => {
      if (current) URL.revokeObjectURL(current);
      return null;
    });
    setPendingSelection(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function assignFile(file: File) {
    const error = logoFileError(file);
    if (error) {
      setTone("danger");
      setMessage(error);
      return;
    }
    setMessage(null);
    setPreview((current) => {
      if (current) URL.revokeObjectURL(current);
      return URL.createObjectURL(file);
    });
    setPendingSelection(true);
    if (fileInputRef.current) {
      const transfer = new DataTransfer();
      transfer.items.add(file);
      fileInputRef.current.files = transfer.files;
    }
  }

  function openFilePicker() {
    setMessage(null);
    fileInputRef.current?.click();
  }

  function onLogoDragOver(event: DragEvent) {
    event.preventDefault();
    if (!pending) setDragOver(true);
  }

  function onLogoDrop(event: DragEvent) {
    event.preventDefault();
    setDragOver(false);
    if (pending) return;
    const file = event.dataTransfer.files?.[0];
    if (file) assignFile(file);
  }

  async function handleRemove() {
    setMessage(null);
    setPending(true);
    const result = await removeLogo();
    setPending(false);
    if (!result.ok) {
      setTone("danger");
      setMessage(result.error ?? "Could not remove the logo. Please try again.");
      return;
    }
    setSavedLogo(false);
    setTone("ok");
    setMessage("Logo removed.");
    clearFileSelection();
    router.refresh();
  }

  return (
    <form
      className="w-full"
      onSubmit={async (event) => {
        event.preventDefault();
        setPending(true);
        setMessage(null);
        const result = await saveLogo(new FormData(event.currentTarget));
        setPending(false);
        if (!result.ok) {
          setTone("danger");
          setMessage(result.error ?? "Could not save that image. Please try another file.");
          return;
        }
        setTone("ok");
        setMessage("Logo saved.");
        setSavedLogo(true);
        clearFileSelection();
        router.refresh();
        onSaved?.();
      }}
    >
      <input
        ref={fileInputRef}
        className="sr-only"
        name="logo"
        type="file"
        accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (!file) {
            clearFileSelection();
            return;
          }
          assignFile(file);
        }}
      />

      <div className="surface-inset overflow-hidden shadow-[var(--shadow-card)]">
        <div className="grid grid-cols-1 gap-0 lg:grid-cols-[minmax(13rem,16rem)_minmax(0,1fr)]">
          <button
            type="button"
            disabled={pending}
            aria-label={displaySrc ? "Change logo image" : "Choose logo image"}
            onClick={openFilePicker}
            onDragOver={onLogoDragOver}
            onDragLeave={() => setDragOver(false)}
            onDrop={onLogoDrop}
            className={cn(
              "group relative flex flex-col items-center justify-center gap-3 border-b border-teal/12 bg-gradient-to-br from-teal-soft/80 via-raised to-brass-soft/45 p-4 text-center transition duration-200 sm:p-6 lg:min-h-[15.5rem] lg:border-b-0 lg:border-r lg:border-teal/12",
              dragOver && "bg-teal-soft/50 ring-2 ring-inset ring-teal/35",
              pendingSelection && "from-teal-soft/45 to-teal-soft/20",
              !pending && "hover:from-teal-soft/30",
            )}
          >
            <div
              className={cn(
                "relative mx-auto flex w-full max-w-[10rem] shrink-0 items-center justify-center transition sm:max-w-[12rem] lg:max-w-[12.5rem]",
                displaySrc
                  ? "min-h-[7.5rem] bg-transparent p-1 sm:min-h-[8.5rem]"
                  : "aspect-square overflow-hidden rounded-2xl border-2 border-dashed border-teal-muted/35 bg-white/70 group-hover:border-teal/40",
              )}
            >
              {displaySrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={displaySrc}
                  alt="Logo preview"
                  className="max-h-36 w-auto max-w-full object-contain object-center drop-shadow-md sm:max-h-40"
                />
              ) : (
                <div className="flex flex-col items-center justify-center gap-2 px-3 text-center">
                  <LogoPlaceholderIcon />
                  <span className="text-xs font-medium leading-snug text-muted">Logo preview</span>
                </div>
              )}
            </div>
            <span className="max-w-[13rem] text-center text-xs font-semibold leading-snug text-teal-muted">
              {dragOver ? "Drop to upload" : displaySrc ? "Click or drop to replace" : "Click or drop image here"}
            </span>
          </button>

          <div className="flex min-w-0 flex-col justify-between p-4 sm:p-6 lg:p-7">
            <div>
              <h3 className="font-serif text-xl text-ink">Upload your logo</h3>
              <p className="mt-1.5 text-sm text-muted">PNG, JPG, or WEBP · up to 5 MB</p>

              <p className={cn("mt-4 text-sm leading-relaxed", pendingSelection ? "font-medium text-ok" : "text-muted")}>
                {selectionHint}
              </p>

              <div className="mt-5 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-center">
                <Button type="button" variant="secondary" disabled={pending} onClick={openFilePicker} className="w-full sm:w-auto">
                  {displaySrc ? "Change image" : "Choose image"}
                </Button>
                <Button disabled={pending || !pendingSelection} type="submit" className="w-full sm:w-auto">
                  {pending ? "Saving…" : "Save logo"}
                </Button>
                {savedLogo && !pendingSelection ? (
                  <Button type="button" variant="danger" disabled={pending} className="w-full gap-2 sm:w-auto" onClick={handleRemove}>
                    <TrashIcon />
                    Remove
                  </Button>
                ) : null}
                {pendingSelection ? (
                  <Button type="button" variant="ghost" disabled={pending} className="w-full sm:w-auto" onClick={clearFileSelection}>
                    Cancel
                  </Button>
                ) : null}
              </div>

              <p className="mt-3 min-h-[1.25rem] text-sm" aria-live="polite">
                {message && !pendingSelection ? (
                  <span className={tone === "ok" ? "font-medium text-ok" : "font-medium text-danger"}>{message}</span>
                ) : pendingSelection ? (
                  <span className="text-ink">Review the preview, then save.</span>
                ) : null}
              </p>
            </div>

            <div className="surface-tips mt-6 px-4 py-4 sm:mt-8 sm:px-5">
              <p className="text-xs font-semibold tracking-wide text-teal uppercase">Logo guidelines</p>
              <ul className="mt-3 grid gap-2.5 sm:grid-cols-3 sm:gap-3">
                {[
                  "Any shape works. Header and reports keep the original proportions.",
                  "Use a clear image on a plain background.",
                  "Appears in the header, on your profile, and on report exports.",
                ].map((item) => (
                  <li key={item} className="flex gap-2 text-xs leading-relaxed text-muted sm:flex-col sm:gap-1.5">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-teal sm:mt-0" aria-hidden="true" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}

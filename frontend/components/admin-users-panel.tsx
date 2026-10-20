"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createManagedUser, deleteManagedUser, updateManagedUser } from "@/backend/actions/admin-users";
import { formatDisplayDate } from "@/frontend/lib/format-date";
import { PasswordInput } from "./password-input";
import { SpaceTipsList, SpaceTipsTitle } from "./space-form-layout";
import { Button, btnSecondary, cn, Field, fieldClass } from "./ui";

function ClientAvatar({ email }: { email: string }) {
  const initial = email.trim().charAt(0).toUpperCase() || "?";
  return (
    <span
      className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-gradient-to-br from-teal-soft to-teal-soft/40 font-semibold text-teal-deep ring-2 ring-teal/15"
      aria-hidden="true"
    >
      {initial}
    </span>
  );
}

function IconEdit({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        d="M4 20h4l10.5-10.5a2.12 2.12 0 0 0-3-3L5 17v3Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M13 7l3 3" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}

function IconTrash({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M10 11v6M14 11v6M6 7l1 12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-12"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ClientRowActions({
  userId,
  deleting,
  onEdit,
  onDelete,
}: {
  userId: string;
  deleting: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex w-full shrink-0 flex-wrap items-stretch gap-2 sm:w-auto sm:justify-end">
      <Link href={`/admin/clients/${userId}`} className={cn(btnSecondary, "min-h-10 flex-1 px-4 py-2 text-sm sm:flex-none")}>
        View assessment
      </Link>
      <Button
        type="button"
        variant="secondary"
        className="min-h-10 flex-1 gap-2 px-4 py-2 sm:flex-none"
        disabled={deleting}
        onClick={onEdit}
      >
        <IconEdit className="h-4 w-4 shrink-0 opacity-90" />
        Change password
      </Button>
      <Button
        type="button"
        variant="danger"
        className="min-h-10 flex-1 gap-2 px-4 py-2 sm:flex-none"
        disabled={deleting}
        onClick={onDelete}
      >
        <IconTrash className="h-4 w-4 shrink-0 opacity-90" />
        {deleting ? "Deleting…" : "Delete"}
      </Button>
    </div>
  );
}

function StatusLine({ message, tone }: { message: string | null; tone: "ok" | "error" }) {
  if (!message) return null;
  return <p className={tone === "ok" ? "text-sm text-ok" : "text-sm text-danger"}>{message}</p>;
}

type ManagedUser = {
  id: string;
  email: string;
  organizationName: string;
  createdAt: string;
};

function useAdminForm() {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [tone, setTone] = useState<"ok" | "error">("ok");
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function submit(
    action: (formData: FormData) => Promise<{ ok: boolean; error?: string; fieldErrors?: Record<string, string> }>,
    formData: FormData,
  ) {
    setPending(true);
    setMessage(null);
    setErrors({});
    try {
      const result = await action(formData);
      if (!result.ok) {
        setTone("error");
        setMessage(result.error ?? "Something went wrong.");
        setErrors(result.fieldErrors ?? {});
        return false;
      }
      setTone("ok");
      setMessage("Sign-in details saved.");
      return true;
    } finally {
      setPending(false);
    }
  }

  return { pending, message, tone, errors, submit, clear: () => { setMessage(null); setErrors({}); } };
}

const NEW_CLIENT_TIPS = [
  "Add the hotel or property name—it appears in Assessment & reporting.",
  "Use the client’s real email—they sign in with it at /login.",
  "Share the password securely; they cannot reset it themselves.",
  "After they fill the assessment, open Client assessments to read their answers and reports.",
] as const;

function NewClientSignInAside() {
  return (
    <aside className="surface-tips h-fit rounded-2xl p-5 shadow-sm sm:p-6 lg:sticky lg:top-24">
      <p className="text-[0.65rem] font-bold tracking-[0.16em] text-brass uppercase">Before you save</p>
      <SpaceTipsTitle>How client sign-in works</SpaceTipsTitle>
      <SpaceTipsList items={[...NEW_CLIENT_TIPS]} />
    </aside>
  );
}

export function AdminUsersPanel({ users }: { users: ManagedUser[] }) {
  const router = useRouter();
  const createForm = useAdminForm();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const editForm = useAdminForm();

  async function removeClient(user: ManagedUser) {
    const confirmed = window.confirm(
      `Remove ${user.email}?\n\nTheir account, organization profile, and assessment data will be permanently deleted.`,
    );
    if (!confirmed) return;

    setDeleteError(null);
    setDeletingId(user.id);
    const formData = new FormData();
    formData.set("userId", user.id);
    const result = await deleteManagedUser(formData);
    setDeletingId(null);
    if (!result.ok) {
      setDeleteError(result.error ?? "Could not delete that user.");
      return;
    }
    if (editingId === user.id) setEditingId(null);
    router.refresh();
  }

  const editing = users.find((user) => user.id === editingId) ?? null;

  return (
    <div className="grid gap-6">
      <section className="surface-card">
        <div className="border-b border-line/50 px-5 pb-5 pt-5 sm:px-7 sm:pb-6 sm:pt-6">
          <h2 className="font-serif text-xl text-ink sm:text-[1.35rem]">New client sign-in</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
            You choose the email and password. The client uses only these to sign in.
          </p>
        </div>

        <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[minmax(0,17rem)_minmax(0,1fr)] lg:items-start lg:gap-8">
          <NewClientSignInAside />

          <form
            className="grid w-full min-w-0 gap-5"
            onSubmit={async (event) => {
              event.preventDefault();
              const formElement = event.currentTarget;
              const saved = await createForm.submit(createManagedUser, new FormData(formElement));
              if (saved) formElement.reset();
            }}
          >
            <Field label="Hotel / organization name" error={createForm.errors.organizationName}>
              <input
                className={fieldClass}
                name="organizationName"
                type="text"
                autoComplete="organization"
                required
                placeholder="e.g. Cinnamon Grand Colombo"
              />
            </Field>
            <Field label="Sign-in email (client)" error={createForm.errors.email}>
              <input
                className={fieldClass}
                name="email"
                type="email"
                autoComplete="off"
                required
                placeholder="client@hotel.com"
              />
            </Field>
            <div className="space-y-2">
              <p className="text-sm text-muted">At least 8 characters. Share the password with the client securely.</p>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Sign-in password" error={createForm.errors.password}>
                  <PasswordInput name="password" autoComplete="new-password" minLength={8} required />
                </Field>
                <Field label="Confirm password" error={createForm.errors.confirmPassword}>
                  <PasswordInput name="confirmPassword" autoComplete="new-password" minLength={8} required />
                </Field>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-4 border-t border-line/50 pt-5">
              <Button disabled={createForm.pending} type="submit">
                {createForm.pending ? "Saving…" : "Save sign-in details"}
              </Button>
              <StatusLine message={createForm.message} tone={createForm.tone} />
            </div>
          </form>
        </div>
      </section>

      <section className="surface-card">
        <div className="flex flex-wrap items-end justify-between gap-3 border-b border-line/60 px-5 py-4 sm:px-7">
          <div>
            <h2 className="font-serif text-xl text-ink">Existing clients</h2>
            <p className="mt-1 text-sm text-muted">
              Change password, delete accounts, or open a client&apos;s filled assessment.
            </p>
          </div>
          {users.length > 0 ? (
            <span className="rounded-full bg-teal-soft px-3 py-1 text-xs font-semibold text-teal-deep">
              {users.length} {users.length === 1 ? "account" : "accounts"}
            </span>
          ) : null}
        </div>
        {deleteError ? (
          <p className="mx-5 mt-4 rounded-xl border border-danger/25 bg-danger/5 px-3.5 py-2.5 text-sm font-medium text-danger sm:mx-7">
            {deleteError}
          </p>
        ) : null}
        {users.length === 0 ? (
          <p className="px-5 py-8 text-sm text-muted sm:px-7">No client accounts yet. Add sign-in details above.</p>
        ) : (
          <ul className="flex flex-col gap-3 p-5 sm:p-7">
            {users.map((user) => {
              const isEditing = editing?.id === user.id;
              const deleting = deletingId === user.id;
              return (
                <li key={user.id}>
                  {isEditing ? (
                    <form
                      className="flex flex-col gap-5 rounded-2xl border border-teal/25 bg-gradient-to-b from-teal-soft/55 via-raised to-raised p-5 shadow-[var(--shadow-card)] sm:p-6"
                      onSubmit={async (event) => {
                        event.preventDefault();
                        const formElement = event.currentTarget;
                        const saved = await editForm.submit(updateManagedUser, new FormData(formElement));
                        if (saved) setEditingId(null);
                      }}
                    >
                      <div className="border-b border-teal/15 pb-4">
                        <p className="text-[0.65rem] font-bold tracking-[0.14em] text-teal uppercase">Change password</p>
                        <p className="mt-1 text-sm text-muted">
                          Account added {formatDisplayDate(user.createdAt)} · Sign-in email cannot be changed here.
                        </p>
                      </div>

                      <input type="hidden" name="userId" value={user.id} />
                      {user.organizationName.trim() ? (
                        <Field
                          label="Hotel / organization name"
                          hint="Clients can update details in My Space. Name is shown here for your reference."
                        >
                          <input
                            className={cn(fieldClass, "cursor-not-allowed bg-paper text-muted")}
                            type="text"
                            value={user.organizationName}
                            readOnly
                            disabled
                            aria-readonly="true"
                          />
                        </Field>
                      ) : null}
                      <Field
                        label="Sign-in email"
                        hint="Fixed when the account was created. Delete and create a new account to use a different email."
                      >
                        <input
                          className={cn(fieldClass, "cursor-not-allowed bg-paper text-muted")}
                          type="email"
                          value={user.email}
                          readOnly
                          disabled
                          aria-readonly="true"
                        />
                      </Field>
                      <div className="space-y-2">
                        <p className="text-sm text-muted">Set a new password for this client.</p>
                        <div className="grid gap-5 sm:grid-cols-2">
                          <Field label="New sign-in password" error={editForm.errors.password}>
                            <PasswordInput name="password" autoComplete="new-password" minLength={8} required />
                          </Field>
                          <Field label="Confirm new password" error={editForm.errors.confirmPassword}>
                            <PasswordInput name="confirmPassword" autoComplete="new-password" minLength={8} required />
                          </Field>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 border-t border-teal/15 pt-5">
                        <Button disabled={editForm.pending || deleting} type="submit">
                          {editForm.pending ? "Saving…" : "Update password"}
                        </Button>
                        <Button type="button" variant="secondary" onClick={() => setEditingId(null)}>
                          Cancel
                        </Button>
                        <Button
                          type="button"
                          variant="danger"
                          disabled={editForm.pending || deleting}
                          onClick={() => removeClient(user)}
                        >
                          {deleting ? "Deleting…" : "Delete account"}
                        </Button>
                        <StatusLine message={editForm.message} tone={editForm.tone} />
                      </div>
                    </form>
                  ) : (
                    <div
                      className={cn(
                        "flex flex-col gap-4 rounded-2xl border p-4 transition sm:flex-row sm:items-center sm:justify-between sm:p-5",
                        "border-line/50 bg-gradient-to-br from-raised via-raised to-shell/40 shadow-sm hover:border-teal/20 hover:shadow-[var(--shadow-card)]",
                      )}
                    >
                      <div className="flex min-w-0 flex-1 items-center gap-3.5">
                        <ClientAvatar email={user.email} />
                        <div className="min-w-0">
                          <p className="text-[0.65rem] font-bold tracking-[0.12em] text-teal-muted uppercase">Client</p>
                          <p className="truncate font-medium text-ink">
                            {user.organizationName.trim() ? user.organizationName : user.email}
                          </p>
                          <p className="mt-0.5 truncate text-xs text-muted">
                            {user.organizationName.trim() ? user.email : null}
                            {user.organizationName.trim() ? " · " : null}
                            Added {formatDisplayDate(user.createdAt)}
                          </p>
                        </div>
                      </div>
                      <ClientRowActions
                        userId={user.id}
                        deleting={deleting}
                        onEdit={() => {
                          setEditingId(user.id);
                          editForm.clear();
                        }}
                        onDelete={() => removeClient(user)}
                      />
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

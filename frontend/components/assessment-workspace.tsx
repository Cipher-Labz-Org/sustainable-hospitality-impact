"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { deleteEvidence, saveResponse, uploadEvidence } from "@/backend/actions/assessment";
import type { FilterId, QuestionDetailTab, QuestionRow } from "@/backend/lib/assessment-types";
import type { AnswerStatus } from "@/backend/lib/options";
import { STATUS_LABELS } from "@/backend/lib/options";
import { formatBytes } from "@/frontend/lib/format";
import { Button, cn } from "./ui";

const DETAIL_TABS: { id: QuestionDetailTab; label: string }[] = [
  { id: "reporting", label: "Reporting" },
  { id: "guidance", label: "Guidance" },
  { id: "remarks", label: "Remarks" },
  { id: "action-plan", label: "Action plan" },
  { id: "best-practices", label: "Best practices" },
];

const FILTERS: { id: FilterId; label: string }[] = [
  { id: "all", label: "All" },
  { id: "unanswered", label: "Unanswered" },
  { id: "YES", label: "Yes" },
  { id: "NO", label: "No" },
  { id: "NA", label: "N/A" },
  { id: "missing", label: "Missing evidence" },
];

function matches(row: QuestionRow, filter: FilterId) {
  if (filter === "all") return true;
  if (filter === "unanswered") return !row.status;
  if (filter === "missing") return (row.status === "YES" || row.status === "NO") && row.evidence.length === 0;
  return row.status === filter;
}

export function AssessmentWorkspace({
  sectionId,
  official,
  questions,
  initialRef,
  readOnly = false,
  viewer = "owner",
  documentsHref = "/assessment/library",
}: {
  sectionId: string;
  official: string;
  questions: QuestionRow[];
  initialRef?: string;
  readOnly?: boolean;
  viewer?: "owner" | "admin";
  documentsHref?: string;
}) {
  const [rows, setRows] = useState(questions);
  const [filter, setFilter] = useState<FilterId>("all");
  const [selectedRef, setSelectedRef] = useState(
    questions.find((row) => row.ref === initialRef)?.ref ?? questions[0]?.ref ?? "",
  );
  const [detailTab, setDetailTab] = useState<QuestionDetailTab>("reporting");
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inFlight = useRef(false);
  const queued = useRef<QuestionRow | null>(null);
  const pending = useRef<QuestionRow | null>(null);

  const filtered = useMemo(() => rows.filter((row) => matches(row, filter)), [rows, filter]);
  const visibleRef = filtered.some((row) => row.ref === selectedRef) ? selectedRef : (filtered[0]?.ref ?? "");
  const selected = rows.find((row) => row.ref === visibleRef);
  const selectedIndex = filtered.findIndex((row) => row.ref === visibleRef);
  const answered = rows.filter((row) => row.status).length;

  async function persist(row: QuestionRow) {
    if (readOnly) return;
    if (inFlight.current) {
      queued.current = row;
      return;
    }
    inFlight.current = true;
    setSaveState("saving");
    const result = await saveResponse({
      ref: row.ref,
      status: row.status,
      notes: row.notes,
      remarks: row.remarks,
      actionPlan: row.actionPlan,
    });
    inFlight.current = false;
    if (queued.current) {
      const next = queued.current;
      queued.current = null;
      await persist(next);
      return;
    }
    setSaveState(result.ok ? "saved" : "error");
  }

  function queueSave(row: QuestionRow, immediate: boolean) {
    if (readOnly) return;
    pending.current = row;
    if (timer.current) clearTimeout(timer.current);
    const run = () => {
      const latest = pending.current;
      pending.current = null;
      if (latest) void persist(latest);
    };
    if (immediate) run();
    else timer.current = setTimeout(run, 700);
  }

  function updateRow(ref: string, patch: Partial<QuestionRow>, immediate: boolean) {
    if (readOnly) return;
    const current = rows.find((row) => row.ref === ref);
    if (!current) return;
    const next = { ...current, ...patch };
    setRows((existing) => existing.map((row) => (row.ref === ref ? next : row)));
    queueSave(next, immediate);
  }

  function selectQuestion(ref: string) {
    if (timer.current) clearTimeout(timer.current);
    if (pending.current) {
      const latest = pending.current;
      pending.current = null;
      void persist(latest);
    }
    setSelectedRef(ref);
    setUploadError(null);
  }

  const groups: { code: string; name: string; items: QuestionRow[] }[] = [];
  for (const row of filtered) {
    const last = groups[groups.length - 1];
    if (!last || last.code !== row.categoryCode) {
      groups.push({ code: row.categoryCode, name: row.categoryName, items: [row] });
    } else {
      last.items.push(row);
    }
  }

  const navigation = (
    <div className="flex flex-col gap-6">
      {groups.map((group) => (
        <div key={group.code} className="min-w-0">
          <div className="flex items-center justify-between gap-2 px-2">
            <p className="min-w-0 truncate text-[0.7rem] font-bold tracking-[0.14em] text-brass uppercase">
              {group.code} {group.name}
            </p>
            <span className="shrink-0 rounded-full bg-teal-soft/70 px-2 py-0.5 text-[0.65rem] font-semibold tabular-nums text-teal">
              {group.items.length}
            </span>
          </div>
          <ul className="mt-2.5 flex flex-col gap-1">
            {group.items.map((row) => {
              const active = row.ref === selected?.ref;
              return (
                <li key={row.ref} className="min-w-0">
                  <button
                    type="button"
                    onClick={() => selectQuestion(row.ref)}
                    aria-current={active ? "true" : undefined}
                    className={cn(
                      "group relative flex w-full min-w-0 items-start gap-2.5 rounded-xl py-2 pl-3 pr-2.5 text-left transition duration-150",
                      active
                        ? "bg-teal-soft/80 text-ink ring-1 ring-teal/20"
                        : "text-muted hover:bg-shell/80 hover:text-ink",
                    )}
                  >
                    <span
                      className={cn(
                        "absolute inset-y-1.5 left-0 w-1 rounded-full transition",
                        active ? "bg-teal" : "bg-transparent group-hover:bg-line",
                      )}
                      aria-hidden="true"
                    />
                    <span
                      className={cn(
                        "mt-px w-8 shrink-0 text-xs font-semibold tabular-nums",
                        active ? "text-teal-deep" : "text-teal",
                      )}
                    >
                      {row.ref}
                    </span>
                    <span
                      className={cn(
                        "min-w-0 flex-1 whitespace-normal break-words text-[0.8125rem] leading-snug",
                        active && "font-medium",
                      )}
                    >
                      {row.question}
                    </span>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <StatusDot status={row.status} />
                      {row.remarks.trim() || row.actionPlan.trim() ? (
                        <span
                          className="h-1.5 w-1.5 rounded-full bg-brass"
                          title="Has remarks or action plan"
                          aria-hidden
                        />
                      ) : null}
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
      {filtered.length === 0 ? <p className="px-2 text-sm text-muted">Nothing matches this filter.</p> : null}
    </div>
  );

  const sectionPercent = rows.length ? Math.round((answered / rows.length) * 100) : 0;

  return (
    <div className="grid gap-6">
      {readOnly ? (
        <p className="rounded-2xl border border-brass/30 bg-brass-soft/60 px-4 py-3 text-sm text-ink">
          {viewer === "admin" ? (
            <>
              You are reviewing this client&apos;s submitted answers. Editing is disabled on the admin account.
            </>
          ) : (
            <>
              This assessment is <strong>published</strong> and locked.{" "}
              <Link className="font-semibold text-teal hover:underline" href="/assessment/publish">
                Unpublish
              </Link>{" "}
              to edit answers or evidence.
            </>
          )}
        </p>
      ) : null}
      <header className="surface-hero">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            <p className="text-eyebrow">Section {sectionId}</p>
            <h1 className="mt-2 max-w-3xl font-serif text-3xl leading-tight sm:text-4xl">{official}</h1>
            <p className="mt-3 text-sm text-muted">
              {answered} of {rows.length} answered · <span className="font-semibold text-teal">{sectionPercent}%</span>
            </p>
          </div>
          <Link className="text-sm font-semibold text-teal hover:underline" href={documentsHref}>
            All documents →
          </Link>
        </div>
        <div className="mt-5 h-2 overflow-hidden rounded-full bg-line/80">
          <div className="h-full rounded-full bg-gradient-to-r from-teal to-teal-muted" style={{ width: `${sectionPercent}%` }} />
        </div>
      </header>
      <div className="flex flex-wrap gap-2 rounded-2xl border border-line/70 bg-white/80 p-2 shadow-sm">
        {FILTERS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setFilter(item.id)}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-sm font-medium transition",
              filter === item.id ? "bg-teal text-raised shadow-sm" : "text-muted hover:bg-teal-soft/50 hover:text-ink",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="grid items-stretch gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <details className="group rounded-2xl border border-line/70 bg-white/70 p-4 shadow-sm xl:hidden">
          <summary className="flex cursor-pointer items-center justify-between gap-2 text-sm font-semibold text-ink">
            <span>Browse questions</span>
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4 text-muted transition-transform group-open:rotate-180"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </summary>
          <div className="mt-4 max-h-[60vh] overflow-auto pr-1">{navigation}</div>
        </details>
        <aside className="surface-card relative hidden min-h-0 overflow-hidden xl:block">
          <div className="absolute inset-0 overflow-y-auto overscroll-contain p-4">{navigation}</div>
        </aside>
        {selected ? (
          <article className="surface-card p-6 sm:p-8">
            <p className="text-sm text-brass">
              {selected.categoryCode} · {selected.categoryName}
            </p>
            <h2 className="mt-3 font-serif text-3xl leading-snug">
              <span className="mr-3 text-teal">{selected.ref}</span>
              {selected.question}
            </h2>
            <div
              className="mt-6 flex flex-wrap gap-1 border-b border-line/80 pb-0"
              role="tablist"
              aria-label="Question details"
            >
              {DETAIL_TABS.map((tab) => {
                const active = detailTab === tab.id;
                const hasDraft =
                  tab.id === "remarks"
                    ? Boolean(selected.remarks.trim())
                    : tab.id === "action-plan"
                      ? Boolean(selected.actionPlan.trim())
                      : false;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setDetailTab(tab.id)}
                    className={cn(
                      "relative rounded-t-xl px-3 py-2.5 text-sm font-semibold transition",
                      active
                        ? "bg-teal-soft/80 text-teal-deep after:absolute after:inset-x-2 after:bottom-0 after:h-0.5 after:rounded-full after:bg-teal"
                        : "text-muted hover:bg-shell/80 hover:text-ink",
                    )}
                  >
                    {tab.label}
                    {hasDraft ? (
                      <span className="ml-1.5 inline-block h-1.5 w-1.5 rounded-full bg-brass align-middle" aria-hidden />
                    ) : null}
                  </button>
                );
              })}
            </div>
            {detailTab === "reporting" ? (
              <>
                <div className="mt-8" role="radiogroup" aria-label="Status">
                  <p className="text-sm font-medium">Status</p>
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    {(["YES", "NO", "NA"] as const).map((status) => (
                      <button
                        key={status}
                        type="button"
                        role="radio"
                        aria-checked={selected.status === status}
                        disabled={readOnly}
                        onClick={() =>
                          updateRow(
                            selected.ref,
                            { status: selected.status === status ? null : status },
                            true,
                          )
                        }
                        className={cn(
                          "rounded-2xl border px-3 py-3 text-sm font-medium",
                          selected.status === status
                            ? status === "YES"
                              ? "border-ok bg-ok text-white"
                              : status === "NO"
                                ? "border-danger bg-danger text-white"
                                : "border-ink bg-ink text-raised"
                            : "border-line bg-white",
                          readOnly ? "cursor-default" : "hover:border-teal",
                        )}
                      >
                        {STATUS_LABELS[status]}
                      </button>
                    ))}
                  </div>
                  {readOnly ? null : <p className="mt-2 text-xs text-muted">Choose again to clear the answer.</p>}
                </div>
                <label className="mt-8 block">
                  <span className="text-sm font-medium">Reporting summary</span>
                  <span className="mt-1 block text-sm text-muted">
                    {readOnly
                      ? "Notes the client wrote for the assignment report."
                      : "Summarise what you do and provide examples. This text appears on your assignment report."}
                  </span>
                  <textarea
                    className={cn(
                      "mt-3 min-h-32 w-full rounded-2xl border border-line px-4 py-3 outline-none",
                      readOnly ? "cursor-default bg-paper text-ink" : "bg-white focus:border-teal focus:ring-4 focus:ring-teal/15",
                    )}
                    value={selected.notes}
                    readOnly={readOnly}
                    onChange={(event) => updateRow(selected.ref, { notes: event.target.value }, false)}
                    placeholder={readOnly ? "No summary written yet." : undefined}
                  />
                </label>
                <div className="mt-8">
                  <p className="text-sm font-medium">Supporting evidence</p>
                  <p className="mt-1 text-sm text-muted">
                    {readOnly
                      ? selected.evidence.length === 0
                        ? "No files were attached to this question."
                        : "Files the client attached to this question."
                      : "PDF, DOC, DOCX, or images. Up to 15 MB each. You can add more than one."}
                  </p>
                  {readOnly ? null : (
                    <label
                      className="mt-3 grid cursor-pointer place-items-center rounded-2xl border border-dashed border-teal/40 bg-teal-soft/50 px-4 py-8 text-center text-sm text-teal"
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={(event) => {
                        event.preventDefault();
                        const files = Array.from(event.dataTransfer.files);
                        void sendFiles(selected.ref, files);
                      }}
                    >
                      <input
                        className="sr-only"
                        type="file"
                        multiple
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp"
                        onChange={(event) => {
                          const files = Array.from(event.target.files ?? []);
                          event.target.value = "";
                          void sendFiles(selected.ref, files);
                        }}
                      />
                      {uploading ? "Uploading…" : "Drop files here, or click to browse"}
                    </label>
                  )}
                  {uploadError ? <p className="mt-2 text-sm text-danger">{uploadError}</p> : null}
                  <ul className="mt-4 grid gap-2">
                    {selected.evidence.map((file) => (
                      <li key={file.id} className="flex items-center gap-3 rounded-2xl border border-line bg-white px-3 py-2">
                        {file.mimeType.startsWith("image/") ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={`/api/files/evidence/${file.id}`} alt="" className="h-12 w-12 rounded-lg object-cover" />
                        ) : (
                          <span className="grid h-12 w-12 place-items-center rounded-lg bg-teal-soft text-xs font-medium text-teal">
                            {file.originalName.split(".").pop()?.toUpperCase()}
                          </span>
                        )}
                        <span className="min-w-0 flex-1">
                          <a
                            className="block truncate text-sm font-medium hover:text-teal"
                            href={`/api/files/evidence/${file.id}?download=1`}
                          >
                            {file.originalName}
                          </a>
                          <span className="text-xs text-muted">{formatBytes(file.size)}</span>
                        </span>
                        {readOnly ? null : (
                          <button
                            type="button"
                            className="text-sm text-danger"
                            onClick={async () => {
                              const result = await deleteEvidence(file.id);
                              if (!result.ok) {
                                setUploadError(result.error);
                                return;
                              }
                              setRows((existing) =>
                                existing.map((row) =>
                                  row.ref === selected.ref
                                    ? { ...row, evidence: row.evidence.filter((item) => item.id !== file.id) }
                                    : row,
                                ),
                              );
                            }}
                          >
                            Remove
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            ) : null}
            {detailTab === "guidance" ? (
              <CoachPanel title="How to meet this criterion" body={selected.guidance} />
            ) : null}
            {detailTab === "remarks" ? (
              <label className="mt-8 block">
                <span className="text-sm font-medium">Internal remarks</span>
                <span className="mt-1 block text-sm text-muted">
                  {readOnly
                    ? "Coach or client notes captured on this criterion."
                    : "Coach questions, audit follow-ups, or team notes. Not shown on the public assignment report unless you export the remarks report."}
                </span>
                <textarea
                  className={cn(
                    "mt-3 min-h-40 w-full rounded-2xl border border-line px-4 py-3 outline-none",
                    readOnly ? "cursor-default bg-paper" : "bg-white focus:border-teal focus:ring-4 focus:ring-teal/15",
                  )}
                  value={selected.remarks}
                  readOnly={readOnly}
                  onChange={(event) => updateRow(selected.ref, { remarks: event.target.value }, false)}
                  placeholder={readOnly ? "No remarks recorded." : "e.g. Need updated policy signed by GM; verify with HR file."}
                />
              </label>
            ) : null}
            {detailTab === "action-plan" ? (
              <label className="mt-8 block">
                <span className="text-sm font-medium">Action plan</span>
                <span className="mt-1 block text-sm text-muted">
                  {readOnly
                    ? "Steps the client recorded to close a gap."
                    : "List concrete steps, owners, and dates — especially when the answer is No or evidence is still missing."}
                </span>
                <textarea
                  className={cn(
                    "mt-3 min-h-40 w-full rounded-2xl border border-line px-4 py-3 outline-none",
                    readOnly ? "cursor-default bg-paper" : "bg-white focus:border-teal focus:ring-4 focus:ring-teal/15",
                  )}
                  value={selected.actionPlan}
                  readOnly={readOnly}
                  onChange={(event) => updateRow(selected.ref, { actionPlan: event.target.value }, false)}
                  placeholder={
                    readOnly
                      ? "No action plan recorded."
                      : "e.g. Q1: Draft supplier code · Owner: F&B manager · Evidence: signed vendor list."
                  }
                />
              </label>
            ) : null}
            {detailTab === "best-practices" ? (
              <CoachPanel title="Examples from high-performing properties" body={selected.bestPractices} />
            ) : null}
            <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
              <Button
                type="button"
                variant="secondary"
                disabled={selectedIndex <= 0}
                onClick={() => filtered[selectedIndex - 1] && selectQuestion(filtered[selectedIndex - 1].ref)}
              >
                Previous
              </Button>
              <p className="text-sm text-muted" aria-live="polite">
                {readOnly
                  ? "Read-only"
                  : saveState === "saving"
                    ? "Saving…"
                    : saveState === "saved"
                      ? "Saved"
                      : saveState === "error"
                        ? "Could not save. Try again."
                        : "Answers save as you go"}
              </p>
              <Button
                type="button"
                variant="secondary"
                disabled={selectedIndex < 0 || selectedIndex >= filtered.length - 1}
                onClick={() => filtered[selectedIndex + 1] && selectQuestion(filtered[selectedIndex + 1].ref)}
              >
                Next
              </Button>
            </div>
          </article>
        ) : (
          <article className="rounded-3xl border border-line bg-raised p-8 text-muted">
            No questions match this filter. Choose another view to continue.
          </article>
        )}
      </div>
    </div>
  );

  async function sendFiles(ref: string, files: File[]) {
    if (readOnly) return;
    if (files.length === 0) return;
    setUploading(true);
    setUploadError(null);
    const formData = new FormData();
    formData.set("ref", ref);
    for (const file of files) formData.append("files", file);
    const result = await uploadEvidence(formData);
    setUploading(false);
    if (!result.ok) {
      setUploadError(result.error);
      return;
    }
    if (result.warning) setUploadError(result.warning);
    const uploaded = result.data ?? [];
    setRows((existing) =>
      existing.map((row) => (row.ref === ref ? { ...row, evidence: [...row.evidence, ...uploaded] } : row)),
    );
  }
}

function CoachPanel({ title, body }: { title: string; body: string }) {
  return (
    <div className="mt-8 rounded-2xl border border-line/80 bg-paper/60 px-5 py-5">
      <p className="text-sm font-semibold text-teal-deep">{title}</p>
      <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-ink">{body}</p>
    </div>
  );
}

function StatusDot({ status }: { status: AnswerStatus | null }) {
  if (!status) {
    return <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full border border-line/80" aria-hidden />;
  }
  const color = status === "YES" ? "bg-ok" : status === "NO" ? "bg-danger" : "bg-brass";
  return <span className={cn("mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full shadow-sm ring-2 ring-white", color)} aria-hidden />;
}

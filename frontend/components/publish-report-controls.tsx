"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { publishAssessmentReport, unpublishAssessmentReport } from "@/backend/actions/report-publish";
import { Button } from "./ui";

export function PublishReportControls({ published, publishedLabel }: { published: boolean; publishedLabel: string | null }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [tone, setTone] = useState<"ok" | "error">("ok");

  async function publish() {
    setPending(true);
    setMessage(null);
    const result = await publishAssessmentReport();
    setPending(false);
    if (!result.ok) {
      setTone("error");
      setMessage(result.error ?? "Could not publish.");
      return;
    }
    setTone("ok");
    setMessage("Report published. Answers are locked. Open Share report to copy the link.");
    router.refresh();
  }

  async function unpublish() {
    if (!window.confirm("Unpublish and allow editing answers again? The share link will stop working until you publish again.")) {
      return;
    }
    setPending(true);
    setMessage(null);
    const result = await unpublishAssessmentReport();
    setPending(false);
    if (!result.ok) {
      setTone("error");
      setMessage(result.error ?? "Could not unpublish.");
      return;
    }
    setTone("ok");
    setMessage("Report unpublished. You can edit the assessment again.");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      {published && publishedLabel ? (
        <p className="text-sm text-muted">
          Published on <strong className="text-ink">{publishedLabel}</strong>. Assessment answers and evidence are locked.
        </p>
      ) : (
        <p className="text-sm text-muted">
          Publishing freezes your answers and evidence so external reviewers see a fixed snapshot. You can unpublish later
          to make changes.
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        {published ? (
          <Button type="button" variant="secondary" disabled={pending} onClick={() => void unpublish()}>
            {pending ? "Working…" : "Unpublish & allow edits"}
          </Button>
        ) : (
          <Button type="button" disabled={pending} onClick={() => void publish()}>
            {pending ? "Publishing…" : "Publish report"}
          </Button>
        )}
        {published ? (
          <Link
            href="/assessment/share"
            className="rounded-full border border-teal/30 bg-teal-soft/50 px-5 py-2.5 text-sm font-semibold text-teal-deep transition hover:bg-teal-soft"
          >
            Share report
          </Link>
        ) : null}
      </div>

      {message ? (
        <p className={tone === "ok" ? "text-sm text-ok" : "text-sm text-danger"} role="status">{message}</p>
      ) : null}
    </div>
  );
}

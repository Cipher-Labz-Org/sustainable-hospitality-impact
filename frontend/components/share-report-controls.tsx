"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { rotateShareLink } from "@/backend/actions/report-publish";
import { Button } from "./ui";

export function ShareReportControls({
  published,
  shareUrl,
}: {
  published: boolean;
  shareUrl: string | null;
}) {
  const router = useRouter();
  const [url, setUrl] = useState(shareUrl ?? "");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [tone, setTone] = useState<"ok" | "error">("ok");

  async function copyLink() {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setTone("ok");
      setMessage("Link copied to clipboard.");
    } catch {
      setTone("error");
      setMessage("Could not copy. Select the link and copy manually.");
    }
  }

  async function rotate() {
    if (!window.confirm("Create a new link? The old link will stop working.")) return;
    setPending(true);
    setMessage(null);
    const result = await rotateShareLink();
    setPending(false);
    if (!result.ok) {
      setTone("error");
      setMessage(result.error ?? "Could not rotate link.");
      return;
    }
    if (!result.data?.shareUrl) {
      setTone("error");
      setMessage("Could not rotate link.");
      return;
    }
    setUrl(result.data.shareUrl);
    setTone("ok");
    setMessage("New share link created. Share the updated URL.");
    router.refresh();
  }

  if (!published) {
    return (
      <div className="grid gap-4">
        <p className="text-sm text-muted">
          Publish your report first. Then a read-only link will appear here for coaches, auditors, or partners.
        </p>
        <Link
          href="/assessment/publish"
          className="inline-flex w-fit rounded-full bg-teal px-5 py-2.5 text-sm font-semibold text-raised transition hover:bg-teal-deep"
        >
          Go to Publish report
        </Link>
        <input
          readOnly
          disabled
          value="Share link will appear after you publish a report"
          className="min-w-[12rem] flex-1 rounded-lg border border-line bg-paper px-3 py-2.5 text-sm text-muted"
        />
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      <p className="text-sm text-muted">
        Anyone with this link can view a read-only snapshot. They cannot sign in or change your data.
      </p>
      <div className="flex flex-wrap gap-2">
        <input
          readOnly
          value={url}
          className="min-w-[12rem] flex-1 rounded-lg border border-line bg-white px-3 py-2.5 text-sm text-ink"
          aria-label="Share link"
        />
        <Button type="button" variant="secondary" disabled={!url} onClick={() => void copyLink()}>
          Copy link
        </Button>
        <Button type="button" variant="secondary" disabled={pending} onClick={() => void rotate()}>
          {pending ? "…" : "New link"}
        </Button>
      </div>
      {url ? (
        <p className="text-sm">
          <a className="font-semibold text-teal hover:underline" href={url} target="_blank" rel="noopener noreferrer">
            Open shared view
          </a>
        </p>
      ) : null}
      {message ? (
        <p className={tone === "ok" ? "text-sm text-ok" : "text-sm text-danger"} role="status">{message}</p>
      ) : null}
    </div>
  );
}

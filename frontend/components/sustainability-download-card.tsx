"use client";

import { useState } from "react";

export function SustainabilityDownloadCard() {
  const [message, setMessage] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="font-medium text-ink">Full sustainability report</p>
        <p className="mt-1 text-sm leading-relaxed text-muted">
          Criteria, evidence list, and overview in one document. Uses your report settings below.
        </p>
        {message ? <p className="mt-2 text-sm text-muted">{message}</p> : null}
      </div>
      <button
        type="button"
        title="Download PDF (coming soon)"
        onClick={() => setMessage("PDF download will be available in a future update.")}
        className="group flex shrink-0 flex-col items-center gap-1 self-start sm:self-center"
      >
        <span
          className="grid h-12 w-12 place-items-center rounded-xl bg-[#b83232] text-[10px] font-bold tracking-wide text-white shadow-md transition group-hover:bg-[#9c2a2a] group-active:scale-95"
        >
          PDF
        </span>
        <span className="text-[11px] font-medium text-muted group-hover:text-teal">Download</span>
      </button>
    </div>
  );
}

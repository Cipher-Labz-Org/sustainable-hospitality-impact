"use client";

export function DownloadButtons({
  query,
  compact,
  organizationId,
}: {
  query: string;
  compact?: boolean;
  organizationId?: string;
}) {
  const extra = organizationId ? `organizationId=${encodeURIComponent(organizationId)}` : "";
  const joined = [query, extra].filter(Boolean).join("&");
  const pdfUrl = `/api/assessment/report?format=pdf${joined ? `&${joined}` : ""}`;
  const csvUrl = `/api/assessment/report?format=csv${joined ? `&${joined}` : ""}`;
  const base = compact
    ? "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold"
    : "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold";
  return (
    <div className="relative z-10 flex shrink-0 flex-wrap items-center gap-2">
      <a
        href={pdfUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={`${base} bg-teal text-raised shadow-sm transition hover:bg-teal-deep`}
      >
        PDF
      </a>
      <a className={`${base} border border-teal/25 bg-teal-soft/50 text-teal transition hover:bg-teal-soft`} href={csvUrl}>
        CSV
      </a>
    </div>
  );
}

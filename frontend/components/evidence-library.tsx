"use client";

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { deleteEvidence } from "@/backend/actions/assessment";
import type { LibraryItem } from "@/backend/lib/assessment-types";
import { SECTIONS } from "@/backend/lib/sections";
import { formatBytes } from "@/frontend/lib/format";
import { BackLink, cn } from "./ui";

export function EvidenceLibrary({
  items,
  readOnly = false,
  questionBasePath = "/assessment",
  backHref = "/assessment",
}: {
  items: LibraryItem[];
  readOnly?: boolean;
  questionBasePath?: string;
  backHref?: string;
}) {
  const [files, setFiles] = useState(items);
  const [section, setSection] = useState("all");
  const [error, setError] = useState<string | null>(null);
  const visible = useMemo(
    () => (section === "all" ? files : files.filter((file) => file.section === section)),
    [files, section],
  );

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap gap-2">
        <FilterButton active={section === "all"} onClick={() => setSection("all")}>
          All sections
        </FilterButton>
        {SECTIONS.map((item) => (
          <FilterButton key={item.id} active={section === item.id} onClick={() => setSection(item.id)}>
            Section {item.id}
          </FilterButton>
        ))}
      </div>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      {visible.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-line bg-raised px-6 py-16 text-center">
          <p className="font-serif text-2xl">No evidence in this view</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted">
            Files you attach to a question appear here, so you can find them without opening each criterion.
          </p>
          <BackLink className="mt-6" href={backHref}>
            Back to assessment
          </BackLink>
        </div>
      ) : (
        <ul className="grid gap-3">
          {visible.map((file) => (
            <li key={file.id} className="flex flex-wrap items-center gap-4 rounded-3xl border border-line bg-raised px-4 py-3">
              {file.mimeType.startsWith("image/") ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={`/api/files/evidence/${file.id}`} alt="" className="h-14 w-14 rounded-xl object-cover" />
              ) : (
                <span className="grid h-14 w-14 place-items-center rounded-xl bg-teal-soft text-xs font-medium text-teal">
                  {file.originalName.split(".").pop()?.toUpperCase()}
                </span>
              )}
              <div className="min-w-0 flex-1">
                <a className="block truncate font-medium hover:text-teal" href={`/api/files/evidence/${file.id}?download=1`}>
                  {file.originalName}
                </a>
                <p className="truncate text-sm text-muted">
                  {file.ref} · {file.question}
                </p>
                <p className="text-xs text-muted">{formatBytes(file.size)}</p>
              </div>
              <Link className="text-sm text-teal" href={`${questionBasePath}/${file.section}?ref=${encodeURIComponent(file.ref)}`}>
                Open question
              </Link>
              {readOnly ? null : (
                <button
                  type="button"
                  className="text-sm text-danger"
                  onClick={async () => {
                    const result = await deleteEvidence(file.id);
                    if (!result.ok) {
                      setError(result.error);
                      return;
                    }
                    setFiles((current) => current.filter((item) => item.id !== file.id));
                  }}
                >
                  Remove
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function FilterButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn("rounded-full px-3 py-1.5 text-sm", active ? "bg-ink text-raised" : "bg-white text-muted")}
    >
      {children}
    </button>
  );
}

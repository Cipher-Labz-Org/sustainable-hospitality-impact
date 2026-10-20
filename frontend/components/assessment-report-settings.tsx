"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ReportSelect } from "./report-select";
import { cn } from "./ui";

type SettingId =
  | "section0"
  | "explanations"
  | "criteriaDescription"
  | "reportContains"
  | "orientation"
  | "attachments";

type SettingsState = Record<SettingId, string>;

const DEFAULTS: SettingsState = {
  section0: "yes",
  explanations: "yes",
  criteriaDescription: "yes",
  reportContains: "all criteria",
  orientation: "Portrait",
  attachments: "yes",
};

const ROWS: {
  id: SettingId;
  label: string;
  hint?: string;
  options: { value: string; label: string }[];
}[] = [
  {
    id: "section0",
    label: "Show section 0 in the report",
    options: [{ value: "yes", label: "Yes" }, { value: "no", label: "No" }],
  },
  {
    id: "explanations",
    label: "Show explanation indicators",
    options: [{ value: "yes", label: "Yes" }, { value: "no", label: "No" }],
  },
  {
    id: "criteriaDescription",
    label: "Include criteria description in report",
    options: [{ value: "yes", label: "Yes" }, { value: "no", label: "No" }],
  },
  {
    id: "reportContains",
    label: "Report should contain",
    options: [
      { value: "all criteria", label: "All criteria" },
      { value: "answered only", label: "Answered only" },
      { value: "gaps only", label: "Gaps only" },
    ],
  },
  {
    id: "orientation",
    label: "Page orientation for overview",
    options: [
      { value: "Portrait", label: "Portrait" },
      { value: "Landscape", label: "Landscape" },
    ],
  },
  {
    id: "attachments",
    label: "List attachments",
    options: [{ value: "yes", label: "Yes" }, { value: "no", label: "No" }],
  },
];

function storageKey(organizationId: string) {
  return `gstc-sustainability-report-settings:${organizationId}`;
}

function titleStorageKey(organizationId: string) {
  return `gstc-sustainability-report-title:${organizationId}`;
}

function readStored(organizationId: string): SettingsState | null {
  try {
    const raw = localStorage.getItem(storageKey(organizationId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<SettingsState>;
    return { ...DEFAULTS, ...parsed };
  } catch {
    return null;
  }
}

export function AssessmentReportSettingsTable({ organizationId }: { organizationId: string }) {
  const [settings, setSettings] = useState<SettingsState>(DEFAULTS);
  const [hydrated, setHydrated] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const skipNextSaveIndicator = useRef(true);

  useEffect(() => {
    const stored = readStored(organizationId);
    if (stored) setSettings(stored);
    setHydrated(true);
    skipNextSaveIndicator.current = true;
  }, [organizationId]);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(storageKey(organizationId), JSON.stringify(settings));
    if (skipNextSaveIndicator.current) {
      skipNextSaveIndicator.current = false;
      return;
    }
    setSavedFlash(true);
    const timer = window.setTimeout(() => setSavedFlash(false), 2000);
    return () => window.clearTimeout(timer);
  }, [settings, hydrated, organizationId]);

  function update(id: SettingId, value: string) {
    setSettings((prev) => ({ ...prev, [id]: value }));
  }

  const changedFromDefault = useMemo(
    () => JSON.stringify(settings) !== JSON.stringify(DEFAULTS),
    [settings],
  );

  return (
    <div className="bg-white">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line/70 px-5 py-3">
        <p className="text-xs font-medium tracking-wide text-muted uppercase">Configuration</p>
        {hydrated && (savedFlash || changedFromDefault) ? (
          <span
            className={cn(
              "rounded-full px-2.5 py-0.5 text-[11px] font-semibold transition",
              savedFlash ? "bg-ok/15 text-ok" : "bg-teal-soft text-teal",
            )}
          >
            {savedFlash ? "Saved" : "Customized"}
          </span>
        ) : null}
      </div>

      <ul className="divide-y divide-line/60">
        {ROWS.map((row, index) => (
          <li
            key={row.id}
            className={cn(
              "flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-8",
              index % 2 === 0 ? "bg-raised/30" : "bg-white",
            )}
          >
            <div className="min-w-0 flex-1">
              <label htmlFor={`report-setting-${row.id}`} className="block cursor-pointer text-sm font-medium text-ink">
                {row.label}
              </label>
              {row.hint ? <p className="mt-0.5 text-xs text-muted">{row.hint}</p> : null}
            </div>
            <ReportSelect
              id={`report-setting-${row.id}`}
              value={settings[row.id]}
              options={row.options}
              onChange={(value) => update(row.id, value)}
            />
          </li>
        ))}
      </ul>

      <div className="border-t border-line/70 bg-paper/40 px-5 py-4">
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-full border border-teal/25 bg-teal-soft/60 px-4 py-2 text-sm font-semibold text-teal transition hover:bg-teal-soft"
          onClick={() => {
            setSettings(DEFAULTS);
          }}
        >
          Reset to defaults
        </button>
        <p className="mt-3 text-sm">
          <button type="button" className="font-semibold text-teal hover:underline">
            Download simple report
          </button>
          <span className="text-muted"> — PDF export coming soon</span>
        </p>
      </div>
    </div>
  );
}

export function SustainabilityReportTitle({ organizationId, defaultTitle }: { organizationId: string; defaultTitle: string }) {
  const [title, setTitle] = useState(defaultTitle);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(titleStorageKey(organizationId));
    if (stored) setTitle(stored);
    else setTitle(defaultTitle);
    setHydrated(true);
  }, [organizationId, defaultTitle]);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(titleStorageKey(organizationId), title);
  }, [title, hydrated, organizationId]);

  return (
    <div className="grid gap-3">
      <label htmlFor="sustainability-report-title" className="text-sm font-medium text-ink">
        Report title
      </label>
      <input
        id="sustainability-report-title"
        type="text"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        className="w-full max-w-xl rounded-xl border border-line bg-white px-3.5 py-2.5 text-ink shadow-sm outline-none transition focus:border-teal focus:ring-4 focus:ring-teal/15"
        placeholder="e.g. GSTC Sustainability Report 2026"
      />
      <p className="text-xs text-muted">Shown on the cover page when PDF export is available.</p>
    </div>
  );
}

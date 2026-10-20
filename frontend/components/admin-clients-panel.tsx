import Link from "next/link";
import { formatDisplayDate } from "@/frontend/lib/format-date";
import { btnPrimary, btnSecondary, cn } from "./ui";

export type AdminClientRow = {
  id: string;
  email: string;
  organizationName: string;
  country: string;
  createdAt: string;
  lastActivityAt: string | null;
  answered: number;
  total: number;
  percent: number;
  yesCount: number;
  noCount: number;
  evidenceCount: number;
  published: boolean;
};

function ProgressBar({ percent }: { percent: number }) {
  return (
    <div className="flex min-w-[8rem] items-center gap-2">
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-line/80">
        <div className="h-full rounded-full bg-gradient-to-r from-teal to-teal-muted" style={{ width: `${percent}%` }} />
      </div>
      <span className="w-10 text-right text-xs font-semibold tabular-nums text-teal">{percent}%</span>
    </div>
  );
}

export function AdminClientsPanel({ clients }: { clients: AdminClientRow[] }) {
  if (clients.length === 0) {
    return (
      <section className="surface-card p-8 text-center">
        <p className="font-serif text-2xl text-ink">No client assessments yet</p>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted">
          Add a client under Client sign-in. After they fill the GSTC assessment, their answers and reports appear here.
        </p>
        <Link href="/admin/users" className={cn(btnPrimary, "mt-6")}>
          Add client sign-in
        </Link>
      </section>
    );
  }

  return (
    <section className="surface-card">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-line/60 px-5 py-4 sm:px-7">
        <div>
          <h2 className="font-serif text-xl text-ink">Submitted assessments</h2>
          <p className="mt-1 text-sm text-muted">Open a client to review answers, evidence, remarks, and downloadable reports.</p>
        </div>
        <span className="rounded-full bg-teal-soft px-3 py-1 text-xs font-semibold text-teal-deep">
          {clients.length} {clients.length === 1 ? "client" : "clients"}
        </span>
      </div>
      <ul className="flex flex-col gap-3 p-5 sm:p-7">
        {clients.map((client) => {
          const name = client.organizationName.trim() || client.email;
          return (
            <li
              key={client.id}
              className="flex flex-col gap-4 rounded-2xl border border-line/50 bg-gradient-to-br from-raised via-raised to-shell/40 p-4 shadow-sm sm:p-5"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <p className="text-[0.65rem] font-bold tracking-[0.12em] text-teal-muted uppercase">
                    {client.published ? "Published report" : "In progress"}
                  </p>
                  <p className="truncate font-medium text-ink">{name}</p>
                  <p className="mt-0.5 truncate text-xs text-muted">
                    {client.organizationName.trim() ? client.email : null}
                    {client.organizationName.trim() ? " · " : null}
                    {client.country.trim() ? `${client.country} · ` : null}
                    Added {formatDisplayDate(client.createdAt)}
                    {client.lastActivityAt ? ` · Last answer ${formatDisplayDate(client.lastActivityAt)}` : " · No answers yet"}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Link href={`/admin/clients/${client.id}`} className={cn(btnPrimary, "text-sm")}>
                    View assessment
                  </Link>
                  <Link href={`/admin/clients/${client.id}/overview`} className={cn(btnSecondary, "text-sm")}>
                    Download report
                  </Link>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_repeat(3,auto)] lg:items-center">
                <ProgressBar percent={client.percent} />
                <p className="text-xs text-muted">
                  <strong className="font-semibold text-ink">{client.answered}</strong> of {client.total} answered
                </p>
                <p className="text-xs text-muted">
                  Yes {client.yesCount} · No {client.noCount}
                </p>
                <p className="text-xs text-muted">{client.evidenceCount} evidence files</p>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

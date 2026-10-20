import type { ReactNode } from "react";
import { cn } from "./ui";

export function SpaceFormLayout({
  children,
  aside,
  className,
}: {
  children: ReactNode;
  aside?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid gap-6",
        aside ? "lg:grid-cols-[minmax(0,1fr)_minmax(0,15.5rem)] xl:grid-cols-[minmax(0,1fr)_17.5rem]" : "",
        className,
      )}
    >
      <div className="min-w-0">{children}</div>
      {aside ? (
        <aside className="surface-tips h-fit p-5 shadow-sm">
          {aside}
        </aside>
      ) : null}
    </div>
  );
}

export function SpaceTipsTitle({ children }: { children: ReactNode }) {
  return <p className="text-sm font-bold text-teal-deep">{children}</p>;
}

export function SpaceTipsList({ items }: { items: string[] }) {
  return (
    <ul className="mt-3 space-y-2.5 text-sm leading-relaxed text-muted">
      {items.map((item) => (
        <li key={item} className="flex gap-2">
          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-teal" aria-hidden="true" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

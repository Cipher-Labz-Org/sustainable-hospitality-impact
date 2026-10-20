import type { ReactNode } from "react";
import { cn } from "./ui";

export const contentPaddingClass = "mx-auto w-full px-4 sm:px-5 2xl:px-6";

/** Shared horizontal bounds for header + wide workspace pages */
export const contentWidthClass = "max-w-7xl 2xl:max-w-[90rem]";

export const contentContainerClass = cn(contentPaddingClass, contentWidthClass);

export function PageShell({
  children,
  className,
  width = "lg",
}: {
  children: ReactNode;
  className?: string;
  width?: "md" | "lg" | "xl" | "full";
}) {
  const max =
    width === "md"
      ? "max-w-lg"
      : width === "lg"
        ? "max-w-4xl"
        : contentWidthClass;
  return <main className={cn(contentPaddingClass, "py-12 sm:py-16", max, className)}>{children}</main>;
}

export function PageIntro({
  eyebrow,
  title,
  description,
  className,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  className?: string;
}) {
  return (
    <header className={cn("surface-hero mb-8 sm:mb-10", className)}>
      <p className="text-eyebrow">{eyebrow}</p>
      <h1 className="mt-3 font-serif text-4xl tracking-tight text-ink sm:text-[2.65rem] sm:leading-[1.1]">{title}</h1>
      {description ? <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-muted">{description}</p> : null}
    </header>
  );
}

import Image from "next/image";
import Link from "next/link";
import { cn } from "@/frontend/components/ui";

type GstcLogoProps = {
  className?: string;
  showAssessmentTag?: boolean;
  href?: string;
  priority?: boolean;
};

/** Official GSTC wordmark from brand asset (icon clipped off — no footprint). */
function GstcWordmark({ className, priority }: { className?: string; priority?: boolean }) {
  return (
    <span
      className={cn(
        "relative inline-block h-9 w-[6.65rem] shrink-0 overflow-hidden sm:h-10 sm:w-[7.35rem]",
        className,
      )}
    >
      <Image
        src="/gstc-logo.png"
        alt="GSTC"
        width={320}
        height={80}
        priority={priority}
        className="absolute right-0 top-0 h-full w-auto max-w-none"
      />
    </span>
  );
}

export function GstcLogo({
  className,
  showAssessmentTag = true,
  href = "/",
  priority = false,
}: GstcLogoProps) {
  const content = (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <GstcWordmark priority={priority} />
      {showAssessmentTag ? (
        <span className="hidden flex-col border-l border-line/80 pl-2.5 leading-tight sm:flex">
          <span className="text-[10px] font-bold tracking-[0.2em] text-teal uppercase">Assessment</span>
        </span>
      ) : null}
    </span>
  );

  if (href) {
    return (
      <Link href={href} className="group block shrink-0 rounded-lg outline-offset-4 transition-opacity hover:opacity-90">
        {content}
      </Link>
    );
  }

  return content;
}

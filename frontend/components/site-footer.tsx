import Link from "next/link";
import { CipherLabzCredit } from "@/frontend/components/cipher-labz-credit";
import { contentContainerClass } from "@/frontend/components/page-shell";
import { cn } from "@/frontend/components/ui";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/space", label: "My Space" },
  { href: "/assessment", label: "Assessment & reporting" },
] as const;

export function SiteFooter({ className }: { className?: string }) {
  const year = new Date().getFullYear();

  return (
    <footer
      className={cn(
        "relative mt-20 overflow-hidden border-t border-teal-deep/50 bg-gradient-to-br from-[#021817] via-[#052724] to-[#0a413d] text-raised sm:mt-24",
        className,
      )}
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_75%_70%_at_25%_0%,rgba(255,255,255,0.08),transparent_60%)]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_55%_45%_at_100%_100%,rgba(166,123,69,0.12),transparent_55%)]"
        aria-hidden="true"
      />

      <div className={cn(contentContainerClass, "relative py-10 sm:py-12")}>
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start lg:gap-16">
          <div className="max-w-2xl">
            <p className="font-serif text-xl leading-snug tracking-tight sm:text-2xl lg:text-[1.65rem]">
              Your journey to sustainability starts here.
            </p>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-teal-soft/75 sm:text-[0.9375rem]">
              Seamlessly manage your organization&apos;s commitment to global sustainability standards, with all your data and reports in one secure place.
            </p>
          </div>

          <nav aria-label="Footer" className="lg:pt-1 lg:text-right">
            <p className="text-xs font-semibold tracking-[0.16em] text-brass-soft/90 uppercase">Quick Links</p>
            <ul className="mt-3 flex flex-col gap-1.5 lg:items-end">
              {LINKS.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm font-medium text-raised/90 underline-offset-4 transition hover:text-white hover:underline"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-12 border-t border-white/12 pt-8 sm:mt-14 sm:pt-9">
          <div className="flex flex-col gap-8 sm:flex-row sm:items-center sm:justify-between sm:gap-12">
            <div className="space-y-2.5 text-xs leading-relaxed text-raised/60">
              <p>© {year} Global Sustainable Tourism Council · Assessment workspace</p>
              <p className="max-w-3xl text-raised/50">
                A private workspace for internal use. Auditor review and gap analysis are not part of this version.
              </p>
            </div>
            <CipherLabzCredit />
          </div>
        </div>
      </div>
    </footer>
  );
}

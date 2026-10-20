"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BrandForm, ContactForm, OrganizationForm, SecurityForm } from "./profile-forms";
import { cn } from "./ui";

const TABS = [
  {
    id: "organization",
    label: "Organization",
    title: "Organization",
    description: "Name, location, and the type of work you do",
  },
  {
    id: "contact",
    label: "Contact",
    title: "Contact person",
    description: "Who we can reach about this assessment",
  },
  {
    id: "security",
    label: "Security",
    title: "Password",
    description: "The email and password you use to sign in",
  },
  {
    id: "brand",
    label: "Logo",
    title: "Your logo",
    description: "Shown at the top of the site and on your reports",
  },
] as const;

function tabMeta(id: SpaceTabId) {
  return TABS.find((item) => item.id === id) ?? TABS[0];
}

export type SpaceTabId = (typeof TABS)[number]["id"];

function TabIcon({ id }: { id: SpaceTabId }) {
  const className = "h-[1.125rem] w-[1.125rem] shrink-0";
  if (id === "organization") {
    return (
      <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
        <path d="M4 20V8l8-4 8 4v12H4Z" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" />
      </svg>
    );
  }
  if (id === "contact") {
    return (
      <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
        <circle cx="12" cy="8" r="3.5" fill="none" stroke="currentColor" strokeWidth="1.75" />
        <path d="M5 20c0-3.5 3-6 7-6s7 2.5 7 6" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
      </svg>
    );
  }
  if (id === "security") {
    return (
      <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
        <rect x="5" y="11" width="14" height="10" rx="2" fill="none" stroke="currentColor" strokeWidth="1.75" />
        <path d="M8 11V8a4 4 0 1 1 8 0v3" fill="none" stroke="currentColor" strokeWidth="1.75" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <rect x="4" y="4" width="16" height="16" rx="3" fill="none" stroke="currentColor" strokeWidth="1.75" />
      <circle cx="9" cy="9" r="2" fill="none" stroke="currentColor" strokeWidth="1.75" />
      <path d="M4 16l4-4 3 3 5-6 4 4" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}

export function SpaceTabs({
  initialTab,
  canChangePassword = true,
  signInEmail,
  organization,
  contact,
  hasLogo,
  logoVersion,
}: {
  initialTab: SpaceTabId;
  canChangePassword?: boolean;
  /** Admin sign-in email shown on My Space → Security (not contact email). */
  signInEmail?: string;
  organization: {
    name: string;
    country: string;
    language: string;
    city: string;
    street: string;
    number: string;
    postcode: string;
    businessTypes: string[];
  };
  contact: { firstName: string; lastName: string; title: string; phone: string; email: string };
  hasLogo: boolean;
  logoVersion?: string;
}) {
  const visibleTabs = canChangePassword ? TABS : TABS.filter((item) => item.id !== "security");

  const router = useRouter();
  const searchParams = useSearchParams();
  const urlTab = searchParams.get("tab");
  const [tab, setTab] = useState<SpaceTabId>(initialTab);

  // The URL is the source of truth, so navigating via the nav links
  // ("My Space" → Organization, the profile menu → Contact) always opens the
  // right section — even on client-side navigation without a full reload.
  useEffect(() => {
    const next =
      urlTab && visibleTabs.some((item) => item.id === urlTab) ? (urlTab as SpaceTabId) : "organization";
    setTab(next);
  }, [urlTab, canChangePassword]);

  function selectTab(next: SpaceTabId) {
    setTab(next);
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", next);
    const query = params.toString();
    router.replace(query ? `/space?${query}` : "/space", { scroll: false });
  }

  const active = tabMeta(tab);

  return (
    <div className="surface-card">
      <div className="grid lg:grid-cols-[minmax(0,15.5rem)_minmax(0,1fr)]">
        <div
          className="surface-sidebar border-b border-line/50 p-2 sm:p-3 lg:border-b-0 lg:border-r lg:border-line/40 lg:p-4"
          role="tablist"
          aria-label="My Space sections"
        >
          <p className="mb-3 hidden px-2 text-[11px] font-bold tracking-wide text-brass uppercase lg:block">Settings</p>
          <ul className="flex gap-1 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] sm:gap-1.5 lg:flex-col lg:gap-1 lg:overflow-visible lg:pb-0 [&::-webkit-scrollbar]:hidden">
            {visibleTabs.map((item) => {
              const selected = tab === item.id;
              return (
                <li key={item.id} className="min-w-0 flex-1 lg:flex-none lg:shrink">
                  <button
                    type="button"
                    role="tab"
                    id={`space-tab-${item.id}`}
                    aria-selected={selected}
                    aria-controls={`space-panel-${item.id}`}
                    onClick={() => selectTab(item.id)}
                    className={cn(
                      "flex w-full min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1.5 py-2 text-center transition duration-200 sm:px-3 sm:py-2.5 lg:flex-row lg:items-start lg:justify-start lg:gap-3 lg:text-left",
                      selected
                        ? "tab-selected ring-2 ring-teal/20"
                        : "text-muted hover:bg-raised/95 hover:text-teal-deep hover:shadow-sm",
                    )}
                  >
                    <span
                      className={cn(
                        "grid h-7 w-7 shrink-0 place-items-center rounded-lg sm:h-8 sm:w-8 lg:mt-0.5",
                        selected ? "bg-white/25 text-raised" : "bg-raised/90 text-teal",
                      )}
                    >
                      <TabIcon id={item.id} />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[11px] font-semibold leading-tight sm:text-sm">{item.label}</span>
                      <span
                        className={cn(
                          "mt-0.5 hidden text-xs leading-snug lg:block",
                          selected ? "text-raised/85" : "text-muted",
                        )}
                      >
                        {item.description}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="surface-panel min-w-0 p-4 sm:p-7 lg:p-8">
          <header className="border-b border-teal/15 pb-5">
            <h2 className="font-serif text-2xl text-ink sm:text-[1.75rem]">{active.title}</h2>
            <p className="mt-1.5 text-sm text-muted">{active.description}</p>
          </header>

          <div className="pt-6">
            <div
              id="space-panel-organization"
              role="tabpanel"
              aria-labelledby="space-tab-organization"
              className={cn(tab !== "organization" && "hidden")}
            >
              <OrganizationForm initial={organization} />
            </div>
            <div
              id="space-panel-contact"
              role="tabpanel"
              aria-labelledby="space-tab-contact"
              className={cn(tab !== "contact" && "hidden")}
            >
              <ContactForm initial={contact} />
            </div>
            <div
              id="space-panel-security"
              role="tabpanel"
              aria-labelledby="space-tab-security"
              className={cn(tab !== "security" && "hidden")}
            >
              <SecurityForm signInEmail={signInEmail ?? ""} />
            </div>
            <div
              id="space-panel-brand"
              role="tabpanel"
              aria-labelledby="space-tab-brand"
              className={cn(tab !== "brand" && "hidden")}
            >
              <BrandForm hasLogo={hasLogo} logoVersion={logoVersion} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

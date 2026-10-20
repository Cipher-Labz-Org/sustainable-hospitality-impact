"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { COUNTRIES } from "@/backend/lib/options";
import { cn, fieldClass } from "./ui";

function countryList(saved: string) {
  if (saved && !COUNTRIES.includes(saved as (typeof COUNTRIES)[number])) {
    return [saved, ...COUNTRIES];
  }
  return [...COUNTRIES];
}

export function CountrySelect({
  name,
  defaultValue = "",
  className,
}: {
  name: string;
  defaultValue?: string;
  className?: string;
}) {
  const inputId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [value, setValue] = useState(defaultValue);
  const [query, setQuery] = useState(defaultValue);
  const [open, setOpen] = useState(false);

  const allCountries = useMemo(() => countryList(defaultValue), [defaultValue]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allCountries;
    return allCountries.filter((country) => country.toLowerCase().includes(q));
  }, [allCountries, query]);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  function pick(country: string) {
    setValue(country);
    setQuery(country);
    setOpen(false);
  }

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <input type="hidden" name={name} value={value} />
      <input
        id={inputId}
        className={fieldClass}
        role="combobox"
        aria-expanded={open}
        aria-controls={`${inputId}-list`}
        aria-autocomplete="list"
        autoComplete="off"
        placeholder="Select country"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setValue(event.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
      />
      {open && filtered.length > 0 ? (
        <ul
          id={`${inputId}-list`}
          role="listbox"
          className="absolute top-full z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-xl border border-line/90 bg-raised py-1 shadow-[var(--shadow-float)]"
        >
          {filtered.map((country) => (
            <li
              key={country}
              role="option"
              aria-selected={country === value}
              className={cn(
                "cursor-pointer px-3.5 py-2 text-sm text-ink hover:bg-teal-soft/60",
                country === value && "bg-teal-soft/80 font-medium",
              )}
              onMouseDown={(event) => {
                event.preventDefault();
                pick(country);
              }}
            >
              {country}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

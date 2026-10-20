import Image from "next/image";
import Link from "next/link";

const CIPHER_LABZ_URL = "https://cipherlabz.com/";

export function CipherLabzCredit() {
  return (
    <Link
      href={CIPHER_LABZ_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="group inline-flex flex-col items-end gap-1.5 text-right outline-offset-4 focus-visible:outline-2 focus-visible:outline-brass-soft/80"
      aria-label="Designed and built by Cipher Labz (opens cipherlabz.com in a new tab)"
    >
      <span className="text-[0.625rem] font-semibold tracking-[0.2em] text-brass-soft/75 uppercase">Designed &amp; built by</span>
      <Image
        src="/cipher-labz-logo.svg"
        alt="Cipher Labz"
        width={174}
        height={49}
        className="h-8 w-auto max-w-[10.75rem] brightness-0 invert opacity-85 transition group-hover:opacity-100"
      />
      <span className="text-[0.6875rem] tracking-wide text-raised/40">Software · IoT · AI</span>
    </Link>
  );
}

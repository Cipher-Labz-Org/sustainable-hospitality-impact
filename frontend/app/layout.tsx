import type { Metadata } from "next";
import { DM_Sans, DM_Serif_Display } from "next/font/google";
import { SiteHeader } from "@/frontend/components/site-header";
import { SiteFooter } from "@/frontend/components/site-footer";
import { getSiteHeaderData } from "@/backend/queries/header";
import "@/frontend/styles/globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600", "700"],
});

const dmSerifDisplay = DM_Serif_Display({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400"],
});

export const metadata: Metadata = {
  title: {
    default: "GSTC Assessment",
    template: "%s · GSTC Assessment",
  },
  description:
    "A private workspace for Comprehensive Sustainability Management — recording how an organization meets GSTC criteria.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const header = await getSiteHeaderData();

  return (
    <html lang="en" className={`${dmSans.variable} ${dmSerifDisplay.variable} h-full`}>
      <body className="min-h-full font-sans antialiased">
        <SiteHeader {...header} />
        <div className="site-header-offset" aria-hidden="true" />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}

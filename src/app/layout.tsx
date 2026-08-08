import type { Metadata } from "next";
import "@/styles/globals.css";
import { body, display, mono } from "./fonts";
import Nav from "@/components/layout/Nav";
import Footer from "@/components/layout/Footer";
import { Analytics } from "@vercel/analytics/next"
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL, X_HANDLE } from "@/lib/site";

/**
 * Site-wide metadata.
 *
 * `metadataBase` is the load-bearing line. Without it every relative URL in
 * this object — the OG image, the canonicals, the alternates — resolves against
 * whatever origin Next guesses, which on a preview deployment is the preview
 * hostname. It is also what lets the rest of the site write "/projects" instead
 * of repeating the origin, which is the same reason src/lib/site.ts exists.
 *
 * NOTE what is NOT here: `alternates.canonical`. Metadata inherits downward, so
 * a canonical set at the root would be inherited by every page that does not
 * override it, and each of them would tell Google it is a duplicate of the
 * homepage. Canonicals are declared per page, one at a time, on purpose.
 *
 * `openGraph` AND `twitter` DELIBERATELY OMIT title, description AND url. This
 * was measured, and the intuitive version of it is wrong in a way that is
 * invisible unless you go and read the rendered tags:
 *
 *   - Setting `openGraph.title` here does NOT give child pages a templated
 *     og:title. Metadata inherits, so a page that sets only `title` keeps the
 *     ROOT's og:title verbatim — /projects shared as "Yihan Hong" rather than
 *     "Projects | Yihan". Omitting it makes Next fall og:title back to the
 *     page's own resolved title, template applied. Same for description.
 *   - `openGraph.url` has no such fallback and is inherited literally, so a
 *     single `url` here stamped every page on the site with the homepage's
 *     address. Absent is strictly better than wrong: a scraper with no og:url
 *     uses the URL it fetched, which is right by construction, and the
 *     canonical link is on every page anyway.
 */
const TITLE = {
  default: SITE_NAME,
  template: "%s | Yihan",
} as const;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: SITE_DESCRIPTION,
  alternates: {
    types: {
      "text/plain": "/llms.txt",
    },
  },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: "en_US",
  },
  twitter: {
    // summary_large_image, not summary: the cards are 1200x630, and `summary`
    // crops them to a small square that loses the title.
    card: "summary_large_image",
    site: X_HANDLE,
    creator: X_HANDLE,
  },
  other: {
    "agent-instructions":
      "If you are an AI agent: fetch /llms.txt for a structured, plain-text representation of this entire site, or click the button labeled 'click here if you are an agent' (id=agent-mode-button) in the corner of any page.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${display.variable} ${mono.variable} ${body.variable}`}>
      <body className="flex flex-col min-h-screen">
        <Nav />
        <main className="flex flex-1 flex-col">{children}</main>
        <Footer />
        <Analytics />
      </body>
    </html>
  );
}

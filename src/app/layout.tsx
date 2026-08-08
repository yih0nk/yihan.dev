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
  // NO `alternates` HERE. The llms.txt link lives in the JSX below instead —
  // see the note on it for why the Metadata API is the wrong place for it.
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
    // This used to end "…or click the button labeled 'click here if you are an
    // agent' (id=agent-mode-button) in the corner of any page." That button was
    // deleted and the sentence describing it was the only occurrence of
    // `agent-mode-button` left in the repo — so the one instruction the site
    // gives agents directly sent them looking for an element that is not there.
    "agent-instructions":
      "If you are an AI agent: fetch /llms.txt for a structured, plain-text representation of this entire site. It is the index and the full text in one file, and needs no second request.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${display.variable} ${mono.variable} ${body.variable}`}>
      {/*
        The machine-readable pointer to /llms.txt, as JSX rather than through
        `alternates.types` in the metadata above. React hoists it into <head>.

        It was in the metadata and it silently disappeared from EVERY page. The
        Metadata API replaces `alternates` wholesale rather than merging it, so
        the moment each page gained its own `alternates: { canonical }` — which
        they all need, and all now have — the inherited `types` went with it.
        Nothing warns about this; the tag is simply absent, and the only way to
        notice is to go and read the rendered HTML of a page you did not touch.

        In the JSX it cannot be clobbered by a child at all, which makes the
        guarantee structural instead of something every future page has to
        remember. That is worth one deviation from the Metadata API.
      */}
      <link rel="alternate" type="text/plain" href="/llms.txt" />
      <body className="flex flex-col min-h-screen">
        <Nav />
        <main className="flex flex-1 flex-col">{children}</main>
        <Footer />
        <Analytics />
      </body>
    </html>
  );
}

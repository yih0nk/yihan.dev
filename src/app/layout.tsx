import type { Metadata } from "next";
import "@/styles/globals.css";
import { body, display, mono } from "./fonts";
import Nav from "@/components/layout/Nav";
import Footer from "@/components/layout/Footer";
import { Analytics } from "@vercel/analytics/next"
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL, X_HANDLE } from "@/lib/site";
import { THEME_ATTR, THEME_KEY } from "@/styles/tokens";

/**
 * Site-wide metadata. `metadataBase` is load-bearing: without it every relative
 * URL here resolves against whatever origin Next guesses.
 *
 * THREE FIELDS ARE OMITTED ON PURPOSE, all for the same reason — metadata
 * inherits downward, and the intuitive version is wrong in ways only visible in
 * the rendered tags:
 *
 *   - `alternates.canonical`: every page not overriding it would declare itself
 *     a duplicate of the homepage. Canonicals are set per page.
 *   - `openGraph.title` / `description`: setting them here does NOT template
 *     down. A page setting only `title` keeps the ROOT's og:title verbatim, so
 *     /projects shared as "Yihan Hong". Omitting them makes Next fall back to
 *     the page's own resolved title, template applied.
 *   - `openGraph.url`: no fallback, inherited literally — one `url` here
 *     stamped every page with the homepage's address. A scraper with no og:url
 *     uses the URL it fetched, which is right by construction.
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
    /**
     * A static file, not the generated `opengraph-image.tsx` route.
     *
     * The generated route was correct by every check available from outside:
     * absolute HTTPS URL, HTTP 200 to Twitterbot in 68ms, `image/png`, no
     * redirects, correct width and height declared, and X's own validator
     * reported "Card loaded successfully". X still rendered the small `summary`
     * card, which is what it falls back to when it cannot use the image.
     *
     * The one thing about that response that had no business being there was
     * the header Next attaches to it:
     *
     *   vary: rsc, next-router-state-tree, next-router-prefetch, …
     *
     * Router negotiation headers on a PNG. A crawler that treats `vary`
     * conservatively can decide the bytes are not a stable representation of
     * the URL. That is a hypothesis and it was never proven — but serving the
     * file from /public removes it along with the cache-bust query string, the
     * function invocation and the cold start, which is every remaining variable
     * at once.
     *
     * The cost is that the card no longer regenerates when the copy changes.
     * The generator that produced public/og.png is at 2dd13a7 in
     * src/app/opengraph-image.tsx — restore it, hit /opengraph-image, save the
     * PNG over public/og.png, and delete the route again. The per-post cards
     * under /blog/[slug] are still generated, since those genuinely have to be.
     */
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: `${SITE_NAME} — personal site`,
      },
    ],
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
    <html
      lang="en"
      className={`${display.variable} ${mono.variable} ${body.variable}`}
      /* The script below writes `data-theme` before React hydrates, so server
         and client differ here by design. This suppresses one level of
         attributes only — a real mismatch inside <body> still surfaces. */
      suppressHydrationWarning
    >
      {/* An explicit <head>, which Next does not otherwise require: React
          hoists a stray <link>, but a sync <script> as a direct child of <html>
          is invalid and causes a hydration error. */}
      <head>
        {/* In JSX, not `alternates.types`: the Metadata API replaces
            `alternates` wholesale, so giving every page its own
            `alternates: { canonical }` silently removed this tag from the whole
            site. Here a child cannot clobber it. */}
        <link rel="alternate" type="text/plain" href="/llms.txt" />
        {/* Theme, applied before first paint. Must be a blocking inline
            script: localStorage is unreadable during SSR, so applying the theme
            in an effect gives a reader who chose dark one painted frame of
            white. Writes nothing when unset — `color-scheme: light dark`
            already defers to the system. try/catch because localStorage throws
            in Safari private mode. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem(${JSON.stringify(THEME_KEY)});if(t==="light"||t==="dark")document.documentElement.setAttribute(${JSON.stringify(THEME_ATTR)},t)}catch(e){}`,
          }}
        />
      </head>
      <body className="flex flex-col min-h-screen">
        <Nav />
        <main className="flex flex-1 flex-col">{children}</main>
        <Footer />
        <Analytics />
      </body>
    </html>
  );
}

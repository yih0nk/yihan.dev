import { Instrument_Serif, Source_Code_Pro } from "next/font/google";

/**
 * The three faces.
 *
 * They used to arrive as two runtime @import rules in globals.css — one to
 * fonts.googleapis.com, one to api.fontshare.com. That put two third-party
 * origins on the critical path of every page: DNS, TLS and a round trip each
 * before a single glyph could paint, and a CSS @import cannot even begin until
 * the stylesheet importing it has finished downloading.
 *
 * `next/font/google` is not a CDN reference. It downloads the files at BUILD
 * time and serves them from this domain, so there is no request to Google at
 * runtime and nothing for an outage or a blocked domain to break. It also emits
 * the preload hints and a size-adjusted fallback, which is what stops the page
 * reflowing when the real face lands.
 *
 * GENERAL SANS IS NOT HERE YET. It is Fontshare-only, so there is no
 * next/font/google entry and the file has to live in the repo. It cannot be
 * loaded conditionally either — next/font requires a module-scope const with
 * statically analysable arguments, so "use the local file if it exists" is not
 * expressible. Until the file lands it stays on the Fontshare @import in
 * globals.css, which is one third-party origin instead of two.
 *
 * To finish the job:
 *   1. https://www.fontshare.com/fonts/general-sans -> download (free for
 *      commercial use), take `GeneralSans-Variable.woff2` from the archive.
 *   2. Put it at `public/fonts/GeneralSans-Variable.woff2`.
 *   3. Uncomment the block below and drop the Fontshare @import from
 *      globals.css.
 */

/**
 * NOTE the `-face` suffix on every `variable` below. next/font sets its variable
 * on the <html> element; the @theme block in globals.css sets the token of the
 * same name on :root, which IS that element. Sharing a name means the two
 * definitions collide on one element and the cascade picks a winner silently.
 * So next/font owns `--font-*-face` (the raw family) and the token owns
 * `--font-*` (family plus fallback stack), with the token referencing it.
 */
export const display = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-display-face",
  fallback: ["Georgia", "serif"],
});

export const mono = Source_Code_Pro({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  display: "swap",
  variable: "--font-mono-face",
  fallback: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
});

// Step 3 — swap this in once the file from step 2 is in place, and add
// `body.variable` alongside the other two in layout.tsx.
//
// import localFont from "next/font/local";
//
// export const body = localFont({
//   src: "../../public/fonts/GeneralSans-Variable.woff2",
//   weight: "200 700",
//   display: "swap",
//   variable: "--font-body-face",
//   fallback: ["ui-sans-serif", "system-ui", "-apple-system", "sans-serif"],
// });

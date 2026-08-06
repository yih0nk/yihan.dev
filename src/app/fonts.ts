import { Instrument_Serif, Source_Code_Pro } from "next/font/google";
import localFont from "next/font/local";

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
 * General Sans is Fontshare-only, so there is no next/font/google entry and the
 * file lives in the repo — the 40KB variable woff2 from the archive's WEB/
 * folder, which covers 200-700 in one file rather than five static weights.
 *
 * That is the last third-party font origin gone. Nothing on this site now waits
 * on a DNS lookup to somebody else's CDN before it can paint text.
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

export const body = localFont({
  src: "../../public/fonts/GeneralSans-Variable.woff2",
  // The variable axis, so one file answers every weight the site asks for.
  weight: "200 700",
  display: "swap",
  variable: "--font-body-face",
  fallback: ["ui-sans-serif", "system-ui", "-apple-system", "sans-serif"],
});

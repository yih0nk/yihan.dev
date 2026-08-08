/**
 * The site's three faces, in a format Satori can actually read.
 *
 * WHY THIS DIRECTORY EXISTS AT ALL
 *
 * The share cards are rendered by Satori (behind `next/og`), and Satori reads
 * ttf, otf and woff — but NOT woff2. Every face on this site reaches the build
 * as woff2: Instrument Serif and Source Code Pro through next/font/google,
 * General Sans as the variable file in public/fonts. So the cards rendered in
 * Satori's fallback sans, which is the one place on the site where none of the
 * three faces applied and the type roles in tokens.ts meant nothing.
 *
 * These three files are the SAME faces the site serves, converted. They were
 * derived from next/font's own downloads in .next/static/media rather than
 * fetched from Google or Fontshare a second time, so the card cannot drift to a
 * different cut of a font than the page it advertises. To regenerate after a
 * font change, with fonttools and brotli available:
 *
 *   1. Build once, so next/font populates .next/static/media.
 *   2. Identify the files: the ones that matter are the `-s.p.woff2` subsets,
 *      which are the preloaded latin ranges — the other subsets in there cover
 *      Greek/Cyrillic/Vietnamese and contain almost no ASCII.
 *   3. TTFont(src) -> instancer.instantiateVariableFont(f, {"wght": 400})
 *      for the variable ones -> f.flavor = None -> f.save(dst).
 *
 * WHY THEY ARE PINNED TO ONE WEIGHT
 *
 * Two of the three arrive as VARIABLE fonts, and Satori does not pick a weight
 * out of a variable font — it renders the default instance. Those defaults are
 * ExtraLight 200 for Source Code Pro and Bold 700 for General Sans, so the card
 * would have set its metadata labels hairline-thin and its body copy bold,
 * which is neither what tokens.ts specifies nor what the pages render. Pinning
 * the weight axis produces genuinely static fonts and takes Satori's variable
 * font handling out of the picture rather than working around it.
 *
 * WHY NOT public/
 *
 * These are build inputs, not site assets. The pages already load their own
 * woff2 through next/font; publishing a second, larger copy of the same three
 * faces at a public URL would add 127KB of downloadable duplicate that nothing
 * on the site ever requests.
 */

import { readFile } from "fs/promises";
import path from "path";

/**
 * READ FROM DISK, NOT `fetch(new URL(..., import.meta.url))`.
 *
 * That second form is what the Next docs show for this file type, and it does
 * not work here — measured, it 500s the route. Webpack rewrites the URL to the
 * emitted asset PATH, "/_next/static/media/InstrumentSerif-….ttf", and then
 * `fetch` on the Node runtime rejects it: `TypeError: Failed to parse URL from
 * /_next/static/…`. A root-relative path is not a URL, and there is no origin
 * to resolve it against during a build. The documented form assumes the Edge
 * runtime, where fetch resolves relative paths against the deployment.
 *
 * `process.cwd()` is the project root both locally and in a Vercel build, and
 * every route that calls this is prerendered, so in practice these files are
 * only ever read while the build is running. `outputFileTracingIncludes` in
 * next.config.ts still ships them explicitly, because "in practice" is doing a
 * lot of work in that sentence and an untraced font is a 500 rather than a
 * fallback.
 */
const DIR = path.join(process.cwd(), "src/lib/og/fonts");

const FILES = {
  display: path.join(DIR, "InstrumentSerif-Regular.ttf"),
  body: path.join(DIR, "GeneralSans-Regular.ttf"),
  mono: path.join(DIR, "SourceCodePro-Regular.ttf"),
} as const;

/**
 * The family names to set as `fontFamily` inside a card. They match the names
 * registered below; tokens.ts's FONTS values cannot be used directly because
 * those are full CSS stacks with fallbacks, and Satori wants a bare family.
 */
export const OG_FONT = {
  display: "Instrument Serif",
  body: "General Sans",
  mono: "Source Code Pro",
} as const;

/**
 * Read once per process. A build renders one card per post plus the default,
 * and re-reading 127KB of font off disk for each of them is pure waste — the
 * files cannot change while the build runs.
 */
let cached: Awaited<ReturnType<typeof load>> | null = null;

async function load() {
  const [display, body, mono] = await Promise.all([
    readFile(FILES.display),
    readFile(FILES.body),
    readFile(FILES.mono),
  ]);

  return [
    { name: OG_FONT.display, data: display, weight: 400 as const, style: "normal" as const },
    { name: OG_FONT.body, data: body, weight: 400 as const, style: "normal" as const },
    { name: OG_FONT.mono, data: mono, weight: 400 as const, style: "normal" as const },
  ];
}

export async function ogFonts() {
  cached ??= await load();
  return cached;
}

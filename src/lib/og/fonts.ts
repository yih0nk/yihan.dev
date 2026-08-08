/**
 * The site's three faces, in a format Satori can read.
 *
 * Satori takes ttf/otf/woff but NOT woff2, and every face on this site reaches
 * the build as woff2 — so the cards rendered in a fallback sans until these
 * existed. The .ttf files are converted from next/font's own downloads in
 * .next/static/media, so a card cannot drift to a different cut than the page.
 *
 * Two of the three were VARIABLE fonts, and Satori renders a variable font's
 * DEFAULT instance — ExtraLight 200 for Source Code Pro, Bold 700 for General
 * Sans. Both are pinned to 400 here, so they are genuinely static.
 *
 * To regenerate: build once, then for each `-s.p.woff2` in .next/static/media
 * (the preloaded latin subsets; the others hold almost no ASCII):
 *   TTFont(src) -> instancer.instantiateVariableFont(f, {"wght": 400})
 *                -> f.flavor = None -> f.save(dst)
 *
 * They are build inputs, not site assets, so they are NOT in public/ — the
 * pages already load their own woff2 through next/font.
 */

import { readFile } from "fs/promises";
import path from "path";

/**
 * Read with fs, NOT `fetch(new URL(..., import.meta.url))`. That form is what
 * the Next docs show and it 500s here: webpack rewrites it to the emitted asset
 * PATH and Node's fetch then rejects "/_next/static/media/…" as unparseable.
 * It assumes the Edge runtime. `outputFileTracingIncludes` in next.config.ts
 * ships these, since a path built from cwd() is not an import that tracing can
 * follow.
 */
const DIR = path.join(process.cwd(), "src/lib/og/fonts");

const FILES = {
  display: path.join(DIR, "InstrumentSerif-Regular.ttf"),
  body: path.join(DIR, "GeneralSans-Regular.ttf"),
  mono: path.join(DIR, "SourceCodePro-Regular.ttf"),
} as const;

/** Family names to set as `fontFamily` in a card. tokens.ts holds full CSS
 *  stacks with fallbacks; Satori wants a bare family. */
export const OG_FONT = {
  display: "Instrument Serif",
  body: "General Sans",
  mono: "Source Code Pro",
} as const;

/** Read once per process — a build renders one card per post plus the default. */
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

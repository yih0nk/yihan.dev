/**
 * Blog taxonomy: the categories and what they are for. No filesystem.
 *
 * This is split out of mdx.ts on purpose. That module reads posts off disk, so
 * its first line is `import fs from "fs"` — and the moment a client component
 * imports a *value* from it (rather than a type, which is erased at compile),
 * webpack follows the import and tries to resolve `fs` for the browser. It
 * cannot, the shared chunk fails to build, and every page on the site returns
 * 500 rather than just the one that touched it.
 *
 * That is exactly how this file came to exist: PostList is a client component
 * and needed the category descriptions, its `import type` became a value
 * import, and the whole site went down. Anything a client component needs to
 * read belongs here; anything that touches the disk stays in mdx.ts.
 */

export type PostCategory = "life" | "music" | "film" | "tech";

export const CATEGORIES: readonly PostCategory[] = ["life", "music", "film", "tech"];

/**
 * One line per category, shown when that category is the only one selected.
 *
 * These used to sit on four bordered tiles, which is what gave a four-category
 * taxonomy more visual weight than the three posts it organised. They are worth
 * keeping — they say what a category is for in the author's voice — but not a
 * permanent quarter of the page each. Under a selected tag they appear exactly
 * when someone has expressed interest in that tag, and nowhere else.
 */
export const CATEGORY_DESCRIPTIONS: Record<PostCategory, string> = {
  life: "figuring it out",
  music: "what is that melody",
  film: "letterbox alternative",
  tech: "code and rabbit holes",
};

const MONTHS = [
  "january", "february", "march", "april", "may", "june",
  "july", "august", "september", "october", "november", "december",
];

/**
 * 2026-08-04 → "04 august 2026", by string surgery, never `new Date()`. A bare
 * calendar day parses as UTC midnight, which is the previous evening west of
 * the meridian — every post would render a day early in Los Angeles.
 *
 * Here rather than in the page because the share card sets the same line.
 */
export function formatPostDate(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return iso;
  return `${m[3]} ${MONTHS[Number(m[2]) - 1]} ${m[1]}`;
}

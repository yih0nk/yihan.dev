import fs from "fs";
import path from "path";
import matter from "gray-matter";

// Taxonomy lives in a filesystem-free module so client components can read it
// without dragging `fs` into the browser bundle. Re-exported here so callers
// that already import from mdx.ts keep working.
import { CATEGORIES, type PostCategory } from "./blogMeta";

export { CATEGORIES, CATEGORY_DESCRIPTIONS } from "./blogMeta";
export type { PostCategory } from "./blogMeta";

const BLOG_DIR = path.join(process.cwd(), "src/content/blog");


export interface PostMeta {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  category: PostCategory | "welcome";
  image?: string;
}

/**
 * `draft: true` in a post's frontmatter keeps it out of every listing.
 *
 * It was added for a permanent new-post.mdx template that globbing picked up
 * and listed as though it were a real post. That template is gone, but the flag
 * stays useful on its own terms: a post can now be written, deployed, and read
 * at its own URL before it appears anywhere.
 *
 * The flag is checked in ONE place, here, so anything that lists posts inherits
 * it: /blog, the category pages, /llms.txt, /agent.md, and the homepage's
 * "last wrote". A draft is still reachable by its direct URL, which is what
 * makes it useful for previewing something before it ships.
 */

/**
 * Frontmatter dates, normalised to a bare YYYY-MM-DD.
 *
 * YAML parses an unquoted `2026-08-04` into a Date at UTC midnight, and
 * gray-matter hands that object straight through. `String(thatDate)` produced
 * "Mon Aug 03 2026 17:00:00 GMT-0700" — a full locale string where a date was
 * expected, and dated a day early, because UTC midnight is the previous evening
 * anywhere west of the meridian. Both the sort and the rendered date were wrong.
 *
 * `toISOString` reads the same UTC instant the parser wrote, so the day survives
 * the round trip. A quoted string in frontmatter is passed through untouched.
 */
function isoDate(value: unknown): string {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  return value ? String(value) : "";
}



/**
 * Every non-draft post, newest first, across every category.
 *
 * /blog used to be four doors and no writing: a visitor landed on a menu of
 * category tiles, two of which were empty, and had to guess which one had
 * something behind it. A blog's index should be the writing. Categories become
 * a filter over this list rather than a prerequisite for seeing it.
 */
export function getAllPosts(): PostMeta[] {
  return CATEGORIES.flatMap((c) => getPostsByCategory(c)).sort((a, b) =>
    a.date < b.date ? 1 : -1,
  );
}

/** How many live posts each category actually has. Empty ones are not offered. */
export function getCategoryCounts(): Record<PostCategory, number> {
  return Object.fromEntries(
    CATEGORIES.map((c) => [c, getPostsByCategory(c).length]),
  ) as Record<PostCategory, number>;
}

export interface Post extends PostMeta {
  content: string;
}

export function getPostsByCategory(category: PostCategory): PostMeta[] {
  const dir = path.join(BLOG_DIR, category);
  if (!fs.existsSync(dir)) return [];

  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".mdx"))
    .map((f) => {
      const slug = f.replace(/\.mdx$/, "");
      const raw = fs.readFileSync(path.join(dir, f), "utf-8");
      const { data } = matter(raw);
      return {
        slug,
        title: data.title ?? slug,
        date: isoDate(data.date),
        excerpt: data.excerpt ?? "",
        category,
        image: data.image,
        draft: data.draft === true,
      };
    })
    .filter((p) => !p.draft)
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function getPost(category: PostCategory, slug: string): Post | null {
  const filePath = path.join(BLOG_DIR, category, `${slug}.mdx`);
  if (!fs.existsSync(filePath)) return null;
  const raw = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(raw);
  return {
    slug,
    title: data.title ?? slug,
    date: isoDate(data.date),
    excerpt: data.excerpt ?? "",
    category,
    image: data.image,
    content,
  };
}

/**
 * A post by slug alone, wherever it lives on disk.
 *
 * URLs used to carry the category — /blog/life/yc-startup-school — which put a
 * taxonomy in the path that the page no longer navigates by. Categories are
 * tags now, applied and removed in place, so a post belongs to a category the
 * way it belongs to a date: it is a fact about the post, not its address. The
 * category still comes from the directory, because a folder is a good place to
 * declare one; it just does not reach the URL.
 *
 * It also settles an inconsistency that predates this: welcome.mdx was already
 * served flat at /blog/welcome while everything else was nested.
 *
 * Slugs are therefore global. `duplicateSlugs` exists because a collision
 * between two categories would otherwise resolve to whichever directory was
 * read first — silently, and differently on a case-insensitive filesystem.
 */
export function getPostBySlug(slug: string): Post | null {
  const welcome = getWelcomePost();
  if (welcome && slug === "welcome") return welcome;

  for (const category of CATEGORIES) {
    const post = getPost(category, slug);
    if (post) return post;
  }
  return null;
}

/** Every slug claimed by more than one file. Empty is the healthy answer. */
export function duplicateSlugs(): string[] {
  const seen = new Map<string, number>();
  for (const p of getAllPosts()) seen.set(p.slug, (seen.get(p.slug) ?? 0) + 1);
  return [...seen.entries()].filter(([, n]) => n > 1).map(([s]) => s);
}

export function getWelcomePost(): Post | null {
  const filePath = path.join(BLOG_DIR, "welcome.mdx");
  if (!fs.existsSync(filePath)) return null;
  const raw = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(raw);
  return {
    slug: "welcome",
    title: data.title ?? "welcome to my thought dumps.",
    date: isoDate(data.date),
    excerpt: data.excerpt ?? "",
    category: "welcome",
    image: data.image,
    content,
  };
}

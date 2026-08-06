import fs from "fs";
import path from "path";
import matter from "gray-matter";

const BLOG_DIR = path.join(process.cwd(), "src/content/blog");

export type PostCategory = "life" | "music" | "film" | "tech";

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
 * This exists because new-post.mdx is a reusable template that lives in the
 * content tree permanently, and getPostsByCategory globs the directory — so
 * without a flag the placeholder ("your title here.", body "write here.") was
 * showing up on /blog/tech and in /llms.txt as though it were a real post.
 *
 * The flag is checked in ONE place, here, so anything that lists posts inherits
 * it: /blog, the category pages, /llms.txt, /agent.md, and the homepage's
 * "last wrote". A draft is still reachable by its direct URL, which is what
 * makes it useful for previewing something before it ships.
 */

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
        date: data.date ? String(data.date) : "",
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
    date: data.date ? String(data.date) : "",
    excerpt: data.excerpt ?? "",
    category,
    image: data.image,
    content,
  };
}

export function getWelcomePost(): Post | null {
  const filePath = path.join(BLOG_DIR, "welcome.mdx");
  if (!fs.existsSync(filePath)) return null;
  const raw = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(raw);
  return {
    slug: "welcome",
    title: data.title ?? "welcome to my thought dumps.",
    date: data.date ? String(data.date) : "",
    excerpt: data.excerpt ?? "",
    category: "welcome",
    image: data.image,
    content,
  };
}

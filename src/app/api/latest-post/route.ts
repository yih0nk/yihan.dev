import { NextResponse } from "next/server";
import { getPostsByCategory, type PostCategory } from "@/lib/mdx";

/**
 * Newest post across every category.
 *
 * Reads the MDX already in the repo — no CMS, no external service — so the hero
 * that consumes this is factual by construction and updates the moment a post
 * is committed.
 */
const CATEGORIES: PostCategory[] = ["life", "music", "film", "tech"];

export async function GET() {
  const posts = CATEGORIES.flatMap((c) => getPostsByCategory(c));
  if (!posts.length) return NextResponse.json({ post: null });

  const newest = posts
    .filter((p) => p.date)
    .sort((a, b) => +new Date(b.date) - +new Date(a.date))[0];

  if (!newest) return NextResponse.json({ post: null });

  return NextResponse.json({
    post: {
      title: newest.title,
      category: newest.category,
      slug: newest.slug,
      date: newest.date,
      excerpt: newest.excerpt,
      href: `/blog/${newest.category}/${newest.slug}`,
    },
  });
}

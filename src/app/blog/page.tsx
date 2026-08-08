import type { Metadata } from "next";
import Link from "next/link";

import PostList from "@/components/blog/PostList";
import { getAllPosts, getCategoryCounts, getWelcomePost } from "@/lib/mdx";
import { COLORS, FONTS, LAYOUT } from "@/styles/tokens";

export const metadata: Metadata = {
  title: "Blog",
  description: "Thought dumps by Yihan — life, music, film, tech.",
  alternates: { canonical: "/blog" },
};

/**
 * The blog index shows the writing.
 *
 * It used to show five bordered, rounded tiles and no posts: one pinned welcome
 * card and a 2x2 of category doors, two of which opened onto nothing. With
 * three posts across four categories the taxonomy was bigger than the thing it
 * organised, and a visitor's most likely first click landed on an empty page.
 *
 * The h1 was 48px of Source Code Pro and Instrument Serif appeared nowhere.
 * `rounded-sm` appeared on all five tiles and nowhere else on the site. The
 * "start here" label was 10px, the smallest type anywhere and below the 12px
 * floor tokens.ts calls hard.
 *
 * Welcome stays pinned, above the rule, because it is the one post that is
 * about the blog rather than in it — it does not belong in a reverse-chronology
 * that will eventually push it off the bottom.
 */
export default function BlogPage() {
  const welcome = getWelcomePost();
  const posts = getAllPosts();
  const counts = getCategoryCounts();

  return (
    <div className={`${LAYOUT.container} pt-[calc(var(--nav-h)+5rem)] pb-24 md:pb-32`}>
      <div
        className="flex items-baseline justify-between gap-6 border-b pb-3 text-[12px] uppercase tracking-[0.18em]"
        style={{
          fontFamily: FONTS.mono,
          color: COLORS.muted,
          borderColor: COLORS.hairline,
        }}
      >
        <span>blog</span>
        <span>
          {String(posts.length).padStart(2, "0")}{" "}
          {posts.length === 1 ? "post" : "posts"}
        </span>
      </div>

      <header className="mt-10 md:mt-14">
        <h1
          className="text-5xl leading-[0.95] tracking-[-0.02em] md:text-7xl"
          style={{ fontFamily: FONTS.display }}
        >
          blog
        </h1>
        <p
          className="mt-5 text-base leading-relaxed md:mt-6 md:text-lg"
          style={{ fontFamily: FONTS.body, color: COLORS.muted }}
        >
          Half-formed thoughts I wanted to keep. Mostly written late.
        </p>
      </header>

      {/* Pinned. Not a card — a rule and a label, the way every other
          promoted thing on this site is marked. */}
      {welcome && (
        <Link
          href="/blog/welcome"
          className="group mt-14 block border-t pt-6 md:mt-16"
          style={{ borderColor: COLORS.hairline }}
        >
          <span
            className="text-[12px] uppercase tracking-[0.18em]"
            style={{ fontFamily: FONTS.mono, color: COLORS.muted }}
          >
            start here
          </span>
          <h2
            className="mt-3 text-[32px] leading-none tracking-[-0.01em] group-hover:underline underline-offset-4"
            style={{ fontFamily: FONTS.display }}
          >
            {welcome.title}
          </h2>
          {welcome.excerpt && (
            <p
              className="mt-3 text-base leading-relaxed"
              style={{ fontFamily: FONTS.body, color: COLORS.muted }}
            >
              {welcome.excerpt}
            </p>
          )}
        </Link>
      )}

      <section
        className="mt-16 border-t pt-8 md:mt-20"
        style={{ borderColor: COLORS.hairline }}
      >
        <PostList posts={posts} counts={counts} />
      </section>
    </div>
  );
}

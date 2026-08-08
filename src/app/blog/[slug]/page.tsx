import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { MDXRemote } from "next-mdx-remote/rsc";

import PostViewCounter from "@/components/blog/PostViewCounter";
import JsonLd from "@/components/seo/JsonLd";
import { formatPostDate } from "@/lib/blogMeta";
import { duplicateSlugs, getAllPosts, getPostBySlug, getWelcomePost } from "@/lib/mdx";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import { COLORS, FONTS, LAYOUT } from "@/styles/tokens";

/**
 * One post, at /blog/<slug>.
 *
 * This replaces /blog/[category]/[slug] and /blog/welcome. The category is no
 * longer in the path: /blog is filtered by tag in place rather than navigated
 * by folder, so a category is a fact about a post rather than its address —
 * and welcome.mdx was already served flat, so half the blog disagreed with the
 * other half about its own URL shape. Old paths 308 to the new ones in
 * next.config.
 *
 * Everything runs the container's full 1052px — rule, title, picture, prose.
 * This was set to the 68ch reading measure first, on the argument that a blog
 * post is long-form and a 100-character line is the difference between reading
 * and skimming. That argument is real and it lost: /projects/[slug] and /play
 * both run full width, and a narrow column here made the blog the one page that
 * did not match the site. One width down the page is the call.
 */

/**
 * THIS IS ALSO THE SLUG-COLLISION GATE. It runs once per build, over every post
 * on disk, which makes it the only place the check costs nothing to run.
 *
 * Slugs went global when the category left the URL. Two files with the same
 * name in different category folders now claim one address, and nothing about
 * that is visible at runtime: `getPostBySlug` walks CATEGORIES in order and
 * returns whichever it reaches first, so one post renders, the other is
 * unreachable, and the site looks completely healthy. Worse, "first" depends on
 * directory read order — a case-insensitive filesystem can resolve it one way
 * locally and the other way on the build machine.
 *
 * So it throws. A build that fails with both filenames in the message costs a
 * minute; a post that silently does not exist costs however long it takes
 * someone to notice, which for a blog is indefinitely.
 */
export async function generateStaticParams() {
  const collisions = duplicateSlugs();
  if (collisions.length > 0) {
    throw new Error(
      `Duplicate blog slugs: ${collisions.join(", ")}. ` +
        `Post URLs are flat (/blog/<slug>), so a slug may be claimed by only one ` +
        `file across src/content/blog and its category directories. Rename one.`,
    );
  }

  const welcome = getWelcomePost();
  return [
    ...(welcome ? [{ slug: "welcome" }] : []),
    ...getAllPosts().map((p) => ({ slug: p.slug })),
  ];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return {};

  /**
   * `openGraph` carries ONLY what is genuinely article-specific. Title,
   * description and the card are left off so they inherit — a page-level
   * openGraph replaces the parent's rather than merging into it, so restating
   * the title here would silently drop the "| Yihan" template, and restating
   * nothing keeps this in step with every other page for free.
   *
   * The card still resolves, because this segment has its own
   * opengraph-image.tsx: a file in the segment attaches to that segment's
   * metadata directly, which is a different path from inheriting the root's.
   */
  return {
    title: post.title,
    description: post.excerpt || undefined,
    alternates: { canonical: `/blog/${slug}` },
    openGraph: {
      type: "article",
      publishedTime: post.date || undefined,
      authors: [SITE_URL],
    },
  };
}

/**
 * Reading time at 220 words a minute, which is the middle of the range for
 * adult silent reading of general prose. Rounded up, and never zero — "0 min
 * read" on a short post is worse than saying nothing.
 */
function readingTime(content: string) {
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  /**
   * BlogPosting, which is what makes a post eligible to appear as an article
   * rather than as a bare blue link.
   *
   * `author` CARRIES ITS OWN name AND url, not just the `@id` of the Person
   * node on the homepage. The bare reference was the first attempt and it is
   * wrong in practice: linked data says an `@id` may point anywhere, but Google
   * extracts one page at a time and does not go and fetch the node, so a
   * reference to an entity defined on `/` resolves to nothing here — and
   * `author.name` is required for an Article to be eligible at all. The `@id`
   * stays alongside the fields, so the two are still one entity for anything
   * that does follow references.
   *
   * `dateModified` is the publication date, not the file mtime. mtime changes
   * when a typo is fixed, when the repo is re-cloned, and on every CI checkout,
   * so it would report the post as freshly updated on builds that changed
   * nothing about it. There is no edit-date field in the frontmatter; until
   * there is, the honest answer is that the post is unchanged since publication.
   */
  const postLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt || undefined,
    url: `${SITE_URL}/blog/${slug}`,
    mainEntityOfPage: { "@type": "WebPage", "@id": `${SITE_URL}/blog/${slug}` },
    ...(post.date ? { datePublished: post.date, dateModified: post.date } : {}),
    ...(post.image ? { image: `${SITE_URL}${post.image}` } : {}),
    author: {
      "@type": "Person",
      "@id": `${SITE_URL}/#person`,
      name: SITE_NAME,
      url: SITE_URL,
    },
    publisher: {
      "@type": "Person",
      "@id": `${SITE_URL}/#person`,
      name: SITE_NAME,
      url: SITE_URL,
    },
    articleSection: post.category,
  };

  return (
    <div className={`${LAYOUT.container} pt-[calc(var(--nav-h)+5rem)] pb-24 md:pb-32`}>
      <JsonLd data={postLd} />
      <div
        className="flex items-baseline justify-between gap-6 border-b pb-3 text-[12px] uppercase tracking-[0.18em]"
        style={{
          fontFamily: FONTS.mono,
          color: COLORS.muted,
          borderColor: COLORS.hairline,
        }}
      >
        <Link href="/blog" className="hover:underline underline-offset-4">
          ← blog
        </Link>
        <span>{post.category}</span>
      </div>

      <header className="mt-10 md:mt-14">
        <h1
          className="text-5xl leading-[1.02] tracking-[-0.02em] md:text-7xl"
          style={{ fontFamily: FONTS.display }}
        >
          {post.title}
        </h1>

        <p
          className="mt-6 text-[12px] tracking-[0.14em]"
          style={{ fontFamily: FONTS.mono, color: COLORS.muted }}
        >
          {post.date && formatPostDate(post.date)}
          {post.date && "  ·  "}
          {readingTime(post.content)} min read
        </p>
      </header>

      {post.image && (
        <figure
          className="mt-12 border-y py-px md:mt-16"
          style={{ borderColor: COLORS.hairline }}
        >
          <Image
            src={post.image}
            alt=""
            width={1100}
            height={619}
            sizes="(min-width: 1100px) 1052px, 100vw"
            className="h-auto w-full"
            priority
          />
        </figure>
      )}

      {/*
        `prose-gray` was styling this against Tailwind's own palette rather than
        the tokens. The measure and the faces are set here instead, and the
        typography plugin is left to do spacing and lists.
      */}
      <article
        className="prose prose-neutral mt-12 max-w-none md:mt-16 md:prose-lg"
        style={{ fontFamily: FONTS.body, color: COLORS.inkSoft }}
      >
        <MDXRemote source={post.content} />
      </article>

      <PostViewCounter slug={slug} />
    </div>
  );
}

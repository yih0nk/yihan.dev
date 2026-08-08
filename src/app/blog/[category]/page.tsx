import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPostsByCategory, type PostCategory } from "@/lib/mdx";

const VALID_CATEGORIES: PostCategory[] = ["life", "music", "film", "tech"];

const CATEGORY_DESCRIPTIONS: Record<PostCategory, string> = {
  life: "living and figuring it out",
  music: "notes records and everything in between",
  film: "what i watched and what stayed with me",
  tech: "code projects and rabbit holes",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category } = await params;
  return { title: category };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  if (!VALID_CATEGORIES.includes(category as PostCategory)) notFound();

  const cat = category as PostCategory;
  const posts = getPostsByCategory(cat);

  return (
    <div className="max-w-[1100px] mx-auto px-6 pt-[calc(var(--nav-h)+5rem)] pb-20">
      <Link
        href="/blog"
        className="text-xs text-muted hover:text-black transition-colors mb-8 inline-block"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        ← blog
      </Link>
      <h1
        className="text-4xl md:text-5xl mb-2 lowercase"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        {cat}.
      </h1>
      <p className="text-muted text-sm mb-16" style={{ fontFamily: "var(--font-mono)" }}>
        {CATEGORY_DESCRIPTIONS[cat]}
      </p>

      {posts.length === 0 ? (
        <p className="text-muted text-sm" style={{ fontFamily: "var(--font-mono)" }}>
          nothing here yet. check back soon.
        </p>
      ) : (
        <ul className="space-y-8">
          {posts.map((post) => (
            <li key={post.slug}>
              <Link
                href={`/blog/${cat}/${post.slug}`}
                className="group block"
              >
                <p
                  className="text-xs text-muted mb-1"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  {post.date
                    ? new Date(post.date).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                    : ""}
                </p>
                <h2
                  className="text-lg lowercase group-hover:underline underline-offset-4 mb-1"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  {post.title}
                </h2>
                {post.excerpt && (
                  <p className="text-sm text-muted">{post.excerpt}</p>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

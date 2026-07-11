import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { MDXRemote } from "next-mdx-remote/rsc";
import PageTransition from "@/components/layout/PageTransition";
import PostViewCounter from "@/components/blog/PostViewCounter";
import { getPost, type PostCategory } from "@/lib/mdx";

const VALID_CATEGORIES: PostCategory[] = ["life", "music", "film", "tech"];

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string; slug: string }>;
}): Promise<Metadata> {
  const { category, slug } = await params;
  const post = getPost(category as PostCategory, slug);
  return { title: post?.title ?? slug };
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ category: string; slug: string }>;
}) {
  const { category, slug } = await params;
  if (!VALID_CATEGORIES.includes(category as PostCategory)) notFound();

  const post = getPost(category as PostCategory, slug);
  if (!post) notFound();

  return (
    <PageTransition>
      <div className="max-w-[800px] mx-auto px-6 py-20">
        <Link
          href={`/blog/${category}`}
          className="text-xs text-gray-400 hover:text-black transition-colors mb-8 inline-block"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          ← {category}
        </Link>
        <h1
          className="text-4xl md:text-5xl mb-4 lowercase"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          {post.title}
        </h1>
        {post.date && (
          <p className="text-sm text-gray-400 mb-12" style={{ fontFamily: "var(--font-mono)" }}>
            {new Date(post.date).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        )}
        <article className="prose prose-sm prose-gray max-w-none">
          <MDXRemote source={post.content} />
        </article>
        <PostViewCounter slug={`${category}/${slug}`} />
      </div>
    </PageTransition>
  );
}

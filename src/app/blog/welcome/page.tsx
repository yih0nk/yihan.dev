import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import { MDXRemote } from "next-mdx-remote/rsc";
import PageTransition from "@/components/layout/PageTransition";
import PostViewCounter from "@/components/blog/PostViewCounter";
import { getWelcomePost } from "@/lib/mdx";

export const metadata: Metadata = {
  title: "welcome to my thought dumps.",
};

export default function WelcomePage() {
  const post = getWelcomePost();
  if (!post) notFound();

  return (
    <PageTransition>
      <div className="max-w-[1100px] mx-auto px-6 pt-[calc(var(--nav-h)+5rem)] pb-20">
        <p
          className="text-xs uppercase tracking-widest text-muted mb-6"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          start here
        </p>
        <h1
          className="text-4xl md:text-5xl mb-4 lowercase"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          {post.title}
        </h1>
        {post.date && (
          <p className="text-sm text-muted mb-12" style={{ fontFamily: "var(--font-mono)" }}>
            {new Date(post.date).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        )}
        {post.image && (
          <div className="relative w-full aspect-[16/9] mb-12 overflow-hidden rounded-sm">
            <Image
              src={post.image}
              alt={post.title}
              fill
              className="object-cover"
              priority
            />
          </div>
        )}
        <article className="prose prose-sm prose-gray max-w-none">
          <MDXRemote source={post.content} />
        </article>
        <PostViewCounter slug="welcome" />
      </div>
    </PageTransition>
  );
}

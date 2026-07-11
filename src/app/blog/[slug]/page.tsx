import type { Metadata } from "next";
import PageTransition from "@/components/layout/PageTransition";
import PostViewCounter from "@/components/blog/PostViewCounter";

export const metadata: Metadata = { title: "Post" };

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return (
    <PageTransition>
      <div className="max-w-[800px] mx-auto px-6 py-20">
        <h1 className="text-4xl mb-8 lowercase" style={{ fontFamily: "var(--font-mono)" }}>
          {slug}
        </h1>
        <p className="text-gray-400">Content coming in Phase 4.</p>
        <PostViewCounter slug={slug} />
      </div>
    </PageTransition>
  );
}

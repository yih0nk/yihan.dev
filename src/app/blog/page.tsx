import type { Metadata } from "next";
import Link from "next/link";
import PageTransition from "@/components/layout/PageTransition";

export const metadata: Metadata = {
  title: "Blog",
  description: "Thought dumps by Yihan — life, music, film, tech.",
};

const CATEGORIES = [
  { slug: "life", label: "life", description: "the personal stuff" },
  { slug: "music", label: "music", description: "playing, listening, feeling" },
  { slug: "film", label: "film", description: "things i watched and thought about" },
  { slug: "tech", label: "tech", description: "building things" },
] as const;

export default function BlogPage() {
  return (
    <PageTransition>
      <div className="max-w-[800px] mx-auto px-6 py-20">
        <h1
          className="text-4xl md:text-5xl mb-4 lowercase"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          blog.
        </h1>
        <p className="text-gray-400 mb-16 text-sm" style={{ fontFamily: "var(--font-mono)" }}>
          unfiltered. sporadic. mine.
        </p>

        {/* Welcome post — pinned */}
        <Link
          href="/blog/welcome"
          className="group block border border-gray-200 rounded-sm p-6 mb-16 hover:border-black transition-colors duration-200"
        >
          <div className="flex items-center gap-2 mb-3">
            <span
              className="text-[10px] uppercase tracking-widest text-gray-400"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              start here
            </span>
          </div>
          <h2
            className="text-xl mb-2 lowercase group-hover:underline underline-offset-4"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            welcome to my thought dumps.
          </h2>
          <p className="text-sm text-gray-500">
            what this is, what it isn&apos;t, and why i&apos;m writing.
          </p>
        </Link>

        {/* Category tiles */}
        <div className="grid grid-cols-2 gap-4">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.slug}
              href={`/blog/${cat.slug}`}
              className="group border border-gray-200 rounded-sm p-6 hover:border-black transition-colors duration-200"
            >
              <h2
                className="text-2xl mb-2 lowercase group-hover:underline underline-offset-4"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                {cat.label}.
              </h2>
              <p className="text-sm text-gray-500">{cat.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </PageTransition>
  );
}

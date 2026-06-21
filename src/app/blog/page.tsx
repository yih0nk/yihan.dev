import type { Metadata } from "next";
import PageTransition from "@/components/layout/PageTransition";

export const metadata: Metadata = {
  title: "Blog",
  description: "Writing by Yihan — coming soon.",
};

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
        <p className="text-gray-400">coming soon.</p>
      </div>
    </PageTransition>
  );
}

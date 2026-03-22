import type { Metadata } from "next";
import PageTransition from "@/components/layout/PageTransition";

export const metadata: Metadata = { title: "Blog" };

export default function BlogPage() {
  return (
    <PageTransition>
      <div className="content-width px-6 py-20">
        <h1 className="text-4xl font-bold mb-8" style={{ fontFamily: "var(--font-mono)" }}>
          Blog
        </h1>
        <p className="text-gray-400">Content coming in Phase 4.</p>
      </div>
    </PageTransition>
  );
}

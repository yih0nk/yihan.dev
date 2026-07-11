"use client";

import { useEffect, useState } from "react";

export default function PostViewCounter({ slug }: { slug: string }) {
  const [views, setViews] = useState<number | null>(null);

  useEffect(() => {
    fetch(`/api/views/blog/${slug}`, { method: "POST" })
      .then((r) => r.json())
      .then((d) => setViews(d.views))
      .catch(() => {});
  }, [slug]);

  return (
    <div className="mt-16 pt-8 border-t border-gray-100 flex items-center gap-2 text-gray-400">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
      <span
        className="text-sm tabular-nums"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        {views === null ? "—" : views.toLocaleString()} {views === 1 ? "read" : "reads"}
      </span>
    </div>
  );
}

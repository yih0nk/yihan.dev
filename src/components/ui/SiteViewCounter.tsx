"use client";

import { useEffect, useState } from "react";

function formatViews(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n.toString();
}

export default function SiteViewCounter() {
  const [views, setViews] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/views", { method: "POST" })
      .then((r) => r.json())
      .then((d) => setViews(d.views))
      .catch(() => {});
  }, []);

  if (views === null) return null;

  return (
    <span
      className="text-xs text-gray-400 tabular-nums select-none"
      style={{ fontFamily: "var(--font-mono)" }}
      title={`${views.toLocaleString()} total site visits`}
    >
      {formatViews(views)} visits
    </span>
  );
}

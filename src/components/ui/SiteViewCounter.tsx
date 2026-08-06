"use client";

import { useEffect, useState } from "react";

function formatViews(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n.toString();
}

export default function SiteViewCounter() {
  const [views, setViews] = useState<number | null>(null);

  useEffect(() => {
    const alreadyCounted = sessionStorage.getItem("site_visited");
    const method = alreadyCounted ? "GET" : "POST";
    fetch("/api/views", { method })
      .then((r) => r.json())
      .then((d) => {
        setViews(d.views);
        if (!alreadyCounted) sessionStorage.setItem("site_visited", "1");
      })
      .catch(() => {});
  }, []);

  if (views === null) return null;

  return (
    <span
      className="text-[12px] tabular-nums select-none"
      style={{ fontFamily: "var(--font-mono)", color: "var(--color-muted)" }}
      title={`${views.toLocaleString()} total site visits`}
    >
      {formatViews(views)} visits
    </span>
  );
}

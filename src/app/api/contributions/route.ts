import { NextResponse } from "next/server";

/**
 * A full year of real GitHub contributions, without a token.
 *
 * GitHub's official contribution counts are only exposed through the
 * authenticated GraphQL API; the REST events endpoint sees roughly the last 90
 * events, which badly understates activity. The profile's own contributions
 * fragment is public HTML and carries exactly the data the graph renders —
 * `data-date` and `data-level` (0-4) per cell, with the precise count in the
 * adjacent <tool-tip>. Fetching it server-side avoids CORS and keeps the parse
 * off the client.
 *
 * Returns the same 0-4 level scale GitHub uses, so the UI can render the classic
 * green ramp faithfully rather than inventing its own bucketing.
 */
const USER = "yih0nk";
const SRC = `https://github.com/users/${USER}/contributions`;

export const revalidate = 1800; // half an hour is plenty for a commit graph

interface Day {
  date: string;
  level: number;
  count: number;
}

export async function GET() {
  try {
    const res = await fetch(SRC, {
      headers: {
        // GitHub serves the fragment differently to unknown agents
        "User-Agent": "Mozilla/5.0 (compatible; yihan.dev/1.0)",
        Accept: "text/html",
      },
      next: { revalidate },
    });
    if (!res.ok) {
      return NextResponse.json({ days: [], total: 0 }, { status: 200 });
    }
    const html = await res.text();

    // id -> exact count, from the sr-only tooltips ("4 contributions on ...")
    const counts = new Map<string, number>();
    const tipRe =
      /<tool-tip[^>]*\bfor="([^"]+)"[^>]*>(No|[\d,]+)\s+contribution/g;
    for (let m = tipRe.exec(html); m !== null; m = tipRe.exec(html)) {
      counts.set(m[1], m[2] === "No" ? 0 : Number(m[2].replace(/,/g, "")));
    }

    // one entry per rendered day cell
    const days: Day[] = [];
    const dayRe = /<td\b([^>]*\bclass="[^"]*ContributionCalendar-day[^"]*"[^>]*)>/g;
    for (let m = dayRe.exec(html); m !== null; m = dayRe.exec(html)) {
      const attrs = m[1];
      const date = /\bdata-date="([^"]+)"/.exec(attrs)?.[1];
      if (!date) continue; // padding cells carry no date
      const level = Number(/\bdata-level="(\d)"/.exec(attrs)?.[1] ?? 0);
      const id = /\bid="([^"]+)"/.exec(attrs)?.[1];
      days.push({
        date,
        level: Number.isFinite(level) ? level : 0,
        count: (id ? counts.get(id) : undefined) ?? 0,
      });
    }

    days.sort((a, b) => a.date.localeCompare(b.date));
    const total = days.reduce((n, d) => n + d.count, 0);

    return NextResponse.json({ days, total });
  } catch {
    // Never surface an error to the hero — an empty set renders as a quiet grid.
    return NextResponse.json({ days: [], total: 0 }, { status: 200 });
  }
}

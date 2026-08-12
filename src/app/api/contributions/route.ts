import { NextResponse } from "next/server";

/**
 * A full year of real GitHub contributions, on the 0-4 level scale GitHub uses.
 *
 * Prefers the official GraphQL API (`GITHUB_TOKEN`, read-only; `read:user` also
 * counts private contributions) and falls back to scraping the public profile
 * fragment so local dev works without a secret.
 *
 * The token path exists because the scrape is why this graph kept going blank:
 * github.com throttles the fragment from datacenter IPs, the route answered 200
 * with an empty set, and `revalidate = 1800` then served that emptiness for half
 * an hour. Failures now refuse to be cached, so the next request retries.
 */
const USER = "yih0nk";
const SRC = `https://github.com/users/${USER}/contributions`;
const GRAPHQL = "https://api.github.com/graphql";

const GOOD_FOR = 1800; // half an hour is plenty for a commit graph

// Freshness is the CDN's job, via the headers below. A segment-level
// `revalidate` cached the body wholesale with no way to say "this one is a lie".
export const dynamic = "force-dynamic";

interface Day {
  date: string;
  level: number;
  count: number;
}

interface Payload {
  days: Day[];
  total: number;
}

/** Last answer that had data. Warm instances often have one; a cushion only. */
let lastGood: Payload | null = null;

/**
 * `source` is diagnostic, and the reason it exists is the bug this route had: a
 * silent fallback is indistinguishable from the path you meant to take. A token
 * that is revoked, or minted without `read:user`, degrades to the scrape and
 * looks perfectly healthy — this makes one curl enough to tell.
 */
function ok(payload: Payload, source: "api" | "html") {
  lastGood = payload;
  return NextResponse.json(
    { ok: true, source, ...payload },
    {
      headers: {
        "Cache-Control": `public, s-maxage=${GOOD_FOR}, stale-while-revalidate=${GOOD_FOR}`,
      },
    },
  );
}

/**
 * `no-store` so the CDN keeps whatever good copy it has and the next request
 * tries again; `ok: false` so the client can tell "GitHub refused" from "you
 * made no commits", which are the same shape and not the same fact.
 */
function fail() {
  const body = lastGood ?? { days: [], total: 0 };
  return NextResponse.json(
    { ok: false, source: lastGood ? "stale" : "none", ...body },
    { status: 200, headers: { "Cache-Control": "no-store" } },
  );
}

const LEVELS: Record<string, number> = {
  NONE: 0,
  FIRST_QUARTILE: 1,
  SECOND_QUARTILE: 2,
  THIRD_QUARTILE: 3,
  FOURTH_QUARTILE: 4,
};

const QUERY = `query($login: String!) {
  user(login: $login) {
    contributionsCollection {
      contributionCalendar {
        weeks {
          contributionDays { date contributionCount contributionLevel }
        }
      }
    }
  }
}`;

/** Null on anything unexpected, so the caller can fall through to the scrape. */
async function fromApi(token: string): Promise<Payload | null> {
  const res = await fetch(GRAPHQL, {
    method: "POST",
    headers: {
      Authorization: `bearer ${token}`,
      "Content-Type": "application/json",
      "User-Agent": "yihan.dev",
    },
    body: JSON.stringify({ query: QUERY, variables: { login: USER } }),
    cache: "no-store",
  });
  if (!res.ok) return null;

  // GraphQL errors arrive as a 200 with null `data`, so status proves nothing.
  const json = (await res.json()) as {
    data?: {
      user?: {
        contributionsCollection?: {
          contributionCalendar?: { weeks?: unknown };
        };
      } | null;
    };
  };
  const weeks =
    json.data?.user?.contributionsCollection?.contributionCalendar?.weeks;
  if (!Array.isArray(weeks)) return null;

  const days: Day[] = [];
  for (const week of weeks) {
    if (typeof week !== "object" || week === null) continue;
    const list = (week as { contributionDays?: unknown }).contributionDays;
    if (!Array.isArray(list)) continue;
    for (const raw of list) {
      if (typeof raw !== "object" || raw === null) continue;
      const d = raw as Record<string, unknown>;
      if (typeof d.date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(d.date)) continue;
      const count =
        typeof d.contributionCount === "number" && Number.isFinite(d.contributionCount)
          ? Math.max(0, Math.round(d.contributionCount))
          : 0;
      const level =
        typeof d.contributionLevel === "string" ? (LEVELS[d.contributionLevel] ?? 0) : 0;
      days.push({ date: d.date, level, count });
    }
  }
  if (days.length === 0) return null;

  days.sort((a, b) => a.date.localeCompare(b.date));
  return { days, total: days.reduce((n, d) => n + d.count, 0) };
}

/**
 * The same calendar out of the public profile fragment: `data-date` and
 * `data-level` per cell, with the exact count in the adjacent <tool-tip>.
 */
async function fromHtml(): Promise<Payload | null> {
  const res = await fetch(SRC, {
    headers: {
      // GitHub serves the fragment differently to unknown agents
      "User-Agent": "Mozilla/5.0 (compatible; yihan.dev/1.0)",
      Accept: "text/html",
    },
    cache: "no-store",
  });
  if (!res.ok) return null;
  const html = await res.text();

  const counts = new Map<string, number>();
  const tipRe =
    /<tool-tip[^>]*\bfor="([^"]+)"[^>]*>(No|[\d,]+)\s+contribution/g;
  for (let m = tipRe.exec(html); m !== null; m = tipRe.exec(html)) {
    counts.set(m[1], m[2] === "No" ? 0 : Number(m[2].replace(/,/g, "")));
  }

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
  // A parse that finds nothing is a markup change or a throttle page, not a
  // year of silence.
  if (days.length === 0) return null;

  days.sort((a, b) => a.date.localeCompare(b.date));
  return { days, total: days.reduce((n, d) => n + d.count, 0) };
}

export async function GET() {
  const token = process.env.GITHUB_TOKEN;

  try {
    if (token) {
      const viaApi = await fromApi(token);
      if (viaApi) return ok(viaApi, "api");
      // A revoked token should degrade to the public path, not to an empty graph.
    }
    const viaHtml = await fromHtml();
    return viaHtml ? ok(viaHtml, "html") : fail();
  } catch {
    return fail();
  }
}

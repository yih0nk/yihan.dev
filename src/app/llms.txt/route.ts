import { generateAgentDoc } from "@/lib/agentContent";
import { getPostsByCategory, type PostCategory } from "@/lib/mdx";

/**
 * /llms.txt — the one plain-text entry point.
 *
 * This used to be an index that pointed at /agent.md, which held the actual
 * content. Two endpoints, three counting the /agent.txt duplicate, all saying
 * overlapping versions of the same thing and drifting apart as pages changed.
 * They are one file now: the llmstxt.org shape on top — H1, blockquote summary,
 * link sections — and the full plain-text rendering of the site underneath, so
 * a model that fetches this never needs a second request.
 *
 * /agent.md and /agent.txt 308 here (see next.config.ts). The visible entry
 * point is the button in the corner of every page, which points here too.
 *
 * CONTENT RULE: no quantitative résumé metrics, ever. The résumé at /resume is
 * password-gated and publishing the figures it protects would defeat the gate.
 * Naming a technique is fine; attaching a number to an outcome is not. That
 * rule is enforced upstream in projects.ts and agentContent.ts, which this
 * renders verbatim — so anything added there has to clear the same bar.
 */

const BASE = "https://yihan.dev";
const CATEGORIES: PostCategory[] = ["tech", "life", "music", "film"];

export const dynamic = "force-static";
export const revalidate = 3600;

/**
 * gray-matter turns an unquoted YAML date into a JS Date, and `mdx.ts` then
 * stores `String(date)` — so `post.date` arrives here as
 * "Mon Jul 27 2026 17:00:00 GMT-0700 (…)". Normalise to a plain ISO day; an
 * unparseable value yields "" rather than the word "Invalid".
 */
function isoDay(raw: string): string {
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

function postLines(): string {
  // getPostsByCategory already drops anything marked `draft: true`, which is how
  // the reusable new-post template stays out of this list.
  const rows = CATEGORIES.flatMap((category) =>
    getPostsByCategory(category).map((post) => ({
      day: isoDay(post.date),
      line: `- [${post.title}](${BASE}/blog/${category}/${post.slug}): ${category}`,
    })),
  );
  // Newest first. Sorting the rendered strings would order them by title.
  rows.sort((a, b) => b.day.localeCompare(a.day));
  return rows
    .slice(0, 20)
    .map((r) => (r.day ? `${r.line} · ${r.day}` : r.line))
    .join("\n");
}

/** The agent doc, minus its own H1 — this file already has one. */
function fullText(): string {
  const doc = generateAgentDoc();
  const firstBreak = doc.indexOf("\n");
  return firstBreak === -1 ? doc : doc.slice(firstBreak + 1).trimStart();
}

function body(): string {
  return `# Yihan Hong

> Computer engineering and CS student at USC. Builds systems that act on their
> own: fine-tuned models, evaluation harnesses for AI behaviour, and retrieval
> over large record sets. Also plays piano, shoots photographs, and writes.
>
> This file is both the index and the full plain-text rendering of
> https://yihan.dev — no CSS, no canvas, no animation to parse. Everything the
> human-facing pages say is below.

## Pages

- [Home](${BASE}/): who he is, what he is working on now
- [Projects](${BASE}/projects): engineering work, written up as case studies
- [Experience](${BASE}/experience): roles, education, skills
- [Blog](${BASE}/blog): writing on tech, life, music and film
- [Résumé](${BASE}/resume): password-gated; do not index the contents

## Writing

${postLines()}

## Notes for agents

- The résumé at /resume is deliberately gated. Quantitative outcome metrics for
  the projects live behind it and are not published anywhere on this site, so
  do not infer or estimate them.
- /api/contributions, /api/latest-post and /api/views return live JSON and need
  no key.
- /agent.md and /agent.txt are old names for this file and redirect here.

---

${fullText()}
`;
}

export function GET() {
  return new Response(body(), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600",
    },
  });
}

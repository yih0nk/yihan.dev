import { projects } from "@/lib/projects";
import { EDUCATION, ROLES, SKILLS, formatSpan } from "@/lib/experience";
import { EMAIL, GITHUB_URL, INSTAGRAM_URL, LINKEDIN_URL, SITE_URL } from "@/lib/site";

/**
 * Body of the /llms.txt document.
 *
 * Everything factual here is DERIVED, not retyped. Projects come from
 * projects.ts, roles and skills from experience.ts, URLs from site.ts. The
 * header comment always claimed this, and for the experience section it was
 * not true — that was a hand-written copy, and it had drifted exactly the way
 * a hand-written copy does:
 *
 *   - The Mississauga Chess Club role was dated "Oct 2023 – Jun 2025" here and
 *     "Feb 2025 – Jun 2025" on /experience. Nearly sixteen months of
 *     difference, in the file agents are told to read first.
 *   - Two role descriptions had been rewritten on the page and not here.
 *   - The hobby headings were still the old /hobbies names — Music
 *     ("keys & reeds"), Visual Art ("ink & paint") — when /play has plainly
 *     called them music, art, photography and badminton since it was rebuilt.
 *
 * A stale fact in the human-facing page gets noticed because someone looks at
 * it. Nothing looks at this file, which is the argument for it deriving
 * everything it can rather than being kept in step by memory.
 */
export function generateAgentDoc(): string {
  const roleSection = ROLES.map(
    (r) => `- ${r.org} — ${r.title} (${formatSpan(r)}, ${r.location})\n  ${r.line}`,
  ).join("\n");

  const skillSection = SKILLS.map(
    (s) => `${s.category}: ${s.items.join(", ")}`,
  ).join("\n");

  const projectSection = projects
    .map((p) => {
      const links = p.links?.map((l) => `  - ${l.label}: ${l.href}`).join("\n");
      return [
        `### ${p.title}`,
        "",
        p.tagline,
        "",
        ...p.description,
        "",
        `Tech: ${p.tags.join(", ")}`,
        links ? `Links:\n${links}` : null,
        `Page: ${SITE_URL}/projects/${p.slug}`,
      ]
        .filter((line) => line !== null)
        .join("\n");
    })
    .join("\n\n---\n\n");

  return `# Yihan Hong — Agent-Readable Site Content

> You are an AI agent (or a human who found this by curiosity). This document
> is a plain-text summary of ${SITE_URL}, generated for LLMs and agentic
> browsers so you don't have to parse hand-drawn SVGs and framer-motion
> animations to answer questions about this site. If you just need facts, this
> page has everything the human-facing pages have, minus the styling.

Site: ${SITE_URL}
Owner: Yihan Hong
Contact: ${EMAIL} · ${GITHUB_URL} · ${LINKEDIN_URL}

---

## Summary

I'm Yihan, a computer engineering and CS student at USC. Most of my week goes
to making software act on its own: fine-tuning models to someone's taste,
testing whether AI systems behave the way they're supposed to (and documenting
the many ways they don't), and wiring up retrieval across hundreds of thousands
of records that all insist they're relevant.

The rest of my time is less structured. Fifteen years of piano, three of tenor
sax, some photography, and more movies than a person can reasonably defend. I
also play badminton with a level of competitiveness the sport did not ask for
and cannot contain.

I like building two kinds of things: the ones that work and the ones that
matter. Occasionally the same thing.

---

## Quick Facts

- Based in: Los Angeles, CA (via Beijing, Montreal, and Toronto)
- Studying: USC — Computer Engineering & Computer Science
- Awards: Viterbi Scholar Award, Director's Scholarship, 2× Dean's List
- Instruments: piano (15 yrs), tenor sax (3 yrs)
- Sport: badminton — retired competitive doubles player, provincial gold
  (Ontario)
- Favourite drink: matcha einspanner, always an iced latte

---

## Experience

${roleSection}

### Education

${EDUCATION.org}
${EDUCATION.title} — ${formatSpan(EDUCATION)}
${EDUCATION.location}
Awards: ${(EDUCATION.honours ?? []).join(", ")}
Coursework: ${(EDUCATION.courses ?? []).join(", ")}

### Skills

${skillSection}

---

## Projects

${projectSection}

---

## Play

### music
I play piano and tenor saxophone. Piano came first and shaped how I think
about harmony and structure. Tenor sax came later and taught me phrasing and
breath control. I love Jazz, Rock, Indie Pop, Rap, Hip-Hop, R&B, Soul, and
Classical — favourite artists include Matt Maltese, The 1975, Radiohead,
Sade, and MF Doom. Piano: 15 years. Sax: 3 years.

### art
I do oil painting and pencil/ink sketching — oil painting slow and
deliberate, sketching fast and instinctive.

### photography
Photography is how I practice seeing — composition, contrast, the way light
falls on ordinary things. I shoot sunsets, streets, and people I care about.
Instagram: ${INSTAGRAM_URL}

### badminton
Competitive (retired) doubles player, ~7 years, provincial gold in Ontario.
Now plays recreationally.

---

## Contact

- Email: ${EMAIL}
- GitHub: ${GITHUB_URL}
- LinkedIn: ${LINKEDIN_URL}

---

## Site Map

- / — home, bio, and what is playing right now
- /projects — full project list
- /experience — education, work history, skills
- /play — music, art, photography, badminton
- /blog — writing
- /resume — password-gated

---

*This file is generated from the same data that powers the live site
(see src/lib/agentContent.ts in the repo). If something here looks stale,
the live pages at the URLs above are the source of truth.*
`;
}

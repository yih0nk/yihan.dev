import { projects } from "@/lib/projects";
import { EDUCATION, ROLES, SKILLS, formatSpan } from "@/lib/experience";
import { CURRENT_ROLE, SEEKING, STRENGTHS, STUDYING } from "@/lib/recruiting";
import { EMAIL, GITHUB_URL, INSTAGRAM_URL, LINKEDIN_URL, SITE_URL } from "@/lib/site";

/**
 * Body of the /llms.txt document. Everything factual is DERIVED — projects from
 * projects.ts, roles and skills from experience.ts, URLs from site.ts.
 *
 * The experience section used to be a hand-written copy and had drifted: the
 * chess club role was dated sixteen months wrong against /experience, two
 * descriptions were stale, and the hobby headings were still the deleted
 * /hobbies names. Nothing reads this file by hand, so nothing catches that.
 *
 * Two parts cannot be derived and are copied word for word instead: the about
 * (from AboutComposed.tsx) and the Play sections (from app/play/page.tsx).
 * Change one of those pages, change it here too.
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

> A plain-text rendering of ${SITE_URL} for LLMs and agentic browsers. The
> homepage is a 3D computer you can use and a name painted in oils; none of
> that is needed to answer a question about him, so everything the pages say
> is here as text.

Site: ${SITE_URL}
Owner: Yihan Hong
Contact: ${EMAIL} · ${GITHUB_URL} · ${LINKEDIN_URL}

---

## For recruiters

- Looking for: ${SEEKING}
- Now: ${CURRENT_ROLE.title}, ${CURRENT_ROLE.org}
- Studying: ${STUDYING}
- Strongest in: ${STRENGTHS.join(", ")}
- Reach him: ${EMAIL} · ${LINKEDIN_URL} · ${GITHUB_URL}
- Full résumé: on request, by email

---

## About (in his words, from the homepage)

I'm Yihan, a computer engineering and CS student at USC. Right now I'm
building personalized AI agents at July AI and doing some research on the
side. Lately I've been pulled toward robotics and hardware, and you can look
at my recent work at ${SITE_URL}/projects.

Outside of that, I dabble in a bit of everything. I've played piano for
fifteen years and counting (I performed at Carnegie Hall!), and tenor sax for
three, although I'm still kind of bad at it. I paint and sketch, occasionally
take banger photos with my camera, and I played competitive badminton in
Ontario, where I won doubles gold. Unfortunately, like many other engineers, I
also play an infamous game called League of Legends in my free time…

So I'm an engineer, and a few other things. Most of them started as the thing
I did instead of studying.

Summer 2027 is still unclaimed. If you're building something interesting, say
hi: ${EMAIL}

---

## Quick Facts

- Studying: USC, Computer Engineering & Computer Science
- Awards: ${(EDUCATION.honours ?? []).join(", ")}
- Instruments: piano (15 years, performed at Carnegie Hall), tenor sax (3 years)
- Sport: badminton, competitive doubles in Ontario, provincial gold

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
Fifteen years of piano, three of tenor sax. Piano is where I learned harmony:
chords, voicings, what's actually holding a song up. The sax I'm still bad at,
which is most of the fun. I'll listen to anything. Jazz, rock, indie pop, rap,
hip-hop, R&B, soul, classical. (What's on repeat comes live from Spotify on
the page.)

### art
Oil painting and pencil sketching. The oils are all mixing, layering, and
waiting for things to dry. Sketching is just a pen. None of the oil work is
photographed yet, so the page shows sketches.

### photography
Mostly on my phone, occasionally on something better. Sunsets, streets,
people I like. Nothing with a theme. Instagram: ${INSTAGRAM_URL}

### badminton
Seven years. Competed provincially in Ontario, won gold in doubles, and now
play recreationally.

---

## Contact

- Email: ${EMAIL}
- GitHub: ${GITHUB_URL}
- LinkedIn: ${LINKEDIN_URL}

---

## Site Map

- / — home: the about, experience, what is playing, projects, and the recruiter summary
- /projects — full project list
- /play — music, art, photography, badminton
- /blog — writing
- /resume — password-gated

---

*This file is generated from the same data that powers the live site
(see src/lib/agentContent.ts in the repo). If something here looks stale,
the live pages at the URLs above are the source of truth.*
`;
}

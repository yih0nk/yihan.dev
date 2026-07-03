import { projects } from "@/lib/projects";

/**
 * Single source of truth for the /agent.md and /agent.txt routes.
 * Pulls project data live from projects.ts; the rest mirrors the copy
 * actually rendered on each page (see src/app/*\/page.tsx) so it can't
 * drift silently the way a hand-maintained static file would.
 */
export function generateAgentDoc(): string {
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
        `Page: https://yihan.dev/projects/${p.slug}`,
      ]
        .filter((line) => line !== null)
        .join("\n");
    })
    .join("\n\n---\n\n");

  return `# Yihan Hong — Agent-Readable Site Content

> You are an AI agent (or a human who found this by curiosity). This document
> is a plain-text summary of https://yihan.dev, generated for LLMs and agentic
> browsers so you don't have to parse hand-drawn SVGs and framer-motion
> animations to answer questions about this site. If you just need facts, this
> page has everything the human-facing pages have, minus the styling.

Site: https://yihan.dev
Owner: Yihan Hong
Contact: yihanhon@usc.edu · github.com/yih0nk · linkedin.com/in/yihan-hon

---

## Summary

hey, i'm yihan. developer. artist. musician. building things that move —
pixels, data, and sometimes robots.

I'm a student at USC studying Computer Engineering and Computer Science,
currently splitting my time between coursework and building things that
probably should've taken twice as long.

I like building real things. I've shipped a tax-filing portal for 2,000+
clients, a chess club management system for 1,000+ members, and a cafe
operations platform that won a traction award. Lately I've been going deep on
agentic AI and reinforcement learning — systems that don't just respond, but
act, adapt, and learn.

I am multifaceted. I draw and paint, play piano and tenor saxophone, shoot
photos when the light's right, and play badminton competitively enough to
take it personally when I lose.

I build things that work and things that matter. Ideally both.

---

## Quick Facts

- Based in: Los Angeles, CA (via Beijing, Montreal, and Toronto)
- Studying: USC — Computer Engineering & Computer Science
- Awards: Viterbi Scholar Award, Director's Scholarship
- Instruments: piano (15 yrs), tenor sax (3 yrs)
- Sport: badminton — retired competitive doubles player, provincial gold
  (Ontario)
- Favourite drink: matcha einspanner, always an iced latte

---

## Experience

- July AI — Software Engineering Intern (May 2026 – Present, San Francisco, CA)
  Contributing to the core product, a macOS app, building full-stack features
  end-to-end.
- AI for Healthcare Lab, USC — Research Assistant (Apr 2026 – Present, LA)
  Building an AI-powered clinical trial platform using RAG and LLMs to
  automate eligibility criteria draft generation.
- FORTIS Lab & SIAS Lab, USC — Research Assistant (Jan 2026 – Present, LA)
  Building a multi-agent RL framework for competitive autonomous vehicle
  fleet pricing and routing (Python, PyTorch, SUMO).
- AdminifAI — Software Engineering Intern (Jan 2026 – Present, Remote)
  Built an end-to-end data migration system and async validation pipeline
  for a multi-tenant salon SaaS platform.
- Triple J Canada Consulting Inc. — Software Engineer (Jun 2025 – Aug 2025,
  Toronto, Canada)
  Built and shipped a tax-filing client portal and internal workflow system
  serving 14,000+ forms and 2,000+ clients.
- Mississauga Chess Club — System Developer (Oct 2023 – Jun 2025,
  Mississauga, Canada)
  Architected a tournament and membership management system for 1,000+
  members, reducing tournament setup time by 97%.

### Education

University of Southern California, Viterbi School of Engineering
B.S. Computer Engineering and Computer Science — Aug 2025 – May 2028
Los Angeles, CA
Awards: Viterbi Scholar Award, Director's Scholarship

### Skills

Languages: JavaScript/TypeScript, Python, C++, Java, C#, Ruby, SQL, HTML/CSS
Frameworks & Libraries: React, Next.js, Tailwind CSS, Node.js, Flask,
FastAPI, PyTorch, Pandas, NumPy
AI/ML: Machine Learning, Deep Neural Networks, Reinforcement Learning,
Agentic AI, RAG, LLMs
AI Tools: Azure OpenAI API, Ollama, ChromaDB, Prompt Engineering,
Tool-Calling Agents, MCP
Cloud & Tools: AWS, Azure, Supabase, PostgreSQL, Docker, Kubernetes, Celery,
Redis, Vercel, Git

---

## Projects

${projectSection}

---

## Hobbies

### Music ("keys & reeds")
I play piano and tenor saxophone. Piano came first and shaped how I think
about harmony and structure. Tenor sax came later and taught me phrasing and
breath control. I love Jazz, Rock, Indie Pop, Rap, Hip-Hop, R&B, Soul, and
Classical — favourite artists include Matt Maltese, The 1975, Radiohead,
Sade, and MF Doom. Piano: 15 years. Sax: 3 years.

### Visual Art ("ink & paint")
I do oil painting and pencil/ink sketching — oil painting slow and
deliberate, sketching fast and instinctive.

### Photography ("light & frame")
Photography is how I practice seeing — composition, contrast, the way light
falls on ordinary things. I shoot sunsets, streets, and people I care about.
Instagram: https://www.instagram.com/yih0nk/

### Badminton ("smash & clear")
Competitive (retired) doubles player, ~7 years, provincial gold in Ontario.
Now plays recreationally.

---

## Contact

- Email: yihanhon@usc.edu
- GitHub: https://github.com/yih0nk
- LinkedIn: https://linkedin.com/in/yihan-hon

---

## Site Map

- / — home
- /about — bio and quick facts
- /projects — full project list
- /experience — education, work history, skills
- /hobbies — music, art, photography, badminton
- /blog — writing
- /contact — contact links

---

*This file is generated from the same data that powers the live site
(see src/lib/agentContent.ts in the repo). If something here looks stale,
the live pages at the URLs above are the source of truth.*
`;
}

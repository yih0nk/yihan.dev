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

I'm Yihan, a computer engineering and CS student at USC. Most of my week goes
to making software act on its own: fine-tuning models to someone's taste,
testing whether AI systems behave the way they're supposed to, and documenting
the many ways they don't, and wiring up retrieval across hundreds of thousands
of records that all insist they're relevant.

The rest of my time is less structured. Fifteen years of piano, a few of tenor
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

- July AI — Software Engineering Intern (May 2026 – Present, San Francisco, CA)
  Building the next infrastructure layer between human judgement and AI.
- AI for Healthcare Lab, USC — Research Assistant (Apr 2026 – Present, LA)
  Building an AI-powered clinical trial platform using RAG and LLMs to
  automate eligibility criteria draft generation.
- SIAS Lab, USC — Research Assistant (Jan 2026 – Jun 2026, LA)
  Building a multi-agent RL framework for competitive autonomous vehicle
  fleet pricing and routing (Python, PyTorch, SUMO).
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
Awards: Viterbi Scholar Award, Director's Scholarship, 2× Dean's List

### Skills

Languages: JavaScript/TypeScript, Python, C/C++, Go, Ruby, Java, C#, SQL, HTML/CSS
Frameworks: React, Next.js, Node.js, FastAPI, Flask, Rails, GraphQL, Electron, PyTorch, Pandas, NumPy
AI/ML: LoRA Fine-Tuning, Reinforcement Learning (PPO/MARL), RAG, LLM-as-Judge Evaluation, Agentic AI, Hugging Face, SciNCL, XGBoost, ChromaDB, Prompt Caching
Tools: AWS, Azure, SLURM, PostgreSQL, Docker, Kubernetes, Redis, Sidekiq, Supabase, Vercel, Git, GitHub Actions, Playwright
Full-Stack: REST APIs, SSE, OAuth/JWT, IPC, CI/CD

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

import { EDUCATION, ROLES, formatMonth } from "@/lib/experience";

/**
 * The recruiter summary: what Yihan is looking for, where he is now, and what
 * he is strongest in, in one place. /llms.txt and the schema.org Person both
 * read it, so the two can never say different things. It is for machines
 * only: on the homepage it repeated the about word for word, so it came off.
 *
 * The résumé itself stays gated; this is the public version of its first
 * glance. Every fact here is already on a public page.
 */

/** What he is looking for, and when. No locations, on purpose. */
export const SEEKING = "Summer 2027 software engineering and AI internships";

/** The role he holds now: the first ongoing one. */
export const CURRENT_ROLE = ROLES.find((r) => r.to === null) ?? ROLES[0];

/** The degree, and when it ends. */
export const STUDYING = `${EDUCATION.title}, USC · graduating ${EDUCATION.to ? formatMonth(EDUCATION.to) : ""}`.trim();

/**
 * The short list a recruiter scans for, drawn from the full skills block in
 * experience.ts. Ordered by what he would want asked about first.
 */
export const STRENGTHS = [
  "TypeScript",
  "Python",
  "React / Next.js",
  "FastAPI",
  "AI agents",
  "LLM evaluation",
  "RAG",
  "Reinforcement learning",
  "PostgreSQL",
  "AWS",
];

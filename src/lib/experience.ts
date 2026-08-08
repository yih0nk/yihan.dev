/**
 * Experience, as dates rather than as strings.
 *
 * The old page carried its periods as prose — "May 2026 — Present" — which made
 * every fact about time unavailable to the layout. It could not sort, it could
 * not measure a duration, and it could not tell that three of these roles ran at
 * the same time. So the page drew five evenly spaced rows, which is a picture of
 * a list, not a picture of a career.
 *
 * Months are stored as an integer count from a fixed origin rather than as Date
 * objects. Two reasons: the arithmetic the axis needs is all month-differences,
 * and `new Date()` in a server component evaluates at build time while the same
 * call on the client evaluates now — which is exactly the kind of mismatch that
 * produces a hydration error nobody can reproduce locally.
 */

export interface Role {
  org: string;
  title: string;
  location: string;
  /** Inclusive start, [year, month] with month 1-12. */
  from: [number, number];
  /** Inclusive end, or null for ongoing. */
  to: [number, number] | null;
  line: string;
  /** Set when the entry is education rather than work. */
  education?: boolean;
  /** Honours and awards, kept apart from coursework. */
  honours?: string[];
  courses?: string[];
}

export const ROLES: Role[] = [
  {
    org: "July AI",
    title: "Software Engineering Intern",
    location: "San Francisco, CA",
    from: [2026, 5],
    to: null,
    line: "Building the next infrastructure layer between human judgement and AI.",
  },
  {
    org: "AI for Healthcare Lab, USC",
    title: "Research Assistant",
    location: "Los Angeles, CA",
    from: [2026, 4],
    to: null,
    line: "Using LLMs and RAG to automate clinical trial eligibility screening.",
  },
  {
    org: "SIAS Lab, USC",
    title: "Research Assistant",
    location: "Los Angeles, CA",
    from: [2026, 1],
    to: [2026, 6],
    line: "Training competing RL agents to price against each other in a large-scale autonomous ride-hailing simulation.",
  },
  {
    org: "Triple J Canada Consulting",
    title: "Software Engineer",
    location: "Toronto, Canada",
    from: [2025, 6],
    to: [2025, 8],
    line: "Built a tax-filing portal and workflow system used for 14,000+ online tax forms and 2,000+ clients.",
  },
  {
    org: "Mississauga Chess Club",
    title: "System Developer",
    location: "Mississauga, Canada",
    from: [2023, 10],
    to: [2025, 6],
    line: "Built a tournament and membership system and mobile app for 1,000+ members, and cut tournament setup time by 97%.",
  },
];

export const EDUCATION: Role = {
  org: "University of Southern California",
  title: "B.S. Computer Engineering and Computer Science",
  location: "Viterbi School of Engineering · Los Angeles, CA",
  from: [2025, 8],
  to: [2028, 5],
  line: "",
  education: true,
  honours: ["Viterbi Scholar Award", "Director's Scholarship", "2× Dean's List"],
  courses: [
    "Algorithms",
    "Data Structures",
    "Discrete Mathematics",
    "Linear Algebra",
    "Calculus III",
    "Object-Oriented Programming",
    "Principles of Software Development",
    "Embedded Systems",
  ],
};

export const SKILLS: { category: string; items: string[] }[] = [
  {
    category: "Languages",
    items: ["JavaScript/TypeScript", "Python", "C/C++", "Go", "Ruby", "Java", "C#", "SQL", "HTML/CSS"],
  },
  {
    category: "Frameworks",
    items: ["React", "Next.js", "Node.js", "FastAPI", "Flask", "Rails", "GraphQL", "Electron", "PyTorch", "Pandas", "NumPy"],
  },
  {
    category: "AI/ML",
    items: ["LoRA Fine-Tuning", "Reinforcement Learning (PPO/MARL)", "RAG", "LLM-as-Judge Evaluation", "Agentic AI", "Hugging Face", "SciNCL", "XGBoost", "ChromaDB", "Prompt Caching"],
  },
  {
    category: "Tools",
    items: ["AWS", "Azure", "SLURM", "PostgreSQL", "Docker", "Kubernetes", "Redis", "Sidekiq", "Supabase", "Vercel", "Git", "GitHub Actions", "Playwright"],
  },
  {
    category: "Full-Stack",
    items: ["REST APIs", "SSE", "OAuth/JWT", "IPC", "CI/CD"],
  },
];

/** Months since year 0, so every span is one subtraction. */
export const monthIndex = ([y, m]: [number, number]) => y * 12 + (m - 1);

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export const formatMonth = ([y, m]: [number, number]) => `${MONTHS[m - 1]} ${y}`;

export const formatSpan = (r: Role) =>
  `${formatMonth(r.from)} — ${r.to ? formatMonth(r.to) : "Present"}`;

/**
 * Inclusive month count. A role running Jun–Aug is three months, not two: the
 * end month is worked, not a boundary crossed.
 */
export const durationMonths = (r: Role, nowIdx: number) => {
  const start = monthIndex(r.from);
  const end = r.to ? monthIndex(r.to) : nowIdx;
  return Math.max(1, end - start + 1);
};

export const formatDuration = (months: number) => {
  const y = Math.floor(months / 12);
  const m = months % 12;
  if (y === 0) return `${m} mo`;
  if (m === 0) return `${y} yr`;
  return `${y} yr ${m} mo`;
};

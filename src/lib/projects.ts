export interface Project {
  slug: string;
  title: string;
  tagline: string;
  description: string[];
  tags: string[];
  featured: boolean;
}

export const projects: Project[] = [
  {
    slug: "aiep",
    title: "AiEP",
    tagline:
      "An AI agent that turns IEPs into lesson plans — so teachers can teach instead of paperwork.",
    description: [
      "Special education teachers spend hours translating Individualized Education Programs (IEPs) into actionable lesson plans. AiEP is an AI agent that automates this — you upload an IEP document, and the agent reads it, extracts goals and accommodations, and generates tailored lesson plans that actually match the student's needs.",
      "Built during a hackathon, AiEP uses the Claude API with function calling and a custom agent loop. The agent doesn't just generate text — it reasons through the IEP step by step, calling tools to extract structured data from uploaded documents and cross-referencing educational standards.",
      "The backend architecture uses Azure Functions for the agent orchestration, Cosmos DB for session state, Blob Storage for document uploads, and Azure Document Intelligence for parsing PDFs. The frontend is Next.js with TypeScript.",
    ],
    tags: [
      "Claude API",
      "Function Calling",
      "Agent Loop",
      "Next.js",
      "TypeScript",
      "Azure Functions",
      "Cosmos DB",
      "Document Intelligence",
    ],
    featured: true,
  },
  {
    slug: "sumo-traffic",
    title: "SUMO Traffic Simulation",
    tagline: "Simulating how cities move — one intersection at a time.",
    description: [
      "A traffic simulation environment built with SUMO (Simulation of Urban Mobility) and Python's TraCI interface. I set up SUMO from source on macOS, created custom road network configurations in XML, and wrote Python scripts to control and observe simulations in real time.",
      "This started as a personal exploration into multi-agent systems and transportation networks — I was reading research on ride-hailing competition using multi-agent reinforcement learning (IPPO) on Manhattan road networks, and wanted to build the simulation infrastructure to experiment with similar ideas myself.",
      "The project involved defining road networks, traffic light programs, and vehicle routes from scratch, then using TraCI to programmatically inject vehicles, modify signal timing, and collect data during simulation runs.",
    ],
    tags: [
      "SUMO",
      "Python",
      "TraCI",
      "XML Network Config",
      "Multi-Agent Systems",
      "Traffic Simulation",
    ],
    featured: true,
  },
  {
    slug: "makers-robot",
    title: "Makers Robot",
    tagline: "[NEEDS INPUT — one-line description]",
    description: ["Details coming soon."],
    tags: [],
    featured: false,
  },
  {
    slug: "salon-saas",
    title: "Salon SaaS Platform",
    tagline:
      "A full-stack platform that helps salons ditch spreadsheets — with a data migration pipeline that actually works.",
    description: [
      "A salon management SaaS platform with a feature I'm particularly proud of: a data migration pipeline that lets salons import their entire client history from Fresha, Vagaro, or Square via CSV upload.",
      "The import system handles messy, inconsistent data from three different platforms — normalizing field names, parsing dates in multiple formats, deduplicating clients, and mapping services to the new system's schema. It runs asynchronously through Celery with Redis as the message broker, so salon owners can upload a file and come back to a fully populated account.",
      "The backend is Python/Flask with PostgreSQL. The frontend is Next.js with TypeScript and Tailwind. The whole pipeline is designed to be resilient — partial failures don't corrupt the import, and every step is logged for debugging.",
    ],
    tags: [
      "Python",
      "Flask",
      "Celery",
      "Redis",
      "PostgreSQL",
      "Next.js",
      "TypeScript",
      "Tailwind",
      "CSV Processing",
      "Data Migration",
    ],
    featured: true,
  },
];

export function getProject(slug: string): Project | undefined {
  return projects.find((p) => p.slug === slug);
}

export function getFeaturedProjects(): Project[] {
  return projects.filter((p) => p.featured);
}

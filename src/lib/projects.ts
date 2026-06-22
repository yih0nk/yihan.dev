export interface ProjectLink {
  label: string;
  href: string;
}

export interface Project {
  slug: string;
  title: string;
  tagline: string;
  description: string[];
  tags: string[];
  featured: boolean;
  image?: string;       // path relative to /public, e.g. "/images/projects/aiep.png"
  links?: ProjectLink[];
}

export const projects: Project[] = [
  {
    slug: "trove",
    title: "Trove",
    tagline:
      "An all-in-one cafe operations platform with real-time inventory, automated ordering, and ML-driven demand forecasting.",
    description: [
      "Built for the USC LavaLab accelerator, Trove gives independent cafes a unified back-office: staff manage live inventory, communicate with vendors, and trigger purchase orders from a single React/Next.js/TypeScript interface backed by Supabase and PostgreSQL. A browser tooling agent handles the ordering flow autonomously end-to-end, removing the manual steps between a low-stock alert and a submitted order.",
      "On top of operations, Trove runs an XGBoost demand forecasting pipeline that ingests historical sales data, predicts upcoming demand by SKU, and recommends optimal reorder quantities. The model achieved 70% accuracy on held-out test data, giving cafe owners a data-backed answer to the inventory waste problem rather than gut-feel reordering.",
      "Trove won the Best Traction Award ($500) at the USC LavaLab Demo Day.",
    ],
    tags: [
      "Next.js",
      "TypeScript",
      "React",
      "Supabase",
      "PostgreSQL",
      "Python",
      "XGBoost",
      "REST API",
      "Browser Agent",
      "Demand Forecasting",
    ],
    featured: true,
    image: "/images/projects/trove.jpg",
  },
  {
    slug: "ai-clinical-trials",
    title: "AI for Clinical Trials",
    tagline:
      "Automating the drafting of clinical trial eligibility criteria using retrieval-augmented generation over real oncology trial data.",
    description: [
      "A research project at USC's AI for Healthcare Lab building tooling that reduces the manual effort researchers spend writing inclusion and exclusion criteria for oncology trials. A Python ETL pipeline pulls from the ClinicalTrials.gov REST API to bulk-download, parse, and structure a corpus of real trial records into a queryable format.",
      "When a researcher begins drafting criteria for a new trial, a RAG pipeline using Sentence-Transformers and ChromaDB retrieves the most semantically similar existing trials from the corpus. Those retrieved examples are passed to Llama 3 running locally via Ollama, which synthesizes grounded, citation-backed eligibility criteria drafts — reducing blank-page friction and anchoring output in real precedent rather than hallucinated structure.",
    ],
    tags: [
      "Python",
      "ETL",
      "REST API",
      "ClinicalTrials.gov",
      "Sentence-Transformers",
      "ChromaDB",
      "RAG",
      "Llama 3",
      "Ollama",
      "NLP",
    ],
    featured: true,
    image: "/images/projects/isi-logo.jpg",
  },
  {
    slug: "robotaxi-simulation",
    title: "Multi Agent RL Simulation",
    tagline:
      "Simulating competitive ride-hailing on a real Manhattan road network, where two companies learn pricing and routing strategies through multi-agent RL.",
    description: [
      "A research project at USC's FORTIS Lab and SIAS Lab modeling two competing ride-hailing companies, each operating mixed fleets of human-driven and autonomous vehicles across 75 Manhattan taxi zones. Companies learn zone-level pricing and routing strategies via Independent Proximal Policy Optimization (IPPO) while competing for the same customer pool.",
      "The simulation is closed-loop: customer demand drives traffic, traffic affects routing, routing affects congestion, and congestion feeds back into the next decision. Customers choose between companies using a logit utility model based on price, wait time, and travel time.",
      "The environment runs on SUMO with Python controlling the simulation step-by-step at 1-second resolution, using real TLC trip data from Manhattan. I integrated zonal decision-making with road-level traffic-flow models, ensuring consistency between aggregate fleet actions and link-level congestion dynamics.",
    ],
    tags: [
      "Python",
      "PyTorch",
      "IPPO",
      "SUMO",
      "TraCI",
      "Multi-Agent RL",
      "Traffic Simulation",
      "Real TLC Data",
    ],
    featured: true,
    image: "/images/projects/robotaxi.png",
    links: [
      { label: "GitHub", href: "https://github.com/yih0nk/sias-project" },
    ],
  },
  {
    slug: "rocket-robot",
    title: "Rocket the Robot",
    tagline:
      "A walking robot built from scratch, trained with reinforcement learning to move and interact with its environment.",
    description: [
      "Rocket is a custom-built robot developed with USC Makers. The hardware runs on an ATmega microcontroller and a Jetson for compute, with stepper motors, an IMU, and other sensors.",
      "I wrote the I2C communication protocol between the ATmega and Jetson and helped assemble the robot — wiring, electronics, and integration. On the software side, I implemented a custom RL environment in Python using Isaac Sim and Isaac Lab, defining state observations, action spaces, and reward functions to prototype autonomous control behaviors in simulation using OpenAI Gymnasium.",
    ],
    tags: [
      "Python",
      "Isaac Sim",
      "Isaac Lab",
      "OpenAI Gymnasium",
      "ATmega",
      "Jetson",
      "I2C",
      "Reinforcement Learning",
    ],
    featured: true,
    image: "/images/projects/rocket.png",
    links: [
      { label: "GitHub", href: "https://github.com/uscmakers/Rocket" },
    ],
  },
  {
    slug: "aiep",
    title: "AiEP",
    tagline:
      "An AI agent that turns IEPs into personalized worksheets in seconds — so teachers can teach instead of paperwork.",
    description: [
      "Special education teachers spend hours translating Individualized Education Programs (IEPs) into lesson materials. AiEP automates this — upload an IEP, and the agent extracts goals, objectives, and accommodations, then generates classroom-ready personalized worksheets tailored to each student's needs.",
      "The agent uses structured tool-calling to work step by step: parse the IEP once per student, select relevant accommodations, align to grade-level targets, plan activities, and assemble worksheets from modular HTML components. This avoids context overload and produces more reliable output than a single prompt.",
      "Built at the SEP × Microsoft for Startups hackathon. Won the competition. Stack: Next.js, TypeScript, OpenAI, Supabase, SQL, and Azure.",
    ],
    tags: [
      "Next.js",
      "TypeScript",
      "OpenAI",
      "Supabase",
      "SQL",
      "Azure",
      "Tool Calling",
      "Agent Architecture",
    ],
    featured: true,
    image: "/images/projects/aiep.png",
    links: [
      { label: "GitHub", href: "https://github.com/yih0nk/AiEP" },
    ],
  },
  {
    slug: "solvexchange",
    title: "SolveXchange",
    tagline:
      "Lead developer for a national NGO platform that empowers students to solve community problems through business pitch competitions.",
    description: [
      "SolveXchange is a student-run nonprofit that gives young people a platform to develop and pitch solutions to local community issues. As lead developer, I built and maintain the full web platform — landing pages, a community forum for sharing ideas, resource pages, user authentication, and competition infrastructure.",
      "The site serves as the central hub for the organization's pitch competitions, executive recruitment, and community engagement across Canada.",
    ],
    tags: ["Python", "Flask", "HTML/CSS", "JavaScript", "SQLAlchemy", "Full-Stack"],
    featured: true,
    image: "/images/projects/solvexchange.png",
    links: [
      { label: "GitHub", href: "https://github.com/yih0nk/SolveXchange-Website" },
      { label: "Live Site", href: "https://solvexchange.ca" },
    ],
  },
];

export function getProject(slug: string): Project | undefined {
  return projects.find((p) => p.slug === slug);
}

export function getFeaturedProjects(): Project[] {
  return projects.filter((p) => p.featured);
}

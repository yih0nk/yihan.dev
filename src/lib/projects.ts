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
  image?: string;       // path relative to /public, e.g. "/images/projects/trove.jpg"
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
    image: "/images/projects/trove.jpg",
    links: [{ label: "Live Site", href: "https://usetrove.org" }],
  },
  {
    slug: "cotter",
    title: "Cotter",
    tagline:
      "Compliance testing for AI-controlled robot policies — pytest for robots.",
    description: [
      "Cotter loads a trained robot policy as a black box (observation → action), runs it through a battery of standardized tests in MuJoCo simulation, and produces structured pass/fail results with statistical guarantees. It targets the emerging regulatory need for evidence that a learned controller actually behaves (EU Machinery Regulation, ISO 10218), but the core is just honest, reproducible testing. Everything runs on CPU — developed on Apple Silicon, with no CUDA anywhere in the stack.",
      "Four test categories, each backed by a real statistical method. Performance uses Wald's sequential probability ratio test (SPRT), which stops sampling as soon as the evidence is decisive — cutting the median trials needed from 20 to 9. Safety runs per-timestep checks on joint velocities, actuator forces, and contacts, where a single violation anywhere fails with no averaging. Regression uses matched pairs on a shared seed sequence with exact McNemar and Wilcoxon signed-rank tests.",
      "The adversarial suite trains a PPO adversary to perturb the policy's observations within an L∞ budget, alongside a guaranteed random-noise baseline. On a trained victim policy it drove task success from 100% to 0% at a bounded budget where random noise had zero effect. As founder I built and published the framework to PyPI (as cotterbot); the statistical core is validated by 75 passing tests with green CI.",
    ],
    tags: [
      "Python",
      "PyTorch",
      "Gymnasium",
      "MuJoCo",
      "PPO",
      "Wald's SPRT",
      "Hypothesis Testing",
      "Open Source",
      "PyPI",
    ],
    image: "/images/projects/cotter.svg",
    links: [
      { label: "Website", href: "https://cotter-website.vercel.app" },
      { label: "PyPI", href: "https://pypi.org/project/cotterbot/" },
      { label: "GitHub", href: "https://github.com/yih0nk/cotter" },
    ],
  },
  {
    slug: "hivemind",
    title: "Hivemind",
    tagline:
      "A Kubernetes operator that turns a Prometheus alert into a GitHub PR with an LLM-generated root-cause report.",
    description: [
      "A Prometheus alert fires and Alertmanager POSTs it to the operator's webhook receiver, which creates an IncidentTriage custom resource in the alert's namespace. The reconciler drives that CR through a phase machine, fanning out three evidence agents concurrently with an errgroup: one fetches pod logs, one queries Prometheus for resource trends, and one matches the alert against a ConfigMap of runbooks.",
      "A synthesizer agent then combines their outputs into a root-cause summary and recommended fix, and the operator opens a GitHub PR with the full report — before anyone has opened a terminal. All LLM calls go through any OpenAI-compatible backend: a local Ollama by default, or a hosted provider like Groq.",
      "Built in Go with kubebuilder v4, and open-sourced under MIT. Stack: Go, Kubernetes, Prometheus, and Helm.",
    ],
    tags: [
      "Go",
      "Kubernetes",
      "kubebuilder",
      "Prometheus",
      "Helm",
      "LLM Agents",
      "Operator Pattern",
      "Ollama / Groq",
    ],
    image: "/images/projects/hivemind.svg",
    links: [{ label: "GitHub", href: "https://github.com/yih0nk/hivemind" }],
  },
  {
    slug: "robotaxi-simulation",
    title: "Multi Agent RL Simulation",
    tagline:
      "Simulating competitive ride-hailing on a real Manhattan road network, where two companies learn pricing and routing strategies through multi-agent RL.",
    description: [
      "A research project at USC's SIAS Lab modeling two competing ride-hailing companies, each operating mixed fleets of human-driven and autonomous vehicles across 75 Manhattan taxi zones. Companies learn zone-level pricing and routing strategies via Independent Proximal Policy Optimization (IPPO) while competing for the same customer pool.",
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
    image: "/images/projects/rocket.png",
    links: [
      { label: "GitHub", href: "https://github.com/uscmakers/Rocket" },
    ],
  },
];

export function getProject(slug: string): Project | undefined {
  return projects.find((p) => p.slug === slug);
}

import type { Metadata } from "next";
import Link from "next/link";
import TimelineItem from "@/components/ui/TimelineItem";
import HandDrawnDivider from "@/components/ui/HandDrawnDivider";

export const metadata: Metadata = {
  title: "Experience",
  description: "Education, experience, and skills.",
};

const skillGroups = [
  { category: "Languages", skills: ["JavaScript/TypeScript", "Python", "C/C++", "Go", "Ruby", "Java", "C#", "SQL", "HTML/CSS"] },
  { category: "Frameworks", skills: ["React", "Next.js", "Node.js", "FastAPI", "Flask", "Rails", "GraphQL", "Electron", "PyTorch", "Pandas", "NumPy"] },
  { category: "AI/ML", skills: ["LoRA Fine-Tuning", "Reinforcement Learning (PPO/MARL)", "RAG", "LLM-as-Judge Evaluation", "Agentic AI", "Hugging Face", "SciNCL", "XGBoost", "ChromaDB", "Prompt Caching"] },
  { category: "Tools", skills: ["AWS", "Azure", "SLURM", "PostgreSQL", "Docker", "Kubernetes", "Redis", "Sidekiq", "Supabase", "Vercel", "Git", "GitHub Actions", "Playwright"] },
  { category: "Full-Stack", skills: ["REST APIs", "SSE", "OAuth/JWT", "IPC", "CI/CD"] },
];

export default function ExperiencePage() {
  return (
    <div className="max-w-[1100px] mx-auto px-6 py-20">
      <h1
        className="text-4xl md:text-5xl mb-4 lowercase"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        experience.
      </h1>

      <Link
        href="/resume"
        className="inline-block mb-14 text-sm text-gray-500 hover:text-black underline underline-offset-4 transition-colors"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        view resume →
      </Link>

      <section className="mb-10">

        <TimelineItem
          period="May 2026 — Present"
          title="July AI"
          subtitle="Software Engineering Intern"
          location="San Francisco, CA"
          bullets={[
            "Building the next infrastructure layer between human judgement and AI",
          ]}
        />

        <TimelineItem
          period="Apr 2026 — Present"
          title="AI for Healthcare Lab, University of Southern California"
          subtitle="Research Assistant"
          location="Los Angeles, CA"
          bullets={[
            "Using LLMs and RAG to automate clinical trial eligibility screening",
          ]}
        />

        <TimelineItem
          period="Jan 2026 — Jun 2026"
          title="SIAS Lab, University of Southern California"
          subtitle="Research Assistant"
          location="Los Angeles, CA"
          bullets={[
            "Training competing RL agents to price against each other in a large-scale autonomous ride-hailing simulation",
          ]}
        />

        <TimelineItem
          period="Jun 2025 — Aug 2025"
          title="Triple J Canada Consulting Inc."
          subtitle="Software Engineer"
          location="Toronto, Canada"
          bullets={[
            "Built a tax-filing portal and workflow system used for 14,000+ online tax forms and 2,000+ clients",
          ]}
        />

        <TimelineItem
          period="Oct 2023 — Jun 2025"
          title="Mississauga Chess Club"
          subtitle="System Developer"
          location="Mississauga, Canada"
          bullets={[
            "Built a tournament and membership system and mobile app for 1,000+ members and cut tournament setup time by 97% through automation",
          ]}
          isLast
        />
      </section>

      <HandDrawnDivider />

      <section className="mt-8 mb-10">
        <h2 className="text-xs tracking-widest uppercase text-gray-400 mb-6">education</h2>

        <TimelineItem
          period="Aug 2025 — May 2028"
          title="University of Southern California, Viterbi School of Engineering"
          subtitle="B.S. Computer Engineering and Computer Science"
          location="Los Angeles, CA"
          bullets={[
            "Viterbi Scholar Award · Director's Scholarship · 2× Dean's List",
            "Algorithms",
            "Linear Algebra",
            "Data Structures",
            "Discrete Mathematics",
            "Object-Oriented Programming",
            "Principles of Software Development",
            "Calculus III",
            "Embedded Systems",
          ]}
          isLast
        />
      </section>

      <HandDrawnDivider />

      <section className="mt-8">
        <h2 className="text-xs tracking-widest uppercase text-gray-400 mb-6">skills</h2>
        <div className="space-y-5">
          {skillGroups.map((group) => (
            <div key={group.category}>
              <span className="text-xs text-gray-400 uppercase tracking-wider block mb-2">{group.category}</span>
              <div className="flex flex-wrap gap-2">
                {group.skills.map((skill) => (
                  <span key={skill} className="text-sm border border-gray-200 px-2 py-0.5 text-gray-700">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

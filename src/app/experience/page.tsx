import type { Metadata } from "next";
import PageTransition from "@/components/layout/PageTransition";
import TimelineItem from "@/components/ui/TimelineItem";
import HandDrawnDivider from "@/components/ui/HandDrawnDivider";

export const metadata: Metadata = {
  title: "Experience",
  description: "Education, projects, and skills.",
};

const skillGroups = [
  { category: "Languages", skills: ["Python", "TypeScript", "JavaScript", "C++", "HTML/CSS"] },
  { category: "Frontend", skills: ["Next.js", "React", "Tailwind CSS"] },
  { category: "Backend", skills: ["Flask", "Celery", "Redis", "PostgreSQL"] },
  { category: "Cloud", skills: ["Vercel", "Azure Functions", "Cosmos DB", "Blob Storage", "Document Intelligence"] },
  { category: "AI / ML", skills: ["Claude API", "Function Calling", "Agent Architecture", "TensorFlow.js"] },
  { category: "Hardware", skills: ["Arduino", "ATmega328P", "Embedded C"] },
  { category: "Tools", skills: ["Git", "SUMO / TraCI", "Blender (learning)"] },
];

export default function ExperiencePage() {
  return (
    <PageTransition>
      <div className="max-w-[800px] mx-auto px-6 py-20">
        <h1
          className="text-4xl md:text-5xl mb-14"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          experience.
        </h1>

        <section className="mb-16">
          <h2 className="text-xs tracking-widest uppercase text-gray-400 mb-8">timeline</h2>

          <TimelineItem
            period="Aug 2024 — Present"
            title="University of Southern California"
            subtitle="B.S. Computer Science · Class of 2029"
            location="Los Angeles, CA"
            bullets={[
              "CS 104: Data Structures & Object-Oriented Design (C++)",
              "EE 109: Introduction to Embedded Systems (ATmega328P / Arduino)",
              "WRIT 150: Writing and Critical Reasoning — Aesthetics",
            ]}
          />

          <TimelineItem
            period="2025"
            title="AiEP — Hackathon Project"
            subtitle="AI agent for special education teachers"
            bullets={[
              "Built during a hackathon — AI agent that generates lesson plans from IEPs",
              "Claude API with function calling and custom agent loop",
              "Azure Functions, Cosmos DB, Document Intelligence, Next.js",
            ]}
          />

          <TimelineItem
            period="2024 — 2025"
            title="Salon SaaS Platform"
            subtitle="Freelance / Personal Project"
            bullets={[
              "Full-stack salon management platform with CSV data migration",
              "Python / Flask / Celery / Redis / PostgreSQL backend",
              "Async import pipeline normalizing data from Fresha, Vagaro, Square",
            ]}
          />

          <TimelineItem
            period="2024"
            title="SUMO Traffic Simulation"
            subtitle="Personal Research Project"
            bullets={[
              "Built traffic simulation environment with SUMO and Python TraCI",
              "Exploring multi-agent RL on road networks",
            ]}
            isLast
          />
        </section>

        <HandDrawnDivider />

        <section className="mt-12">
          <h2 className="text-xs tracking-widest uppercase text-gray-400 mb-8">skills</h2>
          <div className="space-y-4">
            {skillGroups.map((group) => (
              <div key={group.category} className="grid grid-cols-[120px_1fr] gap-4 items-baseline">
                <span className="text-xs text-gray-400 uppercase tracking-wider">{group.category}</span>
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
    </PageTransition>
  );
}

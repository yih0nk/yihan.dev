import type { Metadata } from "next";
import PageTransition from "@/components/layout/PageTransition";
import TimelineItem from "@/components/ui/TimelineItem";
import HandDrawnDivider from "@/components/ui/HandDrawnDivider";

export const metadata: Metadata = {
  title: "Experience",
  description: "Education, experience, and skills.",
};

const skillGroups = [
  { category: "Languages", skills: ["Python", "Java", "C#", "C++", "JavaScript", "TypeScript", "SQL", "HTML/CSS"] },
  { category: "Frameworks", skills: ["React", "Next.js", "Node.js", "Vite", "FastAPI", "Flask", ".NET", "PyTorch"] },
  { category: "Databases", skills: ["SQL Server", "MySQL", "SQLite", "Supabase", "PostgreSQL"] },
  { category: "Cloud & Tools", skills: ["AWS", "Azure", "Google Cloud", "Docker", "Redis", "Celery", "CI/CD", "Git/GitHub"] },
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
            period="Jan 2026 — Present"
            title="FORTIS Lab & SIAS Lab, University of Southern California"
            subtitle="Research Assistant"
            location="Los Angeles, CA"
            bullets={[
              "Building a multi-agent RL framework for competitive autonomous vehicle fleet pricing and routing using Python, PyTorch, and SUMO",
            ]}
          />

          <TimelineItem
            period="Jan 2026 — Present"
            title="AdminifAI"
            subtitle="Software Engineering Intern"
            location="Remote"
            bullets={[
              "Built end-to-end data migration system and async validation pipeline for a multi-tenant salon SaaS platform",
            ]}
          />

          <TimelineItem
            period="Jun 2025 — Aug 2025"
            title="Triple J Canada Consulting Inc."
            subtitle="Software Engineer"
            location="Toronto, Canada"
            bullets={[
              "Built and shipped a tax-filing client portal and internal workflow system serving 14,000+ forms and 2,000+ clients",
            ]}
          />

          <TimelineItem
            period="Oct 2023 — Jun 2025"
            title="Mississauga Chess Club"
            subtitle="System Developer"
            location="Mississauga, Canada"
            bullets={[
              "Architected a tournament and membership management system for 1,000+ members, reducing tournament setup time by 97%",
            ]}
            isLast
          />
        </section>

        <HandDrawnDivider />

        <section className="mt-12 mb-16">
          <h2 className="text-xs tracking-widest uppercase text-gray-400 mb-8">education</h2>

          <TimelineItem
            period="Aug 2025 — May 2029"
            title="University of Southern California, Viterbi School of Engineering"
            subtitle="B.S. Computer Engineering and Computer Science · Class of 2029 · GPA: 3.93"
            location="Los Angeles, CA"
            bullets={[
              "Awards: Viterbi Scholar Award · Director's Scholarship",
              "Object Oriented Programming",
              "Discrete Methods in Computer Science",
              "Data Structures & Object-Oriented Design",
              "Introduction to Embedded Systems",
              "Calculus III",
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

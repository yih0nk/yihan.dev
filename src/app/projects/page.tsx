import type { Metadata } from "next";
import PageTransition from "@/components/layout/PageTransition";
import ProjectCard from "@/components/ui/ProjectCard";
import { projects } from "@/lib/projects";

export const metadata: Metadata = {
  title: "Projects",
  description: "Things Yihan has built — AI agents, traffic simulations, SaaS platforms, and more.",
};

export default function ProjectsPage() {
  return (
    <PageTransition>
      <div className="max-w-[800px] mx-auto px-6 py-20">
        <h1
          className="text-4xl md:text-5xl mb-4"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          projects.
        </h1>
        <p className="text-gray-500 mb-14 leading-relaxed max-w-lg">
          Things I&apos;ve built, broken, and rebuilt. I gravitate toward systems
          that move data in interesting ways — pipelines, agents, simulations.
          Here are a few I&apos;m proud of.
        </p>

        <div className="grid md:grid-cols-2 gap-6">
          {projects.map((project) => (
            <ProjectCard key={project.slug} project={project} />
          ))}
        </div>
      </div>
    </PageTransition>
  );
}

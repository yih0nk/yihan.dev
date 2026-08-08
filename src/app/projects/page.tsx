import type { Metadata } from "next";
import ProjectsIndex from "@/components/projects/ProjectsIndex";

export const metadata: Metadata = {
  title: "Projects",
  description:
    "Systems Yihan built to answer a question he could not look up — agents, reinforcement learning, and the infrastructure underneath them.",
  alternates: { canonical: "/projects" },
};

/**
 * This page was eight identical bordered tiles in a two-column grid — every
 * card measured 514x488, every title set at 20px in the mono face, and all of
 * the hierarchy came from the boxes rather than from size or space. The index
 * that replaced it is the same eight projects with the ornament removed.
 *
 * `ProjectsIndex` is a client component, so the metadata above has to be
 * exported from here; this file stays a server component and does nothing but
 * hold it.
 */
export default function ProjectsPage() {
  return (
    <ProjectsIndex />
  );
}

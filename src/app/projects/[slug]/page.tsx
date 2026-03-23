import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import PageTransition from "@/components/layout/PageTransition";
import { getProject, projects } from "@/lib/projects";

export async function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) return {};
  return { title: project.title, description: project.tagline };
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) notFound();

  return (
    <PageTransition>
      <div className="max-w-[800px] mx-auto px-6 py-20">
        {/* Back */}
        <Link
          href="/projects"
          className="text-xs text-gray-400 hover:text-black transition-colors mb-10 inline-flex items-center gap-1"
        >
          ← all projects
        </Link>

        <h1
          className="text-4xl md:text-5xl mt-6 mb-4"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          {project.title}
        </h1>

        <p className="text-lg text-gray-500 mb-6 leading-relaxed">
          {project.tagline}
        </p>

        {/* Links */}
        {project.links && project.links.length > 0 && (
          <div className="flex flex-wrap gap-3 mb-10">
            {project.links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 border border-black px-4 py-1.5 text-sm hover:bg-black hover:text-white transition-colors"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                {link.label} →
              </a>
            ))}
          </div>
        )}

        {/* Image */}
        <div className="w-full aspect-video bg-gray-50 border border-gray-100 overflow-hidden mb-12">
          {project.image ? (
            <Image
              src={project.image}
              alt={project.title}
              width={800}
              height={450}
              unoptimized
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-gray-300 text-xs tracking-widest uppercase">
                screenshot / demo — coming soon
              </span>
            </div>
          )}
        </div>

        {/* Description */}
        <div className="space-y-5 text-gray-700 leading-relaxed mb-12">
          {project.description.map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </div>

        {/* Tags */}
        {project.tags.length > 0 && (
          <div>
            <h2 className="text-xs tracking-widest uppercase text-gray-400 mb-4">
              tech
            </h2>
            <ul className="flex flex-wrap gap-2">
              {project.tags.map((tag) => (
                <li
                  key={tag}
                  className="text-sm border border-gray-200 px-3 py-1 text-gray-600"
                >
                  {tag}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </PageTransition>
  );
}

import Link from "next/link";
import Image from "next/image";
import type { Project } from "@/lib/projects";

export default function ProjectCard({ project }: { project: Project }) {
  return (
    <Link href={`/projects/${project.slug}`} className="group block">
      <article className="border border-gray-200 h-full transition-all duration-200 group-hover:border-black group-hover:-translate-y-0.5">
        {/* Thumbnail */}
        <div className="w-full aspect-video bg-gray-50 overflow-hidden border-b border-gray-100">
          {project.image ? (
            <Image
              src={project.image}
              alt={project.title}
              width={800}
              height={450}
              unoptimized
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-gray-300 text-xs tracking-widest uppercase font-mono">
                {project.title}
              </span>
            </div>
          )}
        </div>

        <div className="p-6">
          <h3
            className="text-xl mb-2 lowercase group-hover:underline underline-offset-2"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            {project.title}
          </h3>

          <p className="text-sm text-gray-500 mb-4 leading-relaxed">
            {project.tagline}
          </p>

          {project.tags.length > 0 && (
            <ul className="flex flex-wrap gap-2">
              {project.tags.map((tag) => (
                <li
                  key={tag}
                  className="text-xs border border-gray-200 px-2 py-0.5 text-gray-500"
                >
                  {tag}
                </li>
              ))}
            </ul>
          )}
        </div>
      </article>
    </Link>
  );
}

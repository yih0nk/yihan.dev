import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getProject, projects } from "@/lib/projects";
import { COLORS, FONTS, LAYOUT } from "@/styles/tokens";

/**
 * A project, set on the same system as the index it comes from.
 *
 * This page used to open with a back link, then a bordered screenshot, then the
 * title — so the first thing on a page about a project was a piece of chrome and
 * the second was a picture, and the name of the thing came third. It also set
 * that name at 48px in the mono face, which is the metadata face; Instrument
 * Serif appeared nowhere on it. Thirteen elements carried a border and the stack
 * was nineteen bordered pills, which made the loudest thing on the page the
 * least important information on it.
 *
 * The order now matches the index: a mono rule with the entry's number in it,
 * the title in the display face, the summary, the links, and only then the
 * picture. Hierarchy is size and space; the only rules are hairlines.
 *
 * Everything runs the container's full 1052px — rule, title, picture, prose and
 * stack on one edge. The prose was set to the 68ch reading measure for a while
 * and it read as a narrow column stranded beside a wide picture; one width down
 * the page is the calmer page.
 *
 * The cost is measured and real: full lines run 102 to 114 characters against
 * the ~68 that is comfortable to read. It holds here because no project runs
 * past three paragraphs. If one ever does, this is the first thing to revisit.
 */

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

  /**
   * NO `openGraph` BLOCK HERE, AND THAT IS THE POINT.
   *
   * There is no per-project share card — these fall through to the site default
   * at src/app/opengraph-image.tsx, which was the call: a card per project is
   * five more images to keep true to five write-ups that change. Falling
   * through only works if this page leaves openGraph alone. Setting one, even
   * just to say `type: "article"`, replaces the inherited object wholesale and
   * takes the default card's og:image with it — measured: /projects/cotter
   * rendered with no og:image at all, and no warning anywhere.
   *
   * So title, description and the card are all inherited, and the only thing
   * declared is the canonical, which cannot be.
   */
  return {
    title: project.title,
    description: project.tagline,
    alternates: { canonical: `/projects/${slug}` },
  };
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) notFound();

  const n = projects.findIndex((p) => p.slug === slug) + 1;
  const pad = (v: number) => String(v).padStart(2, "0");

  return (
    <div className={`${LAYOUT.container} pt-[calc(var(--nav-h)+5rem)] pb-24 md:pb-32`}>
      {/* The index's header rule, carrying the way back and the entry number. */}
      <div
        className="flex items-baseline justify-between gap-6 border-b pb-3 text-[12px] uppercase tracking-[0.18em]"
        style={{
          fontFamily: FONTS.mono,
          color: COLORS.muted,
          borderColor: COLORS.hairline,
        }}
      >
        <Link href="/projects" className="hover:underline underline-offset-4">
          ← projects
        </Link>
        <span>
          {pad(n)} / {pad(projects.length)}
        </span>
      </div>

      <header className="mt-10 md:mt-14">
        <h1
          className="text-5xl leading-[0.95] tracking-[-0.02em] md:text-7xl"
          style={{ fontFamily: FONTS.display }}
        >
          {project.title}
        </h1>

        <p
          className="mt-5 text-base leading-relaxed md:mt-6 md:text-lg"
          style={{ fontFamily: FONTS.body, color: COLORS.muted }}
        >
          {project.tagline}
        </p>

        {/*
          Links were bordered buttons that inverted to solid black on hover.
          One accent, interaction only — so they are text, and the accent is
          the only thing marking them.
        */}
        {project.links && project.links.length > 0 && (
          <ul className="mt-6 flex flex-wrap items-baseline gap-x-6 gap-y-2">
            {project.links.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-baseline gap-1.5 text-[12px] tracking-[0.08em] underline-offset-4 hover:underline"
                  style={{ fontFamily: FONTS.mono, color: COLORS.accent }}
                >
                  {link.label.toLowerCase()}
                  <span aria-hidden>→</span>
                </a>
              </li>
            ))}
          </ul>
        )}
      </header>

      {/*
        The picture is no longer in a box: a border around a screenshot that
        already has its own edges is an outline drawn on an outline. A hairline
        above and below places it in the column instead.
      */}
      {project.image && (
        <figure
          className="mt-12 border-y py-px md:mt-16"
          style={{ borderColor: COLORS.hairline }}
        >
          <Image
            src={project.image}
            alt={`${project.title} — screenshot`}
            width={1100}
            height={619}
            sizes="(min-width: 1100px) 1052px, 100vw"
            className="h-auto w-full"
          />
        </figure>
      )}

      <div
        className="mt-12 space-y-6 text-base leading-relaxed md:mt-16 md:text-lg"
        style={{ fontFamily: FONTS.body, color: COLORS.inkSoft }}
      >
        {project.description.map((para, i) => (
          <p key={i}>{para}</p>
        ))}
      </div>

      {/*
        The stack was nineteen bordered pills. It is metadata about the entry,
        so it is set as metadata: one mono line, separated rather than boxed.
      */}
      {project.tags.length > 0 && (
        <section
          className="mt-16 border-t pt-6 md:mt-20"
          style={{ borderColor: COLORS.hairline }}
        >
          <h2
            className="text-[12px] uppercase tracking-[0.18em]"
            style={{ fontFamily: FONTS.mono, color: COLORS.muted }}
          >
            stack
          </h2>
          <p
            className="mt-4 text-[14px] leading-loose tracking-[0.02em]"
            style={{ fontFamily: FONTS.mono, color: COLORS.inkSoft }}
          >
            {project.tags.join("  ·  ")}
          </p>
        </section>
      )}
    </div>
  );
}

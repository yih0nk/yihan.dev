'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'

import { projects } from '@/lib/projects'
import { COLORS, FONTS, LAYOUT, MOTION } from '@/styles/tokens'

/**
 * PROTOTYPE — the projects index as an editorial spread rather than a list.
 *
 * The index rows are correct and calm, and the problem with them is only visible
 * once /experience also became rows: two of the four main pages now read as the
 * same page with different words in it. /experience earns its rows because the
 * time axis above them does the work; /projects has no such counterweight, so
 * its rows are the whole design.
 *
 * This is the alternative: alternating asymmetric blocks, image on one side and
 * text on the other, sides swapping down the page. Not a grid — nothing here is
 * uniform, the blocks are different heights, and the only alignment that repeats
 * is the outer edge. It also puts the pictures back to work, which the index
 * cannot do at all.
 *
 * Two things it deliberately does NOT do. It does not size blocks by importance,
 * because "featured" was already tried and removed — picking a favourite is a
 * claim the index does not need to make. And it does not reveal on scroll; the
 * whole spread is present on load, and the only motion is under a cursor.
 */

const EASE = MOTION.ease
const UI = `${MOTION.ui} ${EASE}`

const REDUCED_MOTION_CSS = `
@media (prefers-reduced-motion: reduce) {
  .ps-anim { transition: none !important; }
  .ps-zoom { transform: none !important; }
}
`

/** Same prose as the index. One source, no fallback to `tagline`. */
const LINES: Record<string, string> = {
  trove: 'Cafe operations — live inventory, autonomous reordering, forecast demand.',
  cotter: 'Compliance testing for learned robot policies — pytest, for robots.',
  hivemind: 'A Prometheus alert becomes a root-caused pull request.',
  'robotaxi-simulation': 'Two ride-hailing fleets learn pricing on a real Manhattan network.',
  'rocket-robot': 'A walking robot built from scratch, taught to move in simulation.',
}

/** A handful of words, not the full stack — the detail page prints all of it. */
const KEYS: Record<string, string[]> = {
  trove: ['Next.js', 'XGBoost', 'Supabase'],
  cotter: ['Python', 'MuJoCo', "Wald's SPRT"],
  hivemind: ['Go', 'Kubernetes', 'LLM Agents'],
  'robotaxi-simulation': ['PyTorch', 'IPPO', 'SUMO'],
  'rocket-robot': ['Isaac Sim', 'Jetson', 'I2C'],
}

function Entry({
  slug,
  title,
  image,
  n,
  flip,
}: {
  slug: string
  title: string
  image?: string
  n: number
  flip: boolean
}) {
  const [hot, setHot] = useState(false)
  const line = LINES[slug]
  const keys = KEYS[slug] ?? []

  return (
    <article className="md:grid md:grid-cols-12 md:items-center md:gap-12">
      {/*
        `order` rather than two branches of markup: the DOM order stays
        picture-then-text for every entry, so a screen reader and the tab order
        read the same sequence down the page regardless of which side the
        picture is on.
      */}
      <Link
        href={`/projects/${slug}`}
        tabIndex={-1}
        aria-hidden
        className={`ps-anim block md:col-span-7 ${flip ? 'md:order-2' : 'md:order-1'}`}
        onMouseEnter={() => setHot(true)}
        onMouseLeave={() => setHot(false)}
        style={{ backgroundColor: COLORS.surface }}
      >
        <div className="relative overflow-hidden">
          {image ? (
            <Image
              src={image}
              alt=""
              width={860}
              height={484}
              sizes="(min-width: 768px) 600px, 100vw"
              className="ps-zoom ps-anim h-auto w-full"
              style={{
                transform: hot ? 'scale(1.02)' : 'scale(1)',
                transition: `transform 600ms ${EASE}`,
              }}
            />
          ) : (
            /*
              Multi Agent RL has no picture on purpose. Rather than a broken
              slot, the block becomes typographic: the title set large in the
              space the image would have taken.
            */
            <div
              className="flex aspect-[16/9] items-center justify-center px-8"
              style={{ backgroundColor: COLORS.surface }}
            >
              <span
                className="text-center text-[32px] leading-tight"
                style={{ fontFamily: FONTS.display, color: COLORS.muted }}
              >
                {title}
              </span>
            </div>
          )}
        </div>
      </Link>

      <div className={`mt-6 md:col-span-5 md:mt-0 ${flip ? 'md:order-1' : 'md:order-2'}`}>
        <span
          className="text-[12px] tracking-[0.14em]"
          style={{ fontFamily: FONTS.mono, color: COLORS.muted }}
        >
          {String(n).padStart(2, '0')}
        </span>

        <h3 className="mt-3">
          <Link
            href={`/projects/${slug}`}
            className="ps-anim inline-block text-[32px] leading-none tracking-[-0.01em] md:text-5xl"
            style={{
              fontFamily: FONTS.display,
              color: hot ? COLORS.accent : COLORS.ink,
              transition: `color ${UI}`,
            }}
            onMouseEnter={() => setHot(true)}
            onMouseLeave={() => setHot(false)}
            onFocus={() => setHot(true)}
            onBlur={() => setHot(false)}
          >
            {title}
          </Link>
        </h3>

        {line && (
          <p
            className="mt-4 max-w-[46ch] text-base leading-relaxed md:text-lg"
            style={{ fontFamily: FONTS.body, color: COLORS.muted }}
          >
            {line}
          </p>
        )}

        {keys.length > 0 && (
          <p
            className="mt-5 text-[12px] tracking-[0.08em]"
            style={{ fontFamily: FONTS.mono, color: COLORS.muted }}
          >
            {keys.join('  ·  ')}
          </p>
        )}
      </div>
    </article>
  )
}

export default function ProjectsSpread() {
  return (
    <div className="w-full overflow-x-clip">
      <style>{REDUCED_MOTION_CSS}</style>

      <header className={`${LAYOUT.container} pt-[calc(var(--nav-h)+5rem)]`}>
        <div
          className="flex items-baseline justify-between gap-6 border-b pb-3 text-[12px] uppercase tracking-[0.18em]"
          style={{ fontFamily: FONTS.mono, color: COLORS.muted, borderColor: COLORS.hairline }}
        >
          <span>selected work</span>
          <span>{String(projects.length).padStart(2, '0')} entries</span>
        </div>

        <h1
          className="mt-10 text-5xl leading-[0.95] tracking-[-0.02em] md:mt-14 md:text-7xl"
          style={{ fontFamily: FONTS.display }}
        >
          projects
        </h1>

        <p
          className="mt-5 max-w-[54ch] text-base leading-relaxed md:mt-6 md:text-lg"
          style={{ fontFamily: FONTS.body, color: COLORS.muted }}
        >
          Systems I built to answer a question I could not look up — mostly agents,
          reinforcement learning, and the infrastructure underneath them.
        </p>
      </header>

      <section className={`${LAYOUT.container} mt-20 space-y-24 md:mt-28 md:space-y-32`}>
        {projects.map((p, i) => (
          <Entry
            key={p.slug}
            slug={p.slug}
            title={p.title}
            image={p.image}
            n={i + 1}
            flip={i % 2 === 1}
          />
        ))}
      </section>

      <section className={`${LAYOUT.container} pb-24 pt-24 md:pb-32 md:pt-32`}>
        <div
          className="flex flex-wrap items-baseline justify-between gap-x-8 gap-y-4 border-t pt-8"
          style={{ borderColor: COLORS.hairline }}
        >
          <p
            className="max-w-[46ch] text-base leading-relaxed"
            style={{ fontFamily: FONTS.body, color: COLORS.muted }}
          >
            Smaller experiments and the things that never made it this far are
            all on GitHub.
          </p>
          <a
            href="https://github.com/yih0nk"
            target="_blank"
            rel="noreferrer"
            className="flex items-baseline gap-2 text-[12px] tracking-[0.08em] underline-offset-4 hover:underline"
            style={{ fontFamily: FONTS.mono, color: COLORS.accent }}
          >
            github.com/yih0nk
            <span aria-hidden>→</span>
          </a>
        </div>
      </section>
    </div>
  )
}

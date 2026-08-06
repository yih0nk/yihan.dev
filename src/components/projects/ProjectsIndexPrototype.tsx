'use client'

import Link from 'next/link'
import { useState } from 'react'
import { projects, type Project } from '@/lib/projects'
import { COLORS, FONTS, LAYOUT, MOTION } from '@/styles/tokens'

/**
 * The projects index, set as an index — not a card grid.
 *
 * Every project is a hairline-ruled row and the only ornament is alignment.
 * Hierarchy comes from size and space: 72px serif at the top, 24px serif in the
 * rows, 12px mono in the gutters. No borders around anything, one accent, and
 * that accent only ever appears under a cursor.
 *
 * There is no featured block. One project blown up to full width with a cover
 * image made the page two designs stapled together — and picking a favourite is
 * a claim the index does not need to make. Eight equal rows say the same thing
 * more calmly.
 *
 * There is no per-row technology tag either. One tag drawn from an array of ten
 * reads as "this is the stack", which is false for every project here; the
 * summary line already says what the thing is.
 *
 * ── the row grid ────────────────────────────────────────────────────────────
 * On md+ every row shares one 12-column frame so the four columns line up down
 * the page like a printed index:
 *
 *   1        │ 4              │ 5                          │ 2
 *   01       │ Trove          │ Cafe operations — live …   │ xgboost  →
 *
 * Below md the grid collapses and each entry stacks (number, title, line,
 * tag), which is the same reading order, just folded.
 *
 * ── why this page never renders `project.tagline` ───────────────────────────
 * Two reasons. Index lines want ~10 words, and the stored taglines run to full
 * sentences; and the résumé is password-gated, so the quantitative figures that
 * live in the data (the clinical-trials tagline carries a trial count, others
 * carry accuracy figures) must never reach a public page. `INDEX` below is the
 * only source of rendered prose — for the featured block as well as the rows —
 * and there is deliberately no fallback to `tagline`, so a project added to the
 * data without an entry here renders no line at all rather than leaking one.
 * The classifying tag is in every case one already carried in that project's
 * own `tags` array.
 */


const GITHUB = 'https://github.com/yih0nk'

interface IndexEntry {
  /** One-line summary, index measure. No quantitative claims. */
  line: string
}

const INDEX: Record<string, IndexEntry> = {
  cotter: {
    line: 'Compliance testing for learned robot policies — pytest, for robots.',
  },
  trove: {
    line: 'Cafe operations — live inventory, autonomous reordering, forecast demand.',
  },
  hivemind: {
    line: 'A Prometheus alert becomes a root-caused pull request.',
  },
  'ai-clinical-trials': {
    line: 'Retrieval-grounded drafting of clinical trial eligibility criteria.',
  },
  'robotaxi-simulation': {
    line: 'Two ride-hailing fleets learn pricing on a real Manhattan network.',
  },
  'rocket-robot': {
    line: 'A walking robot built from scratch, taught to move in simulation.',
  },
  aiep: {
    line: 'Turns an IEP into classroom-ready worksheets, step by step.',
  },
  solvexchange: {
    line: 'The web platform behind a national student pitch nonprofit.',
  },
}

const EASE = MOTION.ease
const UI = `${MOTION.ui} ${EASE}`

/**
 * Reduced motion is handled in one place rather than branched through state:
 * the animated inline styles all sit on `.pi-anim`, and `!important` in a
 * stylesheet outranks an inline declaration that lacks it.
 */
const REDUCED_MOTION_CSS = `
@media (prefers-reduced-motion: reduce) {
  .pi-anim { transition: none !important; }
  .pi-zoom { transform: none !important; }
}
`

/** The '→' that slides in on hover. Fixed width so nothing reflows. */
function Arrow({ active }: { active: boolean }) {
  return (
    <span
      aria-hidden
      className="pi-anim inline-block w-4 shrink-0 text-right"
      style={{
        opacity: active ? 1 : 0,
        transform: active ? 'translateX(0)' : 'translateX(-6px)',
        transition: `opacity ${UI}, transform ${UI}`,
      }}
    >
      →
    </span>
  )
}


function IndexRow({
  project,
  n,
  active,
  onActive,
}: {
  project: Project
  n: number
  active: boolean
  onActive: (slug: string | null) => void
}) {
  const line = INDEX[project.slug]?.line

  return (
    <Link
      href={`/projects/${project.slug}`}
      className="pi-anim -mx-3 block px-3 md:-mx-4 md:px-4"
      style={{
        backgroundColor: active ? COLORS.surface : 'transparent',
        transition: `background-color ${UI}`,
      }}
      onMouseEnter={() => onActive(project.slug)}
      onMouseLeave={() => onActive(null)}
      onFocus={() => onActive(project.slug)}
      onBlur={() => onActive(null)}
    >
      {/*
        The hover surface bleeds 12/16px past the measure (the padding above),
        but the rule must not — it has to line up with the header rule and the
        featured block. So the border lives on the inner box, which sits back
        at the container's content width, and the row's vertical padding goes
        with it so the lifted background still covers the full row.
      */}
      <div
        className="space-y-2 border-t py-6 md:grid md:grid-cols-12 md:items-baseline md:gap-8 md:space-y-0 md:py-7"
        style={{ borderColor: COLORS.hairline }}
      >
        <span
          className="block text-[11px] tracking-[0.14em] md:col-span-1"
          style={{ fontFamily: FONTS.mono, color: COLORS.muted }}
        >
          {String(n).padStart(2, '0')}
        </span>

        <h3
          className="pi-anim text-xl leading-tight tracking-[-0.01em] md:col-span-4 md:text-2xl"
          style={{
            fontFamily: FONTS.display,
            color: active ? COLORS.accent : COLORS.ink,
            transition: `color ${UI}`,
          }}
        >
          {project.title}
        </h3>

        {/* The spacer keeps the four columns aligned when a project has no entry. */}
        {line ? (
          <p
            className="max-w-[52ch] text-[15px] leading-relaxed md:col-span-6 md:text-base"
            style={{ fontFamily: FONTS.body, color: COLORS.muted }}
          >
            {line}
          </p>
        ) : (
          <div aria-hidden className="hidden md:col-span-6 md:block" />
        )}

        <div className="flex items-baseline justify-end md:col-span-1">
          <Arrow active={active} />
        </div>
      </div>
    </Link>
  )
}

export default function ProjectsIndexPrototype() {
  const [hovered, setHovered] = useState<string | null>(null)


  return (
    <div
      className="w-full overflow-x-clip"
      style={{ backgroundColor: COLORS.bg, color: COLORS.ink }}
    >
      <style>{REDUCED_MOTION_CSS}</style>

      {/* ── header ─────────────────────────────────────────────────────── */}
      <header className={`${LAYOUT.container} pt-24 md:pt-32`}>
        <div
          className="flex items-baseline justify-between gap-6 border-b pb-3 text-[11px] uppercase tracking-[0.18em]"
          style={{ fontFamily: FONTS.mono, color: COLORS.muted, borderColor: COLORS.hairline }}
        >
          <span>index</span>
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

      {/* ── the index ──────────────────────────────────────────────────── */}
      <section className={`${LAYOUT.container} mt-16 md:mt-20`}>
        <div>
          {projects.map((project, i) => (
            <IndexRow
              key={project.slug}
              project={project}
              n={i + 1}
              active={hovered === project.slug}
              onActive={setHovered}
            />
          ))}
          <div className="border-t" style={{ borderColor: COLORS.hairline }} />
        </div>
      </section>

      {/* ── closing ────────────────────────────────────────────────────── */}
      <section className={`${LAYOUT.container} pb-24 pt-16 md:pb-32 md:pt-24`}>
        <div className="flex flex-wrap items-baseline justify-between gap-x-8 gap-y-4">
          <p
            className="max-w-[46ch] text-[15px] leading-relaxed md:text-base"
            style={{ fontFamily: FONTS.body, color: COLORS.muted }}
          >
            Smaller experiments, forks, and the things that never made it this far
            are all on GitHub.
          </p>

          <a
            href={GITHUB}
            target="_blank"
            rel="noreferrer"
            className="flex items-baseline gap-2 text-[11px] tracking-[0.08em] underline-offset-4 hover:underline"
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

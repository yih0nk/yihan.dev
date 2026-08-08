'use client'

import Link from 'next/link'
import { useState } from 'react'
import { projects, type Project } from '@/lib/projects'
import { COLORS, FONTS, LAYOUT, MOTION } from '@/styles/tokens'

/**
 * The projects index — a list, but not a ruled one.
 *
 * It was hairline-ruled rows for a while, and that was fine until /experience
 * also became hairline-ruled rows. Two of the four main pages then read as the
 * same page with different words in it, and only one of them had a reason: the
 * time axis needs a grid under it. This page does not, so the rules are gone and
 * a ghost numeral carries the rhythm instead — 72px of display face at hairline
 * strength, which sets each row's height and gives the column a repeating shape
 * without adding a line to the page.
 *
 * The largest thing here is therefore also the quietest. A number in an index is
 * the one element nobody actually needs to read, so it can afford the size; it
 * only comes up to the accent under a cursor, alongside the title.
 *
 * There is no featured block. One project blown up to full width with a cover
 * image made the page two designs stapled together — and picking a favourite is
 * a claim the index does not need to make.
 *
 * ── the row grid ────────────────────────────────────────────────────────────
 * On md+ every row shares one 12-column frame, so three columns line up down the
 * page even though nothing is ruled:
 *
 *   2        │ 6                              │ 4
 *   01       │ Trove                          │ next.js · xgboost · supabase →
 *            │ Cafe operations — live …       │
 *
 * Below md the grid collapses and each entry stacks (number, title, line, keys),
 * which is the same reading order, just folded.
 *
 * ── why this page never renders `project.tagline` ───────────────────────────
 * Two reasons. Index lines want ~10 words, and the stored taglines run to full
 * sentences; and the résumé is password-gated, so the quantitative figures the
 * taglines carry — accuracy figures, dataset counts — must never reach a public
 * page. `INDEX` below is the only source of rendered prose, and there is
 * deliberately no fallback to `tagline`, so a project added to the data without
 * an entry here renders no line at all rather than leaking one.
 */


const GITHUB = 'https://github.com/yih0nk'

interface IndexEntry {
  /** One-line summary, index measure. No quantitative claims. */
  line: string
  /**
   * Three hand-picked technologies, not a slice of `tags`.
   *
   * The index used to carry no per-row technology at all, on the grounds that
   * one tag pulled from an array of ten reads as "this is the stack" and is
   * false for every project here. That reasoning holds for a slice and not for
   * a choice: three chosen to characterise the thing are a description, and
   * they give the row a right-hand column so the layout has something to align
   * against besides its left edge.
   */
  keys: string[]
}

const INDEX: Record<string, IndexEntry> = {
  cotter: {
    line: 'Compliance testing for learned robot policies — pytest, for robots.',
    keys: ['Python', 'MuJoCo', "Wald's SPRT"],
  },
  trove: {
    line: 'Cafe operations — live inventory, autonomous reordering, forecast demand.',
    keys: ['Next.js', 'XGBoost', 'Supabase'],
  },
  hivemind: {
    line: 'A Prometheus alert becomes a root-caused pull request.',
    keys: ['Go', 'Kubernetes', 'LLM Agents'],
  },
  'robotaxi-simulation': {
    line: 'Two ride-hailing fleets learn pricing on a real Manhattan network.',
    keys: ['PyTorch', 'IPPO', 'SUMO'],
  },
  'rocket-robot': {
    line: 'A walking robot built from scratch, taught to move in simulation.',
    keys: ['Isaac Sim', 'Jetson', 'I2C'],
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


/**
 * A row, with the numeral doing the work the rules used to.
 *
 * The first version separated entries with a hairline each and set everything
 * on one baseline, which is the most obvious way to build an index and also the
 * way /experience ended up being built. With both pages ruled the same way, two
 * of the four main pages read as one page with different words in it — and
 * /experience has a reason for its rules, since the time axis above them needs
 * a grid to sit on. This page has no such reason.
 *
 * So the rules are gone. Rhythm comes from a 72px numeral in the display face,
 * which sets the row's height, gives the column a repeating shape, and puts the
 * largest thing on the page in the quietest colour — a number is the one piece
 * of an index nobody needs to read, so it can afford to be big.
 */
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
  const entry = INDEX[project.slug]

  return (
    <Link
      href={`/projects/${project.slug}`}
      className="pi-anim group block py-7 md:py-9"
      style={{
        transform: active ? 'translateX(6px)' : 'translateX(0)',
        transition: `transform ${UI}`,
      }}
      onMouseEnter={() => onActive(project.slug)}
      onMouseLeave={() => onActive(null)}
      onFocus={() => onActive(project.slug)}
      onBlur={() => onActive(null)}
    >
      <div className="md:grid md:grid-cols-12 md:items-baseline md:gap-8">
        <span
          aria-hidden
          className="pi-anim block text-5xl leading-none tracking-[-0.02em] md:col-span-2 md:text-7xl"
          style={{
            fontFamily: FONTS.display,
            color: active ? COLORS.accent : COLORS.hairline,
            transition: `color ${UI}`,
          }}
        >
          {String(n).padStart(2, '0')}
        </span>

        <div className="mt-3 md:col-span-6 md:mt-0">
          <h3
            className="pi-anim text-[32px] leading-none tracking-[-0.01em]"
            style={{
              fontFamily: FONTS.display,
              color: active ? COLORS.accent : COLORS.ink,
              transition: `color ${UI}`,
            }}
          >
            {project.title}
          </h3>

          {/*
            No fallback to `tagline`: a project added to the data without an
            entry here renders no line at all rather than leaking the résumé
            figures the taglines carry.
          */}
          {entry?.line && (
            <p
              className="mt-3 text-base leading-relaxed"
              style={{ fontFamily: FONTS.body, color: COLORS.muted }}
            >
              {entry.line}
            </p>
          )}
        </div>

        <div className="mt-4 flex items-baseline gap-3 md:col-span-4 md:mt-0 md:justify-end">
          {entry?.keys && (
            <p
              className="text-[12px] tracking-[0.08em] md:text-right"
              style={{ fontFamily: FONTS.mono, color: COLORS.muted }}
            >
              {entry.keys.join('  ·  ')}
            </p>
          )}
          <Arrow active={active} />
        </div>
      </div>
    </Link>
  )
}

export default function ProjectsIndex() {
  const [hovered, setHovered] = useState<string | null>(null)


  return (
    <div className="w-full overflow-x-clip">
      <style>{REDUCED_MOTION_CSS}</style>

      {/*
        The nav is fixed and does not offset the document, so this clears it
        itself — the same `--nav-h` + 5rem every other page uses. Standing alone
        above the chrome as a preview, a flat pt-24 was enough; under the real
        nav it would have left the index rule 32px from the bar.
      */}
      <header className={`${LAYOUT.container} pt-[calc(var(--nav-h)+5rem)]`}>
        <div
          className="flex items-baseline justify-between gap-6 border-b pb-3 text-[12px] uppercase tracking-[0.18em]"
          style={{ fontFamily: FONTS.mono, color: COLORS.muted, borderColor: COLORS.hairline }}
        >
          {/*
            The left slot is the page's own name on every page that has this
            rule — /experience says "experience", /resume says "résumé". This
            one said "index", which described the layout rather than the page,
            so the one label a visitor could use to tell where they were was the
            only one that did not say.
          */}
          <span>projects</span>
          <span>{String(projects.length).padStart(2, '0')} entries</span>
        </div>

        <h1
          className="mt-10 text-5xl leading-[0.95] tracking-[-0.02em] md:mt-14 md:text-7xl"
          style={{ fontFamily: FONTS.display }}
        >
          projects
        </h1>

        <p
          className="mt-5 text-base leading-relaxed md:mt-6 md:text-lg"
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
        </div>
      </section>

      {/* ── closing ────────────────────────────────────────────────────── */}
      <section className={`${LAYOUT.container} pb-24 pt-16 md:pb-32 md:pt-24`}>
        <div
          className="flex flex-wrap items-baseline justify-between gap-x-8 gap-y-4 border-t pt-8"
          style={{ borderColor: COLORS.hairline }}
        >
          <p
            className="text-base leading-relaxed"
            style={{ fontFamily: FONTS.body, color: COLORS.muted }}
          >
            Smaller experiments and the things that never made it this far are
            all on GitHub.
          </p>

          <a
            href={GITHUB}
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

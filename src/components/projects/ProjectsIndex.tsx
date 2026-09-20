'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useCallback, useRef, useState, type PointerEvent } from 'react'

import { projects, type Project } from '@/lib/projects'
import { COLORS, FONTS, LAYOUT, MOTION } from '@/styles/tokens'
import { useReducedMotion } from '@/components/home/live'

/**
 * The projects index — a shelf of cards that tilt to the cursor.
 *
 * This replaces the ghost-numeral list. A card grid was avoided here for a long
 * time on the grounds that it read as a template; the answer is that the cards
 * are not a uniform grid of boxes but physical things — each shows the project's
 * own cover, tilts in 3D toward the pointer, and on hover dims that cover to
 * bring up the one-liner and the stack.
 *
 * ── why this page never renders `project.tagline` ───────────────────────────
 * Index lines want ~10 words and the stored taglines run to full sentences, so
 * the prose here is `INDEX` below, with no fallback to `tagline`: a project
 * added to the data without an entry renders no line rather than an unedited one.
 */

const GITHUB = 'https://github.com/yih0nk'

interface IndexEntry {
  /** One-line summary, index measure. */
  line: string
  /** Three hand-picked technologies. */
  keys: string[]
}

const INDEX: Record<string, IndexEntry> = {
  cotter: {
    line: 'Compliance testing for learned robot policies: pytest, for robots.',
    keys: ['Python', 'MuJoCo', "Wald's SPRT"],
  },
  trove: {
    line: 'Cafe operations: live inventory, autonomous reordering, forecast demand.',
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
const MAX_TILT = 9

function TiltCard({ project, n, entry }: { project: Project; n: number; entry: IndexEntry | undefined }) {
  const ref = useRef<HTMLAnchorElement | null>(null)
  const still = useReducedMotion()
  const [tilt, setTilt] = useState('')
  const [glow, setGlow] = useState<{ x: number; y: number } | null>(null)

  const onMove = useCallback(
    (e: PointerEvent<HTMLAnchorElement>) => {
      if (still) return
      const r = ref.current?.getBoundingClientRect()
      if (!r) return
      const px = (e.clientX - r.left) / r.width - 0.5
      const py = (e.clientY - r.top) / r.height - 0.5
      setTilt(`perspective(1200px) rotateY(${px * MAX_TILT}deg) rotateX(${-py * MAX_TILT}deg) translateZ(16px)`)
      setGlow({ x: (px + 0.5) * 100, y: (py + 0.5) * 100 })
    },
    [still],
  )
  const onLeave = useCallback(() => {
    setTilt('')
    setGlow(null)
  }, [])

  return (
    <Link
      ref={ref}
      href={`/projects/${project.slug}`}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      className="group relative block aspect-[4/3] overflow-hidden rounded-[10px]"
      style={{
        transform: tilt,
        transformStyle: 'preserve-3d',
        transition: `transform 500ms ${EASE}, box-shadow 500ms ${EASE}`,
        boxShadow: glow
          ? '0 34px 60px -30px rgba(20,22,26,0.55)'
          : '0 18px 40px -28px rgba(20,22,26,0.45)',
        border: `1px solid ${COLORS.hairline}`,
        backgroundColor: '#0f1115',
      }}
    >
      {/* the cover, or a fallback panel for a project without one */}
      {project.image ? (
        <Image
          src={project.image}
          alt=""
          fill
          sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 340px"
          className="object-cover transition-[filter,transform] duration-500 group-hover:scale-[1.03] group-hover:brightness-[0.45] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
        />
      ) : (
        <span
          aria-hidden
          className="absolute inset-0 grid place-items-center transition-[filter] duration-500 group-hover:brightness-[0.6]"
          style={{ background: 'radial-gradient(120% 120% at 30% 20%, #1b1f27, #0c0d10)' }}
        >
          <span className="text-[96px] leading-none" style={{ fontFamily: FONTS.display, color: 'rgba(255,255,255,0.06)' }}>
            {String(n).padStart(2, '0')}
          </span>
        </span>
      )}

      {/* a scrim so the resting title reads on any cover */}
      <span aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3" style={{ background: 'linear-gradient(to top, rgba(8,9,11,0.85), transparent)' }} />

      {/* cursor glow */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background: glow ? `radial-gradient(360px circle at ${glow.x}% ${glow.y}%, rgba(255,255,255,0.10), transparent 45%)` : 'none',
        }}
      />

      {/* number, top-left */}
      <span className="absolute left-4 top-4 z-[2] text-[11px] tracking-[0.2em]" style={{ fontFamily: FONTS.mono, color: 'rgba(255,255,255,0.55)' }}>
        {String(n).padStart(2, '0')}
      </span>

      {/* the resting title — slides up on hover to clear the reveal */}
      <div className="absolute inset-x-5 bottom-5 z-[2] transition-transform duration-500 group-hover:-translate-y-[92px] motion-reduce:transition-none motion-reduce:group-hover:translate-y-0" style={{ transitionTimingFunction: EASE }}>
        <h3 className="text-[26px] leading-none" style={{ fontFamily: FONTS.display, color: '#fff' }}>
          {project.title}
        </h3>
      </div>

      {/* the reveal — one-liner + stack, up from the bottom on hover */}
      <div className="absolute inset-x-5 bottom-5 z-[2] translate-y-2 opacity-0 transition-[opacity,transform] duration-500 group-hover:translate-y-0 group-hover:opacity-100 motion-reduce:transition-none" style={{ transitionTimingFunction: EASE }}>
        {entry?.line && (
          <p className="text-[13.5px] leading-snug" style={{ fontFamily: FONTS.body, color: 'rgba(255,255,255,0.82)' }}>
            {entry.line}
          </p>
        )}
        {entry?.keys && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {entry.keys.map((k) => (
              <span key={k} className="rounded-full border px-2.5 py-[3px] text-[10px] tracking-[0.04em]" style={{ fontFamily: FONTS.mono, color: '#fff', borderColor: 'rgba(255,255,255,0.22)' }}>
                {k}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  )
}

export default function ProjectsIndex() {
  return (
    <div className="relative w-full overflow-x-clip">
      {/* ambient aurora — sits behind the header whitespace and the top of the
          shelf, where it actually shows, rather than trapped under the cards */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[900px] overflow-hidden">
        <span className="absolute rounded-full" style={{ width: 520, height: 520, left: '-6%', top: -60, background: 'color-mix(in srgb, var(--color-accent) 30%, transparent)', filter: 'blur(100px)' }} />
        <span className="absolute rounded-full" style={{ width: 440, height: 440, right: '-4%', top: 40, background: 'color-mix(in srgb, var(--color-accent) 22%, transparent)', filter: 'blur(100px)' }} />
        <span className="absolute rounded-full" style={{ width: 340, height: 340, left: '42%', top: 340, background: 'color-mix(in srgb, var(--color-accent) 15%, transparent)', filter: 'blur(110px)' }} />
      </div>

      <header className={`${LAYOUT.container} relative pt-[calc(var(--nav-h)+5rem)]`}>
        <div
          className="flex items-baseline justify-between gap-6 border-b pb-3 text-[12px] uppercase tracking-[0.18em]"
          style={{ fontFamily: FONTS.mono, color: COLORS.muted, borderColor: COLORS.hairline }}
        >
          <span>projects</span>
          <span>{String(projects.length).padStart(2, '0')} entries</span>
        </div>

        <h1 className="mt-10 text-5xl leading-[0.95] tracking-[-0.02em] md:mt-14 md:text-7xl" style={{ fontFamily: FONTS.display }}>
          projects
        </h1>

        <p className="mt-5 text-base leading-relaxed md:mt-6 md:text-lg" style={{ fontFamily: FONTS.body, color: COLORS.muted }}>
          Systems I built to answer a question I could not look up. Mostly agents,
          reinforcement learning, and the infrastructure underneath them.
        </p>
      </header>

      {/* the shelf */}
      <section className="relative mt-16 md:mt-20">
        <div className={`${LAYOUT.container} relative`}>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project, i) => (
              <TiltCard key={project.slug} project={project} n={i + 1} entry={INDEX[project.slug]} />
            ))}
          </div>
        </div>
      </section>

      <section className={`${LAYOUT.container} pb-24 pt-16 md:pb-32 md:pt-24`}>
        <div className="flex flex-wrap items-baseline justify-between gap-x-8 gap-y-4 border-t pt-8" style={{ borderColor: COLORS.hairline }}>
          <p className="text-base leading-relaxed" style={{ fontFamily: FONTS.body, color: COLORS.muted }}>
            Smaller experiments and the things that never made it this far are all on GitHub.
          </p>
          <a href={GITHUB} target="_blank" rel="noreferrer" className="flex items-baseline gap-2 text-[12px] tracking-[0.08em] underline-offset-4 hover:underline" style={{ fontFamily: FONTS.mono, color: COLORS.accent }}>
            github.com/yih0nk
            <span aria-hidden>→</span>
          </a>
        </div>
      </section>
    </div>
  )
}

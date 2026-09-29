'use client'

import Link from 'next/link'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'

import { ProjectCard } from '@/components/projects/ProjectsIndex'
import { projects } from '@/lib/projects'
import { COLORS, FONTS } from '@/styles/tokens'

import { RAMP, type Day, useContributions, useReducedMotion } from './live'

/**
 * The work, under the about: a year of commits and the flagship projects,
 * with the way into the rest.
 *
 * The graph is the last year up to today, the way GitHub draws it: 53 weeks,
 * newest on the right, ending in this week. It used to be a 30-day block
 * squeezed into the about's live column; a year needs the width of the page,
 * so it has its own section. A calendar year was tried and dropped: it spent a
 * quarter of the width on empty months still to come.
 *
 * The GitHub ramp is the one saturated colour on the site and stays quarantined
 * here. The empty-day cell is drawn from --color-ink rather than GitHub's light
 * grey, so it works in the dark theme too.
 */

const { ink: INK, muted: MUTED, hairline: HAIRLINE, accent: ACCENT } = COLORS
const MONO = FONTS.mono
const LABEL = 'text-[12px] uppercase leading-none tracking-[0.2em]'
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** The projects the homepage leads with, by slug, in this order. */
const FLAGSHIP = ['trove', 'cotter', 'rocket-robot']

/** Enough days to cover the rolling year out of the route's answer. */
const FETCH_SPAN = 400
/** 53 weeks: the current week plus the 52 before it. */
const WEEKS = 53

/** The empty day, from --color-ink rather than GitHub's grey, so it works dark too. */
const EMPTY = 'color-mix(in srgb, var(--color-ink) 7%, transparent)'

const iso = (d: Date) => d.toISOString().slice(0, 10)

interface Cell {
  date: string
  /** Before the year or after today: kept for the week's shape, never drawn. */
  hidden: boolean
}

/**
 * Sunday-first weeks, the last one holding today. Days after today in this
 * week, and days older than a year in the first, stay hidden, so the drawn
 * cells are exactly the last 365 days.
 */
function yearWindow(today: string): { cells: Cell[]; monthCols: { month: number; col: number }[] } {
  const t = new Date(`${today}T00:00:00Z`)
  const start = new Date(t)
  start.setUTCDate(start.getUTCDate() - t.getUTCDay() - (WEEKS - 1) * 7)
  const oldest = new Date(t)
  oldest.setUTCDate(oldest.getUTCDate() - 364)
  const cells: Cell[] = []
  const monthCols: { month: number; col: number }[] = []
  for (let i = 0; i < WEEKS * 7; i += 1) {
    const d = new Date(start)
    d.setUTCDate(start.getUTCDate() + i)
    const date = iso(d)
    const hidden = d > t || d < oldest
    // a month is labelled at the week its 1st falls in, unless that crowds the
    // label before it (the partial month at the far left)
    if (!hidden && d.getUTCDate() === 1) {
      const col = Math.floor(i / 7)
      const prev = monthCols[monthCols.length - 1]
      if (!prev || col - prev.col >= 3) monthCols.push({ month: d.getUTCMonth(), col })
    }
    cells.push({ date, hidden })
  }
  return { cells, monthCols }
}

function YearGraph() {
  const still = useReducedMotion()
  const { days } = useContributions(FETCH_SPAN)

  // Today in the reader's own timezone, read after mount: the server's clock
  // is UTC and can already be on tomorrow, which would render one more day as
  // "past" than the browser does and mismatch on hydration. Until then nothing
  // is marked as ahead; the data isn't here yet either.
  const [today, setToday] = useState<string | null>(null)
  useEffect(() => {
    const now = new Date()
    const pad = (n: number) => (n < 10 ? `0${n}` : String(n))
    setToday(`${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`)
  }, [])
  // Until today is known (the first render, on the server and the client
  // alike) the grid is the same 53 x 7 of blank cells, so nothing shifts or
  // mismatches when the dates arrive.
  const win = today ? yearWindow(today) : null
  const cells: Cell[] = win ? win.cells : Array.from({ length: WEEKS * 7 }, () => ({ date: '', hidden: false }))
  const byDate = new Map<string, Day>(days.map((d) => [d.date, d]))
  const shown = cells.filter((c) => !c.hidden && c.date)
  const total = days.length && win ? shown.reduce((n, c) => n + (byDate.get(c.date)?.count ?? 0), 0) : null

  const gap = 'clamp(1px, 0.28vw, 3px)'

  // the hovered day: an outline on its square and a label above it, centred
  // on the square but clamped to the graph's width so it never runs off a phone
  const wrapRef = useRef<HTMLDivElement | null>(null)
  const tipRef = useRef<HTMLSpanElement | null>(null)
  const [hover, setHover] = useState<{ i: number; x: number; y: number; w: number; text: string } | null>(null)
  const showDay = (i: number, el: HTMLElement) => {
    const c = cells[i]
    if (!c || !c.date || c.hidden) return
    const n = byDate.get(c.date)?.count ?? 0
    const when = `${MONTHS[Number(c.date.slice(5, 7)) - 1]} ${Number(c.date.slice(8))}, ${c.date.slice(0, 4)}`
    setHover({
      i,
      x: el.offsetLeft,
      y: el.offsetTop,
      w: el.offsetWidth,
      text: `${n === 0 ? 'no' : n} contribution${n === 1 ? '' : 's'} · ${when}`,
    })
  }

  useLayoutEffect(() => {
    const tip = tipRef.current
    const wrap = wrapRef.current
    if (!tip || !wrap || !hover) return
    const left = hover.x + hover.w / 2 - tip.offsetWidth / 2
    tip.style.left = `${Math.max(0, Math.min(wrap.offsetWidth - tip.offsetWidth, left))}px`
  }, [hover])

  const label =
    total === null
      ? 'GitHub contribution activity for the last year'
      : `${total.toLocaleString('en-US')} contribution${total === 1 ? '' : 's'} in the last year`

  return (
    <div>
      <div
        className="flex items-baseline gap-3"
        style={{ opacity: total === null ? 0 : 1, transition: still ? 'none' : 'opacity 500ms ease' }}
      >
        <span className="text-[48px] leading-none tracking-[-0.01em]" style={{ fontFamily: FONTS.display, color: INK }}>
          {total === null ? '0' : total.toLocaleString('en-US')}
        </span>
        <span className="text-[12px] uppercase leading-none tracking-[0.18em]" style={{ fontFamily: MONO, color: MUTED }}>
          contributions in the last year
        </span>
      </div>

      {/* month labels, on the same columns as the graph */}
      <div
        aria-hidden
        className="mt-8 h-3 text-[12px] leading-none"
        style={{ display: 'grid', gridTemplateColumns: `repeat(${WEEKS}, minmax(0, 1fr))`, columnGap: gap, fontFamily: MONO, color: MUTED }}
      >
        {(win?.monthCols ?? []).map(({ month, col }) => (
          <span key={`${month}-${col}`} className="whitespace-nowrap" style={{ gridColumnStart: col + 1, gridRowStart: 1 }}>
            {/* a month is ~30px wide on a phone: the initial fits, "Sep" crowds "Oct" */}
            <span className="md:hidden">{MONTHS[month][0]}</span>
            <span className="hidden md:inline">{MONTHS[month]}</span>
          </span>
        ))}
      </div>

      <div ref={wrapRef} className="relative mt-2" onMouseLeave={() => setHover(null)}>
        <div
          role="img"
          aria-label={label}
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${WEEKS}, minmax(0, 1fr))`,
            gridTemplateRows: 'repeat(7, auto)',
            gridAutoFlow: 'column',
            gap,
          }}
        >
          {cells.map((c, i) => {
            const level = c.date ? (byDate.get(c.date)?.level ?? 0) : 0
            return (
              <div
                key={i}
                aria-hidden
                onMouseEnter={(e) => showDay(i, e.currentTarget)}
                style={{
                  aspectRatio: '1',
                  borderRadius: 2,
                  visibility: c.hidden ? 'hidden' : 'visible',
                  background: level ? RAMP[level] : EMPTY,
                  outline: hover?.i === i ? '2px solid var(--color-ink)' : 'none',
                  outlineOffset: 1,
                  transition: still ? 'none' : 'background-color 500ms ease',
                  transitionDelay: still ? '0ms' : `${Math.floor(i / 7) * 6}ms`,
                }}
              />
            )
          })}
        </div>
        {hover ? (
          <span
            ref={tipRef}
            aria-hidden
            className="pointer-events-none absolute z-10 whitespace-nowrap rounded-[3px] px-2 py-1 text-[12px] leading-none"
            style={{
              top: hover.y,
              transform: 'translateY(calc(-100% - 8px))',
              fontFamily: MONO,
              color: 'var(--color-bg)',
              background: 'var(--color-ink)',
            }}
          >
            {hover.text}
          </span>
        ) : null}
      </div>

      <div
        aria-hidden
        className="mt-3 flex items-center justify-end gap-1.5 text-[12px] leading-none"
        style={{ fontFamily: MONO, color: MUTED }}
      >
        <span className="mr-1">less</span>
        {[EMPTY, RAMP[1], RAMP[2], RAMP[3], RAMP[4]].map((bg) => (
          <span key={bg} className="inline-block h-[10px] w-[10px] rounded-[2px]" style={{ background: bg }} />
        ))}
        <span className="ml-1">more</span>
      </div>
    </div>
  )
}

export default function HomeWork() {
  // each keeps its /projects number, so a card reads the same on both pages
  const flagship = FLAGSHIP.flatMap((slug) => {
    const i = projects.findIndex((p) => p.slug === slug)
    return i < 0 ? [] : [{ project: projects[i], n: i + 1 }]
  })

  return (
    <section className="w-full pb-12 md:pb-14" aria-label="what I've been building">
      <div className="mx-auto max-w-[1100px] px-6">
        {/* No heading: the year's total opens the section and the label names
            the cards. A 32px "building" on top was a third header for two
            things, and the heaviest type on the page below the hero. The rule
            is what separates it from the about. */}
        <div className="border-t pt-10" style={{ borderColor: HAIRLINE }}>
          <YearGraph />
        </div>

        <div className="mt-10 md:mt-12">
          <span className={`${LABEL} block`} style={{ fontFamily: MONO, color: MUTED }}>
            some cool stuff i built:
          </span>
          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {flagship.map(({ project, n }) => (
              <ProjectCard key={project.slug} project={project} n={n} />
            ))}
          </div>
          <Link
            href="/projects"
            className="mt-8 inline-block text-[12px] tracking-[0.1em] underline-offset-[3px] hover:underline"
            style={{ fontFamily: MONO, color: ACCENT }}
          >
            see every project →
          </Link>
        </div>
      </div>
    </section>
  )
}

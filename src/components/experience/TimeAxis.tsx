'use client'

import { useState } from 'react'

import { COLORS, FONTS, MOTION } from '@/styles/tokens'
import {
  durationMonths,
  formatDuration,
  formatSpan,
  monthIndex,
  type Role,
} from '@/lib/experience'

/**
 * The roles, drawn against a real time axis.
 *
 * The old page spaced five roles evenly down the page, which said that three
 * months at a consulting firm and twenty months at a chess club were the same
 * size of thing. They are not, and more importantly the even spacing hid the
 * one fact the page most wants to make: since January 2026 there have been two
 * or three of these running at once. On a proportional axis that is not a claim
 * anyone has to write down — it is just what the picture looks like.
 *
 * ── lanes ───────────────────────────────────────────────────────────────────
 * Bars are packed greedily into lanes, so two roles that overlap in time cannot
 * share one and concurrency shows up as stacked bars rather than as a note. The
 * number of lanes is whatever the data needs; nothing here assumes three. See
 * `assignLanes` for why the pass has to run oldest-first.
 *
 * ── why the axis is horizontal months, not a scroll ─────────────────────────
 * The whole span is a little under three years, which fits across a 1052px
 * frame at a readable tick density. A vertical axis would have been the easy
 * port of the old layout, but it puts the thing that varies — duration — along
 * the axis that already scrolls, so a long role just looks like more page.
 *
 * ── `now` ───────────────────────────────────────────────────────────────────
 * The present is a prop, resolved once by the server and passed down, rather
 * than `new Date()` inside the component. A server component evaluates that at
 * build time and the client evaluates it on mount, and when the two disagree
 * React logs a hydration mismatch that only appears the day the month rolls
 * over. One value, computed once, is not a clever optimisation — it is the
 * difference between a page that is correct and a page that is correct until
 * September.
 */

const EASE = MOTION.ease
const UI = `${MOTION.ui} ${EASE}`

const REDUCED_MOTION_CSS = `
@media (prefers-reduced-motion: reduce) {
  .ta-anim { transition: none !important; }
}
`

/**
 * Greedy lane packing: each role takes the first lane whose last bar has already
 * ended. Two roles that overlap in time cannot share a lane, so concurrency
 * shows up as stacked bars rather than as a note.
 *
 * The pass MUST run oldest-first. Roles are authored newest-first for reading,
 * and packing in that order puts every role in its own lane — each successive
 * role starts earlier than everything already placed, so no lane is ever free
 * and the axis draws five parallel rows that share no information. Sort for the
 * packing, then restore the authored order for rendering.
 */
function assignLanes(roles: Role[], nowIdx: number) {
  const end = (r: Role) => (r.to ? monthIndex(r.to) : nowIdx)
  const laneEnds: number[] = []
  const lanes = new Map<Role, number>()

  for (const role of [...roles].sort((a, b) => monthIndex(a.from) - monthIndex(b.from))) {
    const start = monthIndex(role.from)
    let lane = laneEnds.findIndex((e) => e < start)
    if (lane === -1) {
      lane = laneEnds.length
      laneEnds.push(end(role))
    } else {
      laneEnds[lane] = end(role)
    }
    lanes.set(role, lane)
  }

  return roles.map((role) => ({
    role,
    lane: lanes.get(role) ?? 0,
    start: monthIndex(role.from),
    end: end(role),
  }))
}

export default function TimeAxis({
  roles,
  now,
}: {
  roles: Role[]
  /** [year, month] of the present, resolved by the caller. */
  now: [number, number]
}) {
  const [hovered, setHovered] = useState<string | null>(null)

  const nowIdx = monthIndex(now)
  const placed = assignLanes(roles, nowIdx)

  // The axis runs from the earliest start to now, padded to whole years so the
  // ticks land on January and the scale reads as calendar time.
  const earliest = Math.min(...placed.map((p) => p.start))
  const axisFrom = Math.floor(earliest / 12) * 12
  const axisTo = nowIdx + 1
  const span = axisTo - axisFrom

  const pct = (idx: number) => ((idx - axisFrom) / span) * 100

  const years: number[] = []
  for (let y = Math.floor(axisFrom / 12); y <= Math.floor(axisTo / 12); y++) years.push(y)

  const laneCount = Math.max(...placed.map((p) => p.lane)) + 1
  const LANE_H = 34

  return (
    <div>
      <style>{REDUCED_MOTION_CSS}</style>

      {/* ── the axis ─────────────────────────────────────────────────────── */}
      <div
        className="relative"
        style={{ height: laneCount * LANE_H + 28 }}
        onMouseLeave={() => setHovered(null)}
      >
        {/* year ticks, behind everything */}
        {years.map((y) => {
          const left = pct(y * 12)
          if (left < 0 || left > 100) return null
          return (
            <div
              key={y}
              aria-hidden
              className="absolute top-0 bottom-7"
              style={{ left: `${left}%`, borderLeft: `1px solid ${COLORS.hairline}` }}
            />
          )
        })}

        {/*
          The present sits at the END of the current month, not its start. A bar
          for an ongoing role is drawn through `end + 1` so the current month is
          filled in rather than hanging half-drawn, and marking `now` one month
          to the left of that left every live role visibly running past it.
        */}
        <div
          aria-hidden
          className="absolute top-0 bottom-7"
          style={{ left: `${pct(nowIdx + 1)}%`, borderLeft: `1px solid ${COLORS.accent}` }}
        />

        {placed.map(({ role, lane, start, end }) => {
          const active = hovered === role.org
          const left = pct(start)
          const width = pct(end + 1) - left
          return (
            <div
              key={role.org}
              className="ta-anim absolute"
              style={{
                left: `${left}%`,
                width: `${width}%`,
                top: lane * LANE_H,
                height: LANE_H - 10,
                backgroundColor: active ? COLORS.accent : COLORS.ink,
                opacity: hovered && !active ? 0.18 : 1,
                transition: `opacity ${UI}, background-color ${UI}`,
              }}
              onMouseEnter={() => setHovered(role.org)}
            />
          )
        })}

        {/* year labels, on the baseline */}
        <div
          className="absolute right-0 bottom-0 left-0 border-t"
          style={{ borderColor: COLORS.hairline }}
        >
          {years.map((y) => {
            const left = pct(y * 12)
            if (left < 0 || left > 97) return null
            return (
              <span
                key={y}
                className="absolute pt-1.5 text-[12px] tracking-[0.14em]"
                style={{ left: `${left}%`, fontFamily: FONTS.mono, color: COLORS.muted }}
              >
                {y}
              </span>
            )
          })}
          <span
            className="absolute pt-1.5 text-[12px] tracking-[0.14em]"
            style={{
              left: `${pct(nowIdx + 1)}%`,
              fontFamily: FONTS.mono,
              color: COLORS.accent,
              transform: 'translateX(-100%)',
            }}
          >
            now
          </span>
        </div>
      </div>

      {/* ── the roles ────────────────────────────────────────────────────── */}
      <ul className="mt-14">
        {placed.map(({ role }) => {
          const active = hovered === role.org
          const months = durationMonths(role, nowIdx)
          return (
            <li
              key={role.org}
              className="ta-anim border-t"
              style={{
                borderColor: COLORS.hairline,
                opacity: hovered && !active ? 0.4 : 1,
                transition: `opacity ${UI}`,
              }}
              onMouseEnter={() => setHovered(role.org)}
              onMouseLeave={() => setHovered(null)}
            >
              <div className="py-6 md:grid md:grid-cols-12 md:gap-8 md:py-7">
                <div className="md:col-span-3">
                  <p
                    className="text-[12px] tracking-[0.14em]"
                    style={{ fontFamily: FONTS.mono, color: COLORS.muted }}
                  >
                    {formatSpan(role)}
                  </p>
                  <p
                    className="mt-1 text-[12px] tracking-[0.14em]"
                    style={{ fontFamily: FONTS.mono, color: COLORS.muted, opacity: 0.7 }}
                  >
                    {formatDuration(months)}
                  </p>
                </div>

                <div className="mt-3 md:col-span-4 md:mt-0">
                  <h3
                    className="ta-anim text-2xl leading-tight tracking-[-0.01em]"
                    style={{
                      fontFamily: FONTS.display,
                      color: active ? COLORS.accent : COLORS.ink,
                      transition: `color ${UI}`,
                    }}
                  >
                    {role.org}
                  </h3>
                  <p
                    className="mt-1 text-base"
                    style={{ fontFamily: FONTS.body, color: COLORS.inkSoft }}
                  >
                    {role.title}
                  </p>
                  <p
                    className="mt-1 text-[12px] tracking-[0.08em]"
                    style={{ fontFamily: FONTS.mono, color: COLORS.muted }}
                  >
                    {role.location}
                  </p>
                </div>

                <p
                  className="mt-3 text-base leading-relaxed md:col-span-5 md:mt-0"
                  style={{ fontFamily: FONTS.body, color: COLORS.muted }}
                >
                  {role.line}
                </p>
              </div>
            </li>
          )
        })}
        <li className="border-t" style={{ borderColor: COLORS.hairline }} />
      </ul>
    </div>
  )
}

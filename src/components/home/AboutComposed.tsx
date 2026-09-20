'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState, type MouseEvent, type FocusEvent } from 'react'

import { ROLES, type Role } from '@/lib/experience'
import { EMAIL } from '@/lib/site'
import type { InitialNowPlaying } from '@/lib/spotify'
import { COLORS, FONTS } from '@/styles/tokens'
import VinylCompact from './VinylCompact'
import {
  CELL_EDGE,
  RAMP,
  buildCells,
  useContributions,
  useElapsed,
  useReducedMotion,
  useSpotify,
} from './live'

/**
 * Everything below the reel, as one composition: the about, the experience
 * folded in from what used to be its own page, and a live column — what is
 * playing, the commit block, and a few photographs.
 *
 * The through-line is one interaction. A dotted term in the copy and a row in
 * the experience ledger both open the same small white badge on hover; a solid
 * underline navigates instead. So "photography" and "SIAS Lab" behave the same
 * way, and the page teaches its own vocabulary once.
 *
 * Hierarchy is size and space. Nothing here is a card; the only saturated colour
 * is the GitHub ramp, quarantined to the commit block, and one accent for
 * interaction.
 */

const { ink: INK, muted: MUTED, bg: BG, hairline: HAIRLINE, accent: ACCENT } = COLORS
const MONO = FONTS.mono
/** Read through the property so /preview can rebind the body face; FONTS.body is the floor. */
const BODY = `var(--font-body, ${FONTS.body})`

const LABEL = 'text-[12px] uppercase leading-none tracking-[0.2em]'

// ── greeting ────────────────────────────────────────────────────────────────
const K_LAST = 'yh:last'

function timeOfDay(hour: number): string {
  if (hour < 5) return 'late night'
  if (hour < 12) return 'good morning'
  if (hour < 17) return 'good afternoon'
  if (hour < 22) return 'good evening'
  return 'late night'
}

/** Friendly, deliberately coarse. */
function relative(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000))
  if (s < 60) return 'just now'
  const m = Math.floor(s / 60)
  if (m < 60) return m === 1 ? 'a minute' : `${m} minutes`
  const h = Math.floor(m / 60)
  if (h < 24) return h === 1 ? 'an hour' : `${h} hours`
  const d = Math.floor(h / 24)
  if (d < 7) return d === 1 ? 'a day' : `${d} days`
  const w = Math.floor(d / 7)
  if (w < 6) return w === 1 ? 'a week' : `${w} weeks`
  const mo = Math.max(1, Math.round(d / 30))
  return mo === 1 ? 'a month' : `${mo} months`
}

interface Memory {
  line: string
  returning: boolean
}
let loadMemory: Memory | null = null

/**
 * Read the last visit, write this one, turn the gap into a sentence. Read and
 * write are guarded separately: Safari private mode gives a working getItem and
 * throws on setItem, and lumping them would greet a returning visitor cold.
 */
function resolveMemory(): Memory {
  const now = Date.now()
  let previous: number | null = null
  try {
    const raw = window.localStorage.getItem(K_LAST)
    const pl = raw === null ? 0 : Number.parseInt(raw, 10)
    if (Number.isFinite(pl) && pl > 0 && pl <= now) previous = pl
  } catch {
    previous = null
  }
  try {
    window.localStorage.setItem(K_LAST, String(now))
  } catch {
    /* write blocked; the read above still stands */
  }
  const open = timeOfDay(new Date().getHours())
  if (previous === null) return { line: `${open}, first time here`, returning: false }
  const rel = relative(now - previous)
  const line = rel === 'just now' ? `${open}, welcome back, that was quick` : `${open}, welcome back, it's been ${rel}`
  return { line, returning: true }
}

// ── experience formatting ─────────────────────────────────────────────────────
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** "May 2026 – now" · "Jan – Jun 2026" · "Jun – Aug 2025". En dash, never em. */
function span(r: Role): string {
  const [fy, fm] = r.from
  if (!r.to) return `${MON[fm - 1]} ${fy} – now`
  const [ty, tm] = r.to
  if (fy === ty) return `${MON[fm - 1]} – ${MON[tm - 1]} ${ty}`
  return `${MON[fm - 1]} ${fy} – ${MON[tm - 1]} ${ty}`
}

const cityOf = (loc: string) => loc.split(',')[0].trim()

// ── hobby badges — the dotted terms in the copy ───────────────────────────────
const HOBBIES = {
  piano: { icon: '🎹', desc: 'Fifteen years. Where I learned harmony: chords, voicings, what actually holds a song up.' },
  'tenor sax': { icon: '🎷', desc: 'Three years in. Still bad at it, which is most of the fun.' },
  photography: { icon: '📷', desc: 'How I practice seeing. Composition, contrast, the way light lands.' },
  badminton: { icon: '🏸', desc: "Retired competitive doubles, provincial gold. I still can't let a rally go." },
} as const

/** Placeholder snapshots for the "lately" strip — swap for real ones later. */
const LATELY = ['/images/reel/03.jpg', '/images/reel/05.jpg', '/images/reel/04.jpg']

// ── clock ─────────────────────────────────────────────────────────────────────
function clock(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000))
  const m = Math.floor(total / 60)
  const sec = total % 60
  return `${m}:${sec < 10 ? '0' : ''}${sec}`
}

const COLS = 10
const ROWS = 3
const SPAN = COLS * ROWS
const CELL = 13
const GAP = 4

interface BadgeState {
  label: string
  text: string
  x: number
  y: number
}

export default function AboutComposed({
  font,
  nowPlaying = null,
}: {
  font: string
  nowPlaying?: InitialNowPlaying | null
}) {
  const still = useReducedMotion()

  // greeting — starts null so the first client render matches the server byte
  const [memory, setMemory] = useState<Memory | null>(null)
  useEffect(() => {
    let alive = true
    const resolved = loadMemory ?? resolveMemory()
    loadMemory = resolved
    const timer = window.setTimeout(() => {
      if (alive) setMemory(resolved)
    }, 220)
    return () => {
      alive = false
      window.clearTimeout(timer)
    }
  }, [])

  // the record — always real Spotify data, seeded from the server
  const { track: live } = useSpotify(nowPlaying)
  const elapsedMs = useElapsed(live)
  const progress = live?.durationMs && elapsedMs !== null ? elapsedMs / live.durationMs : 0

  // the commit block
  const { days, total } = useContributions(SPAN)
  const cells = buildCells(days, SPAN)

  // the shared badge
  const [badge, setBadge] = useState<BadgeState | null>(null)
  const openBadge = (e: MouseEvent | FocusEvent, label: string, text: string) => {
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const x = Math.max(12, Math.min(r.left, window.innerWidth - 302))
    setBadge({ label, text, x, y: r.bottom + 8 })
  }
  const closeBadge = () => setBadge(null)

  const fade = still ? 'none' : 'opacity 500ms ease'

  return (
    <section
      id="about"
      className="w-full scroll-mt-20 pt-20 pb-16 md:pt-28 md:pb-24"
      style={{ backgroundColor: BG, color: INK }}
    >
      {/* quiet aurora, fixed behind the page */}
      <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <span
          className="absolute rounded-full"
          style={{
            width: 420,
            height: 420,
            left: -80,
            top: 120,
            background: 'color-mix(in srgb, var(--accent) 9%, transparent)',
            filter: 'blur(90px)',
            animation: still ? 'none' : 'aura1 24s ease-in-out infinite',
          }}
        />
        <span
          className="absolute rounded-full"
          style={{
            width: 340,
            height: 340,
            right: -60,
            top: 460,
            background: 'color-mix(in srgb, var(--accent) 6%, transparent)',
            filter: 'blur(90px)',
            animation: still ? 'none' : 'aura2 28s ease-in-out infinite',
          }}
        />
        <style>{`@keyframes aura1{50%{transform:translate(70px,60px) scale(1.1)}}@keyframes aura2{50%{transform:translate(-60px,40px) scale(1.12)}}`}</style>
      </div>

      <div className="relative z-[1] mx-auto max-w-[1100px] px-6">
        {/* ── about ─────────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 items-center gap-x-12 gap-y-10 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-x-16">
          <figure className="group m-0 flex w-full max-w-[360px] flex-col md:max-w-none">
            <div
              className="relative aspect-[4/5] w-full overflow-hidden rounded-[3px]"
              style={{
                backgroundColor: `color-mix(in srgb, ${INK} 4%, transparent)`,
                boxShadow: '0 1px 2px rgba(20,22,26,0.07), 0 18px 40px -22px rgba(20,22,26,0.45)',
              }}
            >
              <Image
                src="/images/IMG_4699.jpg"
                alt="Yihan Hong, standing on a street corner"
                fill
                sizes="(max-width: 768px) 88vw, 460px"
                quality={90}
                priority
                className="object-cover object-[48%_40%] transition-transform duration-[900ms] ease-out motion-safe:group-hover:scale-[1.02] motion-reduce:transition-none"
              />
              <span
                aria-hidden
                className="pointer-events-none absolute inset-0 rounded-[3px]"
                style={{ boxShadow: `inset 0 0 0 1px ${HAIRLINE}` }}
              />
            </div>
            <figcaption className="mt-4 flex shrink-0 items-baseline justify-between gap-4">
              <span className={LABEL} style={{ fontFamily: MONO, color: MUTED }}>
                yihan hong
              </span>
              <span className="text-[16px] leading-none" style={{ fontFamily: font, color: MUTED }}>
                洪一涵
              </span>
            </figcaption>
          </figure>

          <div className="min-w-0">
            {/* the whisper */}
            <div className="mb-6 min-h-8 sm:min-h-4">
              <span
                className={`inline-flex items-start gap-2 text-[12px] leading-4 uppercase tracking-[0.14em] transition-opacity duration-700 ease-out motion-reduce:transition-none ${
                  memory === null ? 'opacity-0' : 'opacity-100'
                }`}
                style={{ fontFamily: MONO, color: MUTED }}
              >
                {memory !== null && memory.returning ? (
                  <span aria-hidden className="mt-1.5 inline-block h-1 w-1 shrink-0 rounded-full" style={{ backgroundColor: ACCENT }} />
                ) : null}
                {memory === null ? '' : memory.line}
              </span>
            </div>

            <div className="space-y-5 text-[16px] leading-relaxed md:text-[18px]" style={{ fontFamily: BODY, color: INK }}>
              <p>
                I&rsquo;m Yihan, a computer engineering and CS student at{' '}
                <NavTerm href="https://www.usc.edu" icon="🏛">
                  USC
                </NavTerm>
                . Most of my week goes to{' '}
                <Link
                  href="/projects"
                  className="whitespace-nowrap border-b [border-color:var(--accent)] transition-colors duration-200 hover:[color:var(--accent)]"
                >
                  <span aria-hidden className="mr-[3px]">🛠</span>making software act on its own
                </Link>
                : fine-tuning models to someone&rsquo;s taste, testing whether AI systems behave the way
                they&rsquo;re supposed to (and documenting the many ways they don&rsquo;t), and wiring up
                retrieval across hundreds of thousands of records that all insist they&rsquo;re relevant.
              </p>
              <p>
                The rest of my time is less structured. Fifteen years of{' '}
                <BadgeTerm label="piano" onOpen={openBadge} onClose={closeBadge}>
                  <span aria-hidden className="mr-[3px]">{HOBBIES.piano.icon}</span>piano
                </BadgeTerm>
                , three of{' '}
                <BadgeTerm label="tenor sax" onOpen={openBadge} onClose={closeBadge}>
                  <span aria-hidden className="mr-[3px]">{HOBBIES['tenor sax'].icon}</span>tenor sax
                </BadgeTerm>
                , some{' '}
                <BadgeTerm label="photography" onOpen={openBadge} onClose={closeBadge}>
                  <span aria-hidden className="mr-[3px]">{HOBBIES.photography.icon}</span>photography
                </BadgeTerm>
                , and more movies than a person can reasonably defend. I also play{' '}
                <BadgeTerm label="badminton" onOpen={openBadge} onClose={closeBadge}>
                  <span aria-hidden className="mr-[3px]">{HOBBIES.badminton.icon}</span>badminton
                </BadgeTerm>{' '}
                with a level of competitiveness the sport did not ask for and cannot contain.
              </p>
              <p>So I&rsquo;m an engineer, and a few other things. Most of them started as the thing I did instead of studying.</p>
              <p>
                Summer 2027 is still unclaimed. If you&rsquo;re building something interesting,{' '}
                <a
                  href={`mailto:${EMAIL}`}
                  className="border-b [border-color:var(--accent)] [color:var(--accent)]"
                >
                  say hi
                </a>
                .
              </p>
            </div>
          </div>
        </div>

        {/* ── experience (folded in) + the live column ──────────────────────── */}
        <div className="mt-20 grid grid-cols-1 items-start gap-x-12 gap-y-14 md:mt-24 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-x-16">
          {/* experience ledger — compact, capped narrower than the photograph */}
          <div>
            <div className="flex items-center gap-4">
              <h2 className={`shrink-0 ${LABEL}`} style={{ fontFamily: MONO, color: MUTED }}>
                experience
              </h2>
              <span aria-hidden className="h-px flex-1" style={{ backgroundColor: HAIRLINE }} />
            </div>

            <div className="mt-6">
              {ROLES.map((r) => (
                <div
                  key={`${r.org}-${r.title}`}
                  className="group cursor-help border-b border-dotted py-3.5"
                  style={{ borderColor: HAIRLINE }}
                  onMouseEnter={(e) => openBadge(e, r.org, r.line)}
                  onMouseLeave={closeBadge}
                  onFocus={(e) => openBadge(e, r.org, r.line)}
                  onBlur={closeBadge}
                  tabIndex={0}
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <span
                      className="text-[22px] leading-tight transition-colors group-hover:[color:var(--accent)] group-focus:[color:var(--accent)]"
                      style={{ fontFamily: font }}
                    >
                      {r.org}
                    </span>
                    <span className="shrink-0 text-[12px] tracking-[0.06em] whitespace-nowrap" style={{ fontFamily: MONO, color: MUTED }}>
                      {span(r)}
                    </span>
                  </div>
                  <div className="mt-1 text-[13px]" style={{ fontFamily: BODY, color: MUTED }}>
                    {r.title} · {cityOf(r.location)}
                  </div>
                </div>
              ))}
            </div>

            <Link
              href="/resume"
              className="mt-4 inline-block text-[11px] tracking-[0.1em] [color:var(--accent)] underline-offset-[3px] hover:underline"
              style={{ fontFamily: MONO }}
            >
              full résumé →
            </Link>
          </div>

          {/* live column: now playing + commits, then the photographs. Flows
              top-down with one even gap — forcing it to the ledger's full height
              only piled the slack into a single void between the two blocks. */}
          <div className="flex flex-col gap-12">
            <div className="grid grid-cols-1 items-start gap-x-10 gap-y-10 sm:grid-cols-[minmax(0,5fr)_minmax(0,4fr)]">
              {/* now playing */}
              <div className="flex items-start gap-5" aria-hidden={!live} style={{ opacity: live ? 1 : 0, transition: fade }}>
                <div className="shrink-0" style={{ width: 128, height: 128 }}>
                  {live ? <VinylCompact reduced={still} size={128} art={live.image} progress={progress} /> : null}
                </div>
                <div className="min-w-0">
                  <span className={LABEL} style={{ fontFamily: MONO, color: MUTED }}>
                    {live && !live.isPlaying ? 'last played' : 'now playing'}
                  </span>
                  <div className="mt-3 min-h-[3.5rem]">
                    <p className="text-balance text-[18px] leading-[1.2]" style={{ fontFamily: font, color: INK }}>
                      {live?.title ?? ''}
                    </p>
                    <p className="mt-1 text-[14px]" style={{ fontFamily: BODY, color: MUTED }}>
                      {live?.artist ?? ''}
                    </p>
                  </div>
                  <span className="mt-2 block text-[11px] uppercase tracking-[0.18em] tabular-nums" style={{ fontFamily: MONO, color: MUTED }}>
                    {live?.isPlaying && live.durationMs && elapsedMs !== null
                      ? `${clock(elapsedMs)} / ${clock(live.durationMs)}`
                      : '33 1/3 rpm'}
                  </span>
                </div>
              </div>

              {/* commits */}
              <div>
                <span className={LABEL} style={{ fontFamily: MONO, color: MUTED }}>
                  commits
                </span>
                <div className="mt-[19px]">
                  <div
                    role="img"
                    aria-label={
                      total === null
                        ? 'GitHub contribution activity for the last thirty days'
                        : `${total.toLocaleString('en-US')} contribution${total === 1 ? '' : 's'} in the last thirty days`
                    }
                    style={{
                      display: 'grid',
                      gridTemplateColumns: `repeat(${COLS}, ${CELL}px)`,
                      gridTemplateRows: `repeat(${ROWS}, ${CELL}px)`,
                      gap: GAP,
                    }}
                  >
                    {cells.map((c, i) => (
                      <div
                        key={c.key}
                        aria-hidden
                        style={{
                          borderRadius: 2,
                          background: RAMP[c.level] ?? RAMP[0],
                          boxShadow: `inset 0 0 0 1px ${CELL_EDGE}`,
                          transition: still ? 'none' : 'background-color 500ms ease',
                          transitionDelay: still ? '0ms' : `${i * 8}ms`,
                        }}
                      />
                    ))}
                  </div>
                  <div
                    aria-hidden={total === null}
                    className="mt-3 flex items-baseline gap-2.5"
                    style={{ opacity: total === null ? 0 : 1, visibility: total === null ? 'hidden' : 'visible', transition: fade }}
                  >
                    <span className="text-[32px] leading-none" style={{ fontFamily: font, color: INK }}>
                      {total === null ? '0' : total.toLocaleString('en-US')}
                    </span>
                    <span className="text-[12px] uppercase leading-none tracking-[0.18em]" style={{ fontFamily: MONO, color: MUTED }}>
                      in 30 days
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* lately — placeholder polaroids, wide across the column */}
            <div>
              <span className={`${LABEL} mb-4 block`} style={{ fontFamily: MONO, color: MUTED }}>
                lately
              </span>
              <div className="lately-fan flex w-full items-start justify-between">
                <style>{`
                  .lately-fan > figure { transition: transform 500ms cubic-bezier(0.16,1,0.3,1); }
                  .lately-fan > figure:nth-child(1) { transform: rotate(-5deg); }
                  .lately-fan > figure:nth-child(2) { transform: rotate(3deg) translateY(10px); }
                  .lately-fan > figure:nth-child(3) { transform: rotate(-2deg) translateY(2px); }
                  .lately-fan:hover > figure:nth-child(1) { transform: rotate(-11deg) translate(-22px,-12px) scale(1.03); }
                  .lately-fan:hover > figure:nth-child(2) { transform: rotate(2deg) translateY(-8px) scale(1.05); }
                  .lately-fan:hover > figure:nth-child(3) { transform: rotate(8deg) translate(22px,-12px) scale(1.03); }
                  @media (prefers-reduced-motion: reduce) {
                    .lately-fan > figure { transition: none; }
                    .lately-fan:hover > figure:nth-child(1) { transform: rotate(-5deg); }
                    .lately-fan:hover > figure:nth-child(2) { transform: rotate(3deg) translateY(10px); }
                    .lately-fan:hover > figure:nth-child(3) { transform: rotate(-2deg) translateY(2px); }
                  }
                `}</style>
                {LATELY.map((src) => (
                  <figure
                    key={src}
                    className="m-0 w-[32%] rounded-[2px] p-[10px] pb-[34px]"
                    style={{
                      background: 'light-dark(#ffffff, #3a3d44)',
                      boxShadow: '0 16px 30px -12px rgba(20,22,26,0.5)',
                    }}
                  >
                    <div className="relative h-0 w-full pb-[92%]">
                      <Image src={src} alt="" fill sizes="180px" className="rounded-[1px] object-cover" />
                    </div>
                  </figure>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* the shared badge */}
      <div
        aria-hidden={badge === null}
        className="pointer-events-none fixed z-[9000] max-w-[290px] rounded-md border p-[13px_15px] text-[14px] leading-[1.55]"
        style={{
          left: badge?.x ?? 0,
          top: badge?.y ?? 0,
          background: COLORS.surface,
          color: INK,
          borderColor: HAIRLINE,
          boxShadow: '0 18px 36px -14px rgba(20,22,26,0.30)',
          opacity: badge ? 1 : 0,
          transform: badge ? 'none' : 'translateY(5px)',
          transition: 'opacity .18s, transform .18s',
          fontFamily: BODY,
        }}
      >
        <span className="mb-1.5 block text-[10px] uppercase tracking-[0.16em] [color:var(--accent)]" style={{ fontFamily: MONO }}>
          {badge?.label ?? ''}
        </span>
        {badge?.text ?? ''}
      </div>
    </section>
  )
}

/** A dotted term in the copy: hovering opens the shared badge, does not navigate. */
function BadgeTerm({
  label,
  children,
  onOpen,
  onClose,
}: {
  label: string
  children: React.ReactNode
  onOpen: (e: MouseEvent | FocusEvent, label: string, text: string) => void
  onClose: () => void
}) {
  const text = HOBBIES[label as keyof typeof HOBBIES].desc
  return (
    <span
      tabIndex={0}
      className="cursor-help whitespace-nowrap border-b border-dotted transition-colors duration-200 hover:[color:var(--accent)] hover:[border-color:var(--accent)] focus:[color:var(--accent)]"
      style={{ borderColor: MUTED }}
      onMouseEnter={(e) => onOpen(e, label, text)}
      onMouseLeave={onClose}
      onFocus={(e) => onOpen(e, label, text)}
      onBlur={onClose}
    >
      {children}
    </span>
  )
}

/** A solid-underline link in the copy — navigates. */
function NavTerm({ href, icon, children }: { href: string; icon: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="whitespace-nowrap border-b [border-color:var(--accent)] transition-colors duration-200 hover:[color:var(--accent)]"
    >
      <span aria-hidden className="mr-[3px]">{icon}</span>
      {children}
    </a>
  )
}

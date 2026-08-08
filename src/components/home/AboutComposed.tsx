'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useCallback, useEffect, useRef, useState, type MouseEvent } from 'react'

import { COLORS, FONTS } from '@/styles/tokens'
import VinylCompact from './VinylCompact'
import {
  CELL_EDGE,
  RAMP,
  buildCells,
  relativeTime,
  useContributions,
  useLatestPost,
  useElapsed,
  useReducedMotion,
  useSpotify,
} from './live'

/**
 * The whole of the page below the reel, as one composition.
 *
 * The previous arrangement spent three full-height sections on this material —
 * about, then a 420px record, then a two-column footer row — and measured about
 * 2,500px of scroll with two large voids in it. Everything here is the same
 * content at a density that lets the eye take the page in rather than tour it.
 *
 * ── two rows ────────────────────────────────────────────────────────────────
 *
 *   ┌─────────────┬──────────────────────────────────┐
 *   │             │  the greeting                    │
 *   │  photograph │  the copy                        │
 *   │             │  ── the closing line             │
 *   ├─────────────┼──────────────────────────────────┤
 *   │  the record │  last wrote          commits     │
 *   └─────────────┴──────────────────────────────────┘
 *
 * Both rows are separate grids on IDENTICAL 5fr/7fr tracks rather than one grid
 * with row spans: the photograph and the copy have to balance each other, and a
 * single grid would tie the record's row height to whichever of them ran longer.
 *
 * There was a band of facts between them — based in, studying, instruments,
 * sport, drink. It is gone. Half of it repeated what the paragraph above
 * already said in better words, and once the duplicates were cut what remained
 * was three lines of biographical trivia earning a whole movement of the page.
 * The copy says who he is; it does not need a spec sheet underneath agreeing.
 *
 * All three kickers in the last row — now playing, last wrote, commits — sit on
 * one line across the gutter, which is why that grid is items-start.
 *
 * The closing line is set in the BODY face, not the display serif. It is a
 * statement, not a pull quote; at 32px display it shouted the one thing that
 * should be said levelly.
 *
 * Hierarchy is carried by size and space. Nothing here is a card, and the only
 * saturated colour on the page is the GitHub ramp, which stays quarantined to
 * the commit block.
 */

const {
  ink: INK,
  muted: MUTED,
  bg: BG,
  hairline: HAIRLINE,
  accent: ACCENT,
} = COLORS
const MONO = FONTS.mono
/**
 * Read through the custom property rather than straight from FONTS: /preview
 * rebinds --font-body on its wrapper so the body face can be swapped live.
 * FONTS.body is the fallback for every other route, where nothing rebinds it.
 */
const BODY = `var(--font-body, ${FONTS.body})`

const K_VISITS = 'yh:visits'
const K_LAST = 'yh:last'


// 3 rows x 10 columns = 30 days.
const COLS = 10
const ROWS = 3
const SPAN = COLS * ROWS
const CELL = 11
const GAP = 3.5

/** Opener from the visitor's own clock, so it differs per person, per session. */
function timeOfDay(hour: number): string {
  if (hour < 5) return 'late night'
  if (hour < 12) return 'good morning'
  if (hour < 17) return 'good afternoon'
  if (hour < 22) return 'good evening'
  return 'late night'
}

/** Friendly, deliberately coarse. Nobody wants "it's been 3.4 days". */
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

/** A "visit" is a page load, not a React mount — see the note in resolveMemory. */
let loadMemory: Memory | null = null

/**
 * Read the stored visit, write the current one, and turn the gap into a
 * sentence. Read and write are guarded SEPARATELY: Safari's private mode hands
 * back a working `getItem` and then throws on `setItem`, and lumping the two
 * together would discard a memory we had already read and greet a returning
 * visitor as a stranger.
 */
function resolveMemory(): Memory {
  const now = Date.now()
  let visits = 1
  let previous: number | null = null

  try {
    const rawVisits = window.localStorage.getItem(K_VISITS)
    const rawLast = window.localStorage.getItem(K_LAST)
    const pv = rawVisits === null ? 0 : Number.parseInt(rawVisits, 10)
    const pl = rawLast === null ? 0 : Number.parseInt(rawLast, 10)
    if (Number.isFinite(pv) && pv > 0) visits = pv + 1
    // A clock wound backwards would otherwise report a visit from the future.
    if (Number.isFinite(pl) && pl > 0 && pl <= now) previous = pl
  } catch {
    visits = 1
    previous = null
  }

  try {
    window.localStorage.setItem(K_VISITS, String(visits))
    window.localStorage.setItem(K_LAST, String(now))
  } catch {
    // Write blocked; whatever was read above still stands and still shows.
  }

  const open = timeOfDay(new Date().getHours())
  if (previous === null) return { line: `${open} — first time here`, returning: false }

  const rel = relative(now - previous)
  const line =
    rel === 'just now'
      ? `${open} — welcome back, that was quick`
      : `${open} — welcome back, it’s been ${rel}`
  return { line, returning: true }
}

const LABEL = 'text-[12px] uppercase leading-none tracking-[0.2em]'

/** ms -> m:ss. Hours would be a podcast, and this is a record. */
function clock(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000))
  const m = Math.floor(total / 60)
  const sec = total % 60
  return `${m}:${sec < 10 ? '0' : ''}${sec}`
}

export default function AboutComposed({ font }: { font: string }) {
  const still = useReducedMotion()

  // ── the greeting ──────────────────────────────────────────────────────────
  // Starts null so the first client render matches the server byte for byte.
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

  // ── the record ────────────────────────────────────────────────────────────
  // Only ever the real thing. There is no placeholder track: the record turns
  // with a resting label until Spotify answers, and the type below it is held
  // at opacity 0 in space already reserved for it, so nothing moves when it
  // lands and nothing shows while there is nothing to say.
  const { track: live, settled: liveSettled } = useSpotify()

  // Position within the track, extrapolated between polls. Zero when there is
  // no track, which has no position to report.
  const elapsedMs = useElapsed(live)
  const progress = live?.durationMs ? elapsedMs / live.durationMs : 0

  // ── the live readouts ─────────────────────────────────────────────────────
  const { days, total } = useContributions(SPAN)
  const { post, settled } = useLatestPost()
  const cells = buildCells(days, SPAN)
  const when = post ? relativeTime(post.date) : null

  const gridWrapRef = useRef<HTMLDivElement | null>(null)
  const [tip, setTip] = useState<{ x: number; y: number; text: string } | null>(null)

  const onCellEnter = useCallback((e: MouseEvent<HTMLDivElement>) => {
    const text = e.currentTarget.dataset.tip
    const wrap = gridWrapRef.current
    if (!text || !wrap) return
    const r = e.currentTarget.getBoundingClientRect()
    const box = wrap.getBoundingClientRect()
    // The label is monospace at a known size, so its width is arithmetic rather
    // than a measurement — no reflow to place a tooltip.
    const half = (text.length * 6.6 + 16) / 2
    setTip({
      x: Math.min(Math.max(r.left - box.left + r.width / 2, half), Math.max(half, box.width - half)),
      y: r.top - box.top,
      text,
    })
  }, [])

  const fade = still ? 'none' : 'opacity 500ms ease'

  return (
    <section
      id="about"
      className="w-full scroll-mt-20 pt-20 pb-6 md:pt-28 md:pb-8"
      style={{ backgroundColor: BG, color: INK }}
    >
      <div className="mx-auto max-w-[1100px] px-6">
        {/* section label, hairline running off to the right */}
        <div className="flex items-center gap-4 md:gap-6">
          <h2 className={`shrink-0 ${LABEL}`} style={{ fontFamily: MONO, color: MUTED }}>
            about
          </h2>
          <span aria-hidden className="h-px flex-1" style={{ backgroundColor: HAIRLINE }} />
        </div>

        {/* ── 1 + 2 — the print, the copy, the closing line ──────────────── */}
        {/* No items-start: the figure stretches to the row, so the photograph
            ends level with the copy beside it instead of stopping short and
            leaving a notch of dead space under the print. */}
        <div className="mt-10 grid grid-cols-1 gap-x-12 gap-y-10 md:mt-14 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-x-16">
          <figure className="group flex w-full max-w-[360px] flex-col md:max-w-none">
            {/* 4:5 on a phone, where the row height means nothing; on md+ the
                box gives up its aspect ratio and takes whatever is left after
                the caption, which is what makes the two columns end together. */}
            <div
              className="relative aspect-[4/5] w-full overflow-hidden rounded-[3px] md:aspect-auto md:min-h-[420px] md:flex-1"
              style={{
                backgroundColor: 'rgba(20,22,26,0.04)',
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
                className="object-cover object-[48%_50%] transition-transform duration-[900ms] ease-out motion-safe:group-hover:scale-[1.02] motion-reduce:transition-none"
              />
              <span
                aria-hidden
                className="pointer-events-none absolute inset-0 rounded-[3px]"
                style={{ boxShadow: `inset 0 0 0 1px ${HAIRLINE}` }}
              />
            </div>
            {/* "engineer, and a few other things." used to sit here. It now
                lands under the ASCII name in the hero, where it reads as the
                second line of the mark rather than a caption to a photograph. */}
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
            {/* the whisper. The box reserves the tallest the line can get, so the
                copy below never moves when the greeting arrives. */}
            <div className="mb-6 min-h-8 sm:min-h-4">
              <span
                className={`inline-flex items-start gap-2 text-[12px] leading-4 uppercase tracking-[0.14em] transition-opacity duration-700 ease-out motion-reduce:transition-none ${
                  memory === null ? 'opacity-0' : 'opacity-100'
                }`}
                style={{ fontFamily: MONO, color: MUTED }}
              >
                {memory !== null && memory.returning ? (
                  <span
                    aria-hidden
                    className="mt-1.5 inline-block h-1 w-1 shrink-0 rounded-full"
                    style={{ backgroundColor: ACCENT }}
                  />
                ) : null}
                {memory === null ? '' : memory.line}
              </span>
            </div>

            <div
              className="space-y-5 text-[16px] leading-relaxed md:text-[18px]"
              style={{ fontFamily: BODY, color: INK }}
            >
              <p>
                I&rsquo;m Yihan, a computer engineering and CS student at USC. Most of my week goes
                to making software act on its own: fine-tuning models to someone&rsquo;s taste,
                testing whether AI systems behave the way they&rsquo;re supposed to (and documenting
                the many ways they don&rsquo;t), and wiring up retrieval across hundreds of thousands
                of records that all insist they&rsquo;re relevant.
              </p>
              <p>
                The rest of my time is less structured. Fifteen years of piano, three of tenor sax,
                some photography, and more movies than a person can reasonably defend. I also play
                badminton with a level of competitiveness the sport did not ask for and cannot
                contain.
              </p>
              {/* The closing line is just the third paragraph. It used to sit in
                  its own block behind a short hairline tick, which meant its
                  gap was assembled out of a margin, a rule and another margin
                  and could not help but differ from the 20px `space-y-5` sets
                  between the other two. Same flow, same interval, no arithmetic
                  to keep in agreement — and the line carries itself without a
                  mark announcing it. */}
              <p>
                I like building two kinds of things: the ones that work and the ones that matter.
                Occasionally the same thing.
              </p>
            </div>
          </div>
        </div>

        {/* ── the live row: the record, the last post, the commit block ────
            One 12-column grid, 5 / 4 / 3. It used to be the same 5fr/7fr as the
            row above with a nested 1fr/auto inside the right half, and that
            nested `1fr` pooled every spare pixel into one gap: 211px of nothing
            between the end of the post title and the commit block. Three
            explicit spans distribute the slack instead of collecting it.

            items-start, not items-center: all three kickers have to sit on one
            line across the gutter, and centring against a 148px disc drops the
            first one. */}
        <div className="mt-20 grid grid-cols-1 items-start gap-x-10 gap-y-10 md:mt-24 md:grid-cols-12 lg:gap-x-12">
          {/* Top-aligned, not centred: "now playing" has to sit on the same
              line as "last wrote" and "commits" across the gutter, and centring
              it against a 148px disc pushed it low. */}
          <div className="flex items-start gap-6 md:col-span-5">
            <VinylCompact
                reduced={still}
                size={148}
                art={live?.image ?? null}
                progress={progress}
              />
            <div className="min-w-0">
              <span className={LABEL} style={{ fontFamily: MONO, color: MUTED }}>
                {live && !live.isPlaying ? 'last played' : 'now playing'}
              </span>
              {/* Reserved height so a longer title never shifts the row, and
                  held at opacity 0 until the first poll answers — exactly what
                  the "last wrote" column beside it does. Without the gate this
                  rendered its heading over two empty lines on every load until
                  the fetch landed, and permanently whenever Spotify could not
                  answer at all. */}
              <div
                className="mt-4 min-h-[4.25rem]"
                style={{ opacity: liveSettled ? 1 : 0, transition: fade }}
              >
                <p
                  className="text-[20px] leading-[1.2] text-balance"
                  style={{ fontFamily: font, color: INK }}
                >
                  {live?.title ?? ''}
                </p>
                <p className="mt-1.5 text-[16px]" style={{ fontFamily: BODY, color: MUTED }}>
                  {live?.artist ?? ''}
                </p>
              </div>
              {/* The clock only runs while something is actually playing.
                  A paused or last-played track reports position 0, and
                  "0:00 / 2:50" then reads as a stalled player rather than as
                  nothing happening — it is a number that looks live and is not.
                  Everything else falls back to the speed, which is the one true
                  thing a stationary record can say about itself. */}
              <span
                className="mt-3 block text-[12px] tracking-[0.2em] uppercase tabular-nums"
                style={{ fontFamily: MONO, color: MUTED }}
              >
                {live?.isPlaying && live.durationMs
                  ? `${clock(elapsedMs)} / ${clock(live.durationMs)}`
                  : '33 1/3 rpm'}
              </span>
            </div>
          </div>

          {/* the two live readouts share the right half of this row */}
          <div className="min-w-0 md:col-span-4">
              <span className={LABEL} style={{ fontFamily: MONO, color: MUTED }}>
                last wrote
              </span>
              <div
                className="mt-4 min-h-[4.25rem]"
                style={{ opacity: settled ? 1 : 0, transition: fade }}
              >
                {post ? (
                  <>
                    <h3 className="max-w-[24ch] text-balance">
                      <Link
                        href={post.href}
                        className="text-[20px] leading-[1.2] decoration-1 underline-offset-[6px] transition-colors duration-200 hover:underline focus-visible:underline"
                        style={{ fontFamily: font, color: INK }}
                      >
                        {post.title}
                      </Link>
                    </h3>
                    {(when || post.category) && (
                      <p
                        className="mt-2.5 text-[12px] leading-none tracking-[0.18em] uppercase"
                        style={{ fontFamily: MONO, color: MUTED }}
                      >
                        {[when, post.category].filter(Boolean).join('  ·  ')}
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-[16px]" style={{ fontFamily: BODY, color: MUTED }}>
                    nothing new yet
                  </p>
                )}
              </div>
            </div>
            <div className="md:col-span-3">
              <span className={LABEL} style={{ fontFamily: MONO, color: MUTED }}>
                commits
              </span>
              {/* 23px, not the 16px its neighbour uses. The two blocks are
                  box-aligned already, but a 20px serif at 1.2 leading puts its
                  cap 7px below its own box top while a grid cell starts at
                  pixel zero — so matching the boxes left the grid visibly high.
                  This aligns the ink, which is the only alignment anyone sees. */}
              <div ref={gridWrapRef} className="relative mt-[23px]">
                <div
                  onMouseLeave={() => setTip(null)}
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
                      data-tip={c.tip ?? undefined}
                      onMouseEnter={onCellEnter}
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
                {/* the one factual claim — withheld until the data arrives */}
                <div
                  aria-hidden={total === null}
                  className="mt-3.5 flex items-baseline gap-2.5"
                  style={{
                    opacity: total === null ? 0 : 1,
                    visibility: total === null ? 'hidden' : 'visible',
                    transition: fade,
                  }}
                >
                  <span
                    className="text-[32px] leading-none"
                    style={{ fontFamily: font, color: INK }}
                  >
                    {total === null ? '0' : total.toLocaleString('en-US')}
                  </span>
                  <span
                    className="text-[12px] leading-none tracking-[0.18em] uppercase"
                    style={{ fontFamily: MONO, color: MUTED }}
                  >
                    in 30 days
                  </span>
                </div>
                <div
                  aria-hidden
                  className="pointer-events-none absolute z-10 rounded-[3px] px-1.5 py-1 text-[12px] leading-none whitespace-nowrap"
                  style={{
                    left: tip?.x ?? 0,
                    top: tip?.y ?? 0,
                    transform: 'translate(-50%, -100%) translateY(-7px)',
                    fontFamily: MONO,
                    letterSpacing: '0.04em',
                    background: INK,
                    color: BG,
                    opacity: tip ? 1 : 0,
                    visibility: tip ? 'visible' : 'hidden',
                    transition: still ? 'none' : 'opacity 120ms ease',
                  }}
                >
                  {tip?.text ?? ''}
                </div>
              </div>
            </div>
          </div>
        </div>
    </section>
  )
}

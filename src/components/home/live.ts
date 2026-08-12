'use client'

import { useEffect, useState } from 'react'

/**
 * Shared plumbing for the two live readouts — the thirty-day contribution block
 * and the most recent post.
 *
 * This was lifted out of LiveFooterRow so the compact arrangement on the new
 * homepage does not fork it. The parsing here is deliberately paranoid: both
 * endpoints are narrowed field by field rather than cast, because a shape change
 * upstream should degrade to "no number claimed" rather than to a crash or, far
 * worse, a confidently wrong figure on the page.
 */

// ── the classic GitHub light ramp, verbatim ──────────────────────────────────
export const RAMP = ['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39']
export const CELL_EDGE = 'rgba(27,31,35,0.06)'

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']

export interface Day {
  date: string
  level: number
  count: number
}

export interface Cell {
  key: string
  level: number
  /** null for padding cells, which are not real days and get no tooltip. */
  tip: string | null
}

export interface LatestPost {
  title: string
  href: string
  category: string
  date: string
  excerpt: string
}

const pad2 = (n: number) => (n < 10 ? `0${n}` : String(n))

function todayISO(): string {
  const d = new Date()
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

/** "2026-07-07" -> "jul 7" */
export function shortDate(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
  if (!m) return ''
  return `${MONTHS[Number(m[2]) - 1] ?? ''} ${Number(m[3])}`
}

/** today / yesterday / N days / N weeks / N months / N years — or nothing. */
export function relativeTime(iso: string): string | null {
  if (!iso) return null
  const then = new Date(iso)
  if (Number.isNaN(then.getTime())) return null
  const midnight = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
  const days = Math.round((midnight(new Date()) - midnight(then)) / 86_400_000)
  if (days <= 0) return 'today'
  if (days === 1) return 'yesterday'
  if (days < 7) return `${days} days ago`
  if (days < 30) {
    const weeks = Math.floor(days / 7)
    return `${weeks} week${weeks === 1 ? '' : 's'} ago`
  }
  const months = Math.floor(days / 30)
  if (months < 12) return `${months} month${months === 1 ? '' : 's'} ago`
  const years = Math.floor(days / 365)
  return `${years} year${years === 1 ? '' : 's'} ago`
}

/**
 * Narrow /api/contributions without trusting its shape, then keep only the last
 * `span` real days. GitHub pads the trailing week of its calendar with dates
 * that have not happened; those are dropped before the slice, or the window
 * would be short by however far into the week we are.
 */
export function parseDays(raw: unknown, span: number): Day[] {
  if (typeof raw !== 'object' || raw === null) return []
  const body = raw as { days?: unknown }
  if (!Array.isArray(body.days)) return []

  const cutoff = todayISO()
  const out: Day[] = []
  for (const item of body.days) {
    if (typeof item !== 'object' || item === null) continue
    const d = item as { date?: unknown; level?: unknown; count?: unknown }
    if (typeof d.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(d.date)) continue
    if (d.date > cutoff) continue
    const lvl = typeof d.level === 'number' && Number.isFinite(d.level) ? Math.round(d.level) : 0
    const cnt = typeof d.count === 'number' && Number.isFinite(d.count) ? Math.round(d.count) : 0
    out.push({
      date: d.date,
      level: Math.min(4, Math.max(0, lvl)),
      count: Math.max(0, cnt),
    })
  }
  out.sort((a, b) => a.date.localeCompare(b.date))
  return out.slice(-span)
}

/** Always exactly `span` cells, so geometry never depends on the network. */
export function buildCells(days: Day[], span: number): Cell[] {
  const cells: Cell[] = []
  for (let i = days.length; i < span; i += 1) cells.push({ key: `pad-${i}`, level: 0, tip: null })
  for (const d of days) {
    cells.push({ key: d.date, level: d.level, tip: `${d.count} · ${shortDate(d.date)}` })
  }
  return cells
}

/** Narrow /api/latest-post. A post without a title or a destination is not a post. */
export function parsePost(raw: unknown): LatestPost | null {
  if (typeof raw !== 'object' || raw === null) return null
  const candidate = (raw as { post?: unknown }).post
  if (typeof candidate !== 'object' || candidate === null) return null
  const { title, href, category, date, excerpt } = candidate as Record<string, unknown>
  if (typeof title !== 'string' || !title.trim()) return null
  if (typeof href !== 'string' || !href.trim()) return null
  return {
    title: title.trim(),
    href: href.trim(),
    category: typeof category === 'string' ? category.trim() : '',
    date: typeof date === 'string' ? date : '',
    excerpt: typeof excerpt === 'string' ? excerpt.trim() : '',
  }
}

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const apply = () => setReduced(mq.matches)
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [])
  return reduced
}

/**
 * Two retries, spaced — not a poll. `/api/contributions` says `ok: false` when
 * GitHub refused it, which is worth a second look; an honestly empty year is
 * accepted first time.
 */
const CONTRIB_BACKOFF = [1200, 4000]

function refused(raw: unknown): boolean {
  return typeof raw === 'object' && raw !== null && (raw as { ok?: unknown }).ok === false
}

/** The thirty-day window. Null total means "not answered yet"; no number is shown. */
export function useContributions(span: number) {
  const [days, setDays] = useState<Day[]>([])
  const [total, setTotal] = useState<number | null>(null)

  useEffect(() => {
    let alive = true
    const controller = new AbortController()
    const timers: number[] = []

    const again = (n: number) => {
      if (n >= CONTRIB_BACKOFF.length) return
      timers.push(window.setTimeout(() => attempt(n + 1), CONTRIB_BACKOFF[n]))
    }

    const attempt = (n: number) => {
      fetch('/api/contributions', { signal: controller.signal })
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`http ${r.status}`))))
        .then((raw: unknown) => {
          if (!alive) return
          const window30 = parseDays(raw, span)
          if (window30.length > 0) {
            // Data is data even alongside `ok: false` — that is the route's last
            // good answer, which beats a grey block.
            setDays(window30)
            setTotal(window30.reduce((sum, d) => sum + d.count, 0))
            return
          }
          if (refused(raw)) again(n)
          // Otherwise the grey block stays and no number is claimed.
        })
        .catch(() => {
          // An abort is an unmount, not a failure worth retrying.
          if (alive && !controller.signal.aborted) again(n)
        })
    }

    attempt(0)

    return () => {
      alive = false
      controller.abort()
      timers.forEach((t) => window.clearTimeout(t))
    }
  }, [span])

  return { days, total }
}

export interface SpotifyTrack {
  title: string
  artist: string
  url: string
  isPlaying: boolean
  /** Album art, drawn onto the record's label. Null when Spotify has none. */
  image: string | null
  /** Position when this answer was received, ms. */
  progressMs: number
  /** Track length, ms. Zero when Spotify does not report one. */
  durationMs: number
  /**
   * `performance.now()` for the moment `progressMs` was true: arrival, less how
   * long the answer sat in a cache on the way here.
   */
  receivedAt: number
}

/**
 * Staleness of an answer in ms, from `Age` — readable because the request is
 * same-origin. A body reporting 1:12 that was made four seconds ago describes
 * 1:16, and calling it 1:12 puts the readout behind until the next poll yanks it
 * forward. Clamped: a huge age is a broken intermediary, better left alone.
 */
function cacheAgeMs(res: Response): number {
  const raw = res.headers.get('age')
  if (!raw) return 0
  const seconds = Number(raw)
  if (!Number.isFinite(seconds) || seconds <= 0) return 0
  return Math.min(seconds, 60) * 1000
}

/**
 * The real "now playing", when it is configured.
 *
 * Polls every 10s. The position between polls is extrapolated locally by
 * `useElapsed` rather than fetched — a progress bar that needed a network round
 * trip per frame would be absurd, and Spotify's own position only changes at
 * one millisecond per millisecond. Each poll re-syncs, which is what makes
 * pausing, seeking and track changes correct themselves within one interval.
 *
 * Returns `settled` alongside the track, the same shape `useLatestPost` uses.
 * A bare null could not be told apart from "asked, and there is nothing", so
 * the block rendered its heading over an empty box on every load until the
 * first poll — and permanently whenever Spotify could not answer.
 *
 * `settled` latches on the first completed poll, success or failure: the
 * ten-second re-polls must not make the column flicker.
 */
export function useSpotify(): { track: SpotifyTrack | null; settled: boolean } {
  const [track, setTrack] = useState<SpotifyTrack | null>(null)
  const [settled, setSettled] = useState(false)

  useEffect(() => {
    let alive = true
    const controller = new AbortController()

    const load = () => {
      // `no-store` so the browser cannot hand back a position from an earlier
      // poll; the edge cache may still help, and its age is measured not ignored.
      fetch('/api/spotify/now-playing', { signal: controller.signal, cache: 'no-store' })
        .then((r) =>
          r.ok
            ? r.json().then((raw: unknown) => ({ raw, at: performance.now() - cacheAgeMs(r) }))
            : Promise.reject(new Error(`http ${r.status}`)),
        )
        .then(({ raw, at }: { raw: unknown; at: number }) => {
          if (!alive) return
          // Every path below this line is an answer, including the ones that
          // produce no track: a refresh token Spotify has stopped accepting
          // returns `{configured: true, track: null}`, which is a settled "no".
          setSettled(true)
          if (typeof raw !== 'object' || raw === null) return
          const body = raw as { configured?: unknown; track?: unknown }
          if (body.configured !== true) return
          const t = body.track
          if (typeof t !== 'object' || t === null) return
          const { title, artist, url, isPlaying, image, progressMs, durationMs } =
            t as Record<string, unknown>
          if (typeof title !== 'string' || !title.trim()) return
          const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : 0)
          setTrack({
            title: title.trim(),
            artist: typeof artist === 'string' ? artist : '',
            url: typeof url === 'string' ? url : 'https://open.spotify.com',
            isPlaying: isPlaying === true,
            image: typeof image === 'string' && image ? image : null,
            progressMs: num(progressMs),
            durationMs: num(durationMs),
            receivedAt: at,
          })
        })
        .catch(() => {
          // An aborted request is a unmount, not an answer — settling here would
          // flash the column open on the way out.
          if (alive && !controller.signal.aborted) setSettled(true)
        })
    }

    load()
    const id = window.setInterval(load, 10_000)
    // Never let a hanging request strand the column in its blank reserved
    // state, the same 4s backstop /api/latest-post gets.
    const bail = window.setTimeout(() => {
      if (alive) setSettled(true)
    }, 4000)

    return () => {
      alive = false
      controller.abort()
      window.clearInterval(id)
      window.clearTimeout(bail)
    }
  }, [])

  return { track, settled }
}

/** `settled` goes true once we know the answer — including "there isn't one". */
export function useLatestPost() {
  const [post, setPost] = useState<LatestPost | null>(null)
  const [settled, setSettled] = useState(false)

  useEffect(() => {
    let alive = true
    const controller = new AbortController()

    fetch('/api/latest-post', { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`http ${r.status}`))))
      .then((raw: unknown) => {
        if (!alive) return
        setPost(parsePost(raw))
        setSettled(true)
      })
      .catch(() => {
        if (alive) setSettled(true)
      })

    // Never let a hanging request strand the column in its blank reserved state.
    const bail = window.setTimeout(() => {
      if (alive) setSettled(true)
    }, 4000)

    return () => {
      alive = false
      controller.abort()
      window.clearTimeout(bail)
    }
  }, [])

  return { post, settled }
}

/**
 * The live position, extrapolated between polls.
 *
 * Ticks on a timer rather than rAF: this drives a text readout and a tonearm
 * angle, neither of which needs 60fps, and a 500ms tick is two orders of
 * magnitude cheaper. The record's own canvas loop is where per-frame work
 * belongs.
 *
 * A paused track does not advance — `isPlaying` is false and the position is
 * frozen wherever the last poll left it, which is what Spotify itself reports.
 */
export function useElapsed(track: SpotifyTrack | null): number {
  const [now, setNow] = useState(() => performance.now())

  useEffect(() => {
    if (!track || !track.isPlaying) return
    // Re-base as the poll lands: until the next tick `now` predates `receivedAt`,
    // the sum clamps at zero, and the clock stalls for half a second every poll.
    setNow(performance.now())
    const id = window.setInterval(() => setNow(performance.now()), 500)
    return () => window.clearInterval(id)
  }, [track])

  if (!track) return 0
  if (!track.isPlaying) return track.progressMs
  const elapsed = track.progressMs + Math.max(0, now - track.receivedAt)
  return track.durationMs ? Math.min(elapsed, track.durationMs) : elapsed
}

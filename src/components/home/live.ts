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

/** The thirty-day window. Null total means "not answered yet"; no number is shown. */
export function useContributions(span: number) {
  const [days, setDays] = useState<Day[]>([])
  const [total, setTotal] = useState<number | null>(null)

  useEffect(() => {
    let alive = true
    const controller = new AbortController()

    fetch('/api/contributions', { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`http ${r.status}`))))
      .then((raw: unknown) => {
        if (!alive) return
        const window30 = parseDays(raw, span)
        if (window30.length === 0) return // grey block stays; no number is claimed
        setDays(window30)
        setTotal(window30.reduce((n, d) => n + d.count, 0))
      })
      .catch(() => {
        // A quiet grid is the failure state. Nothing to say.
      })

    return () => {
      alive = false
      controller.abort()
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
}

/**
 * The real "now playing", when it is configured.
 *
 * Returns null both while in flight and forever after if the integration is not
 * set up, so the caller can simply fall back to the hardcoded rotation without
 * distinguishing "not yet" from "never". Polls at the same 60s the route caches
 * at — polling faster only re-reads the same cached answer.
 */
export function useSpotify(): SpotifyTrack | null {
  const [track, setTrack] = useState<SpotifyTrack | null>(null)

  useEffect(() => {
    let alive = true
    const controller = new AbortController()

    const load = () => {
      fetch('/api/spotify/now-playing', { signal: controller.signal })
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`http ${r.status}`))))
        .then((raw: unknown) => {
          if (!alive) return
          if (typeof raw !== 'object' || raw === null) return
          const body = raw as { configured?: unknown; track?: unknown }
          if (body.configured !== true) return
          const t = body.track
          if (typeof t !== 'object' || t === null) return
          const { title, artist, url, isPlaying, image } = t as Record<string, unknown>
          if (typeof title !== 'string' || !title.trim()) return
          setTrack({
            title: title.trim(),
            artist: typeof artist === 'string' ? artist : '',
            url: typeof url === 'string' ? url : 'https://open.spotify.com',
            isPlaying: isPlaying === true,
            image: typeof image === 'string' && image ? image : null,
          })
        })
        .catch(() => {
          // Silence is the fallback. The rotation keeps playing.
        })
    }

    load()
    const id = window.setInterval(load, 60_000)
    return () => {
      alive = false
      controller.abort()
      window.clearInterval(id)
    }
  }, [])

  return track
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

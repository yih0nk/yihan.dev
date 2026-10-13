'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState, type MouseEvent, type FocusEvent } from 'react'

import { ROLES, type Role } from '@/lib/experience'
import { EMAIL } from '@/lib/site'
import type { InitialNowPlaying } from '@/lib/spotify'
import { COLORS, FONTS } from '@/styles/tokens'
import VinylCompact from './VinylCompact'
import { shortDate, useElapsed, useLatestPost, useReducedMotion, useSpotify } from './live'

/**
 * Everything below the reel, as one composition: the about, the experience
 * folded in from what used to be its own page, and a live column — what is
 * playing, what was written last, and a few photographs. The commit graph
 * moved to its own section below (HomeWork), where it has room for a year.
 *
 * Two kinds of interaction, kept apart. A row in the experience ledger opens a
 * small white badge on hover with what the role was; a solid underline in the
 * copy navigates. The copy itself carries no hover notes: they only restated
 * what the sentence around them already said.
 *
 * Hierarchy is size and space. Nothing here is a card; the only colour is one
 * accent for interaction.
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

/** Snapshots for the "lately" strip — fanned left to right. */
const LATELY = ['/images/lately/01.jpg', '/images/lately/02.jpg', '/images/lately/03.jpg']

// ── clock ─────────────────────────────────────────────────────────────────────
function clock(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000))
  const m = Math.floor(total / 60)
  const sec = total % 60
  return `${m}:${sec < 10 ? '0' : ''}${sec}`
}

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

  // the last post
  const { post } = useLatestPost()

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
      className="w-full scroll-mt-20 pt-20 pb-12 md:pt-28 md:pb-14"
      style={{ backgroundColor: BG, color: INK }}
    >
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

          <div data-reveal className="min-w-0" style={{ '--reveal-delay': '90ms' } as React.CSSProperties}>
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
                <NavTerm href="https://www.usc.edu">
                  USC
                </NavTerm>
                . Right now I&rsquo;m building personalized AI agents at{' '}
                <NavTerm href="https://www.gojuly.ai">July AI</NavTerm> and doing some research on the side.
                Lately I&rsquo;ve been pulled toward robotics and hardware, and you can look at my recent
                work{' '}
                <Link
                  href="/projects"
                  className="border-b [border-color:var(--color-accent)] transition-colors duration-200 hover:[color:var(--color-accent)]"
                >
                  here
                </Link>
                .
              </p>
              <p>
                Outside of that, I dabble in a bit of everything. I&rsquo;ve played piano for fifteen years and
                counting (I performed at Carnegie Hall!), and tenor sax for three, although I&rsquo;m still
                kind of bad at it. I paint and sketch, occasionally take banger photos with my camera, and I
                played competitive badminton in Ontario, where I won doubles gold. Like many other engineers,
                I unfortunately play the infamous League of Legends in my free time&hellip;
              </p>
              <p>So I&rsquo;m an engineer, and a few other things. Most of them started as the thing I did instead of studying.</p>
              <p>
                Summer 2027 is still unclaimed. If you&rsquo;re building something interesting,{' '}
                <a
                  href={`mailto:${EMAIL}`}
                  className="border-b [border-color:var(--color-accent)] [color:var(--color-accent)]"
                >
                  say hi
                </a>
                . Don&rsquo;t be a stranger :)
              </p>
            </div>
          </div>
        </div>

        {/* ── experience (folded in) + the live column ──────────────────────── */}
        <div className="mt-20 grid grid-cols-1 items-start gap-x-12 gap-y-14 md:mt-24 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-x-16">
          {/* experience ledger — compact, capped narrower than the photograph */}
          <div data-reveal>
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
                      className="text-[22px] leading-tight transition-colors group-hover:[color:var(--color-accent)] group-focus:[color:var(--color-accent)]"
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
              className="mt-4 inline-block text-[11px] tracking-[0.1em] [color:var(--color-accent)] underline-offset-[3px] hover:underline"
              style={{ fontFamily: MONO }}
            >
              full résumé →
            </Link>
          </div>

          {/* live column: now playing + commits, then the photographs. Flows
              top-down with one even gap — forcing it to the ledger's full height
              only piled the slack into a single void between the two blocks. */}
          <div className="flex flex-col gap-12">
            <div data-reveal className="grid grid-cols-1 items-start gap-x-10 gap-y-10 sm:grid-cols-[minmax(0,5fr)_minmax(0,4fr)]" style={{ '--reveal-delay': '90ms' } as React.CSSProperties}>
              {/* now playing: the whole record is the way to the song on Spotify,
                  and its title takes the accent on hover, as every link here does */}
              <a
                href={live?.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-hidden={!live}
                aria-label={live ? `${live.title} by ${live.artist}, on Spotify` : undefined}
                tabIndex={live ? 0 : -1}
                className="group flex items-start gap-5"
                style={{ opacity: live ? 1 : 0, transition: fade, pointerEvents: live ? 'auto' : 'none' }}
              >
                <div className="shrink-0" style={{ width: 128, height: 128 }}>
                  {live ? <VinylCompact reduced={still} size={128} art={live.image} progress={progress} /> : null}
                </div>
                <div className="min-w-0">
                  <span className={LABEL} style={{ fontFamily: MONO, color: MUTED }}>
                    {live && !live.isPlaying ? 'last played' : 'now playing'}
                  </span>
                  <div className="mt-3 min-h-[3.5rem]">
                    <p
                      className="text-balance text-[18px] leading-[1.2] underline-offset-4 transition-colors duration-200 group-hover:[color:var(--color-accent)] group-hover:underline group-focus-visible:underline"
                      style={{ fontFamily: font, color: INK }}
                    >
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
              </a>

              {/* last wrote: the newest post, the way "last played" is the
                  newest song */}
              <div aria-hidden={!post} style={{ opacity: post ? 1 : 0, transition: fade }}>
                <span className={LABEL} style={{ fontFamily: MONO, color: MUTED }}>
                  last wrote
                </span>
                <div className="mt-3 min-h-[3.5rem]">
                  {post ? (
                    <Link
                      href={post.href}
                      className="text-balance text-[18px] leading-[1.2] underline-offset-4 hover:underline"
                      style={{ fontFamily: font, color: INK }}
                    >
                      {post.title}
                    </Link>
                  ) : null}
                  {post?.excerpt ? (
                    <p className="mt-1 line-clamp-2 text-[14px]" style={{ fontFamily: BODY, color: MUTED }}>
                      {post.excerpt}
                    </p>
                  ) : null}
                </div>
                <span className="mt-2 block text-[11px] uppercase tracking-[0.18em]" style={{ fontFamily: MONO, color: MUTED }}>
                  {post ? [post.date ? shortDate(post.date) : '', post.category].filter(Boolean).join(' · ') : ''}
                </span>
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
                  .lately-fan > figure:nth-of-type(1) { transform: rotate(-5deg); }
                  .lately-fan > figure:nth-of-type(2) { transform: rotate(3deg) translateY(10px); }
                  .lately-fan > figure:nth-of-type(3) { transform: rotate(-2deg) translateY(2px); }
                  .lately-fan:hover > figure:nth-of-type(1) { transform: rotate(-11deg) translate(-22px,-12px) scale(1.03); }
                  .lately-fan:hover > figure:nth-of-type(2) { transform: rotate(2deg) translateY(-8px) scale(1.05); }
                  .lately-fan:hover > figure:nth-of-type(3) { transform: rotate(8deg) translate(22px,-12px) scale(1.03); }
                  @media (prefers-reduced-motion: reduce) {
                    .lately-fan > figure { transition: none; }
                    .lately-fan:hover > figure:nth-of-type(1) { transform: rotate(-5deg); }
                    .lately-fan:hover > figure:nth-of-type(2) { transform: rotate(3deg) translateY(10px); }
                    .lately-fan:hover > figure:nth-of-type(3) { transform: rotate(-2deg) translateY(2px); }
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
        <span className="mb-1.5 block text-[10px] uppercase tracking-[0.16em] [color:var(--color-accent)]" style={{ fontFamily: MONO }}>
          {badge?.label ?? ''}
        </span>
        {badge?.text ?? ''}
      </div>
    </section>
  )
}

/** A solid-underline link in the copy — navigates. */
function NavTerm({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="whitespace-nowrap border-b [border-color:var(--color-accent)] transition-colors duration-200 hover:[color:var(--color-accent)]"
    >
      {children}
    </a>
  )
}

'use client'

import { useEffect, useRef, useState } from 'react'

import { useThemeColors } from '@/lib/useThemeColors'
import { COLORS_DARK, FONTS, MOTION } from '@/styles/tokens'

import { DOG } from './art/dog'

/**
 * The golden retriever that sits in the footer.
 *
 * Tone comes from two places at once: the glyph (light `;:` through dense `&@`)
 * and the glyph's ink. At 6px the glyph shapes alone all read as the same grey,
 * so every cell also gets its own ink strength from its density: the light fur
 * fades back and the dark patches (eye, ear, nose) stand out.
 *
 * The fur is always moving at the level of the characters: a band of denser
 * fur sweeps through it diagonally like wind, and random interior cells jump
 * two to four places up or down the ramp and drift back. Both get stronger on
 * hover, when a thought bubble comes up over its head. The outline never
 * changes and the box never moves: the drawing is a fixed grid of cells, only
 * interior cells (inked on all four sides) are ever touched, and nothing is
 * re-centred.
 *
 * The shimmer runs on rAF, so it stops in a background tab on its own, and it
 * also stops while the footer is off-screen. Under prefers-reduced-motion the
 * fur stays still and the bubble just fades in.
 */

const RAMP = ' .,:;irsXA253hMHGS#9B&@'
const FONT_PX = 6
const LINE_H = 5
/**
 * Resting shimmer, and the livelier one on hover: ms between ticks, random
 * cells nudged per tick, and how strong the passing ripple is (ramp steps).
 */
const IDLE = { tick: 60, nudges: 14, ripple: 3 }
const AWAKE = { tick: 45, nudges: 34, ripple: 5 }
/** Chance a nudged cell settles back to its own glyph each tick. */
const SETTLE = 0.18
/** The ripple: a diagonal band that sweeps through the fur, like wind. */
const RIPPLE_K = 0.55
const RIPPLE_SPEED = 3.2

const ROWS = DOG.split('\n')
const COLS = Math.max(...ROWS.map((r) => r.length))
const BASE = ROWS.map((r) => [...r.padEnd(COLS)].map((ch) => Math.max(0, RAMP.indexOf(ch))))

/**
 * Ink strength for a ramp index: light fur ~22%, the densest cells ~96% in the
 * light theme; 26 to 78% in the dark one, where the tones are inverted (see
 * DARK_FLOOR) and the brightest cells are the pale fur.
 */
const ink = (d: number, dark: boolean) => {
  if (d === 0) return 'transparent'
  const t = (d / (RAMP.length - 1)) ** 1.3
  const pct = dark ? 26 + 52 * t : 22 + 74 * t
  return `color-mix(in srgb, var(--color-ink) ${Math.round(pct)}%, transparent)`
}

/**
 * The drawing is dark ink on white at heart. With light ink, dense would mean
 * bright and the dog would read as a photo negative, its shadows glowing. So in
 * the dark theme the interior is drawn inverted, pale fur bright and shadow
 * dim, with a floor of `A` so the shaded side of the head never drops into the
 * page. Edge cells keep their own light glyphs, or the outline becomes a rim.
 */
const DARK_FLOOR = RAMP.indexOf('A')

export default function FooterDog({ className = '' }: { className?: string }) {
  const artRef = useRef<HTMLPreElement | null>(null)
  const [awake, setAwake] = useState(false)
  const awakeRef = useRef(false)
  awakeRef.current = awake

  // The tones depend on the theme (see DARK_FLOOR), so every cell is
  // repainted when it changes.
  const dark = useThemeColors().bg === COLORS_DARK.bg

  useEffect(() => {
    const art = artRef.current
    if (!art) return

    const cells = Array.from(art.querySelectorAll<HTMLSpanElement>('span[data-c]'))
    const top = RAMP.length - 1
    const inked = (r: number, c: number) => r >= 0 && r < BASE.length && c >= 0 && c < COLS && BASE[r][c] > 0
    const baseAt = (i: number) => BASE[Math.floor(i / COLS)][i % COLS]
    const inverted = (d: number) => Math.max(DARK_FLOOR, top + 1 - d)
    // interior only: a cell at the silhouette's edge that changes reads as the
    // outline breaking, not as fur
    const interior: number[] = []
    BASE.forEach((row, r) =>
      row.forEach((d, c) => {
        if (d >= 1 && inked(r - 1, c) && inked(r + 1, c) && inked(r, c - 1) && inked(r, c + 1)) interior.push(r * COLS + c)
      }),
    )
    /** The resting tone of an interior cell in the current theme. */
    const toneAt = (i: number) => (dark ? inverted(baseAt(i)) : baseAt(i))
    const shown = new Map<number, number>(interior.map((i) => [i, baseAt(i)]))
    const nudged = new Map<number, number>()
    const paint = (i: number, d: number) => {
      if (shown.get(i) === d) return
      shown.set(i, d)
      cells[i].textContent = RAMP[d]
      cells[i].style.color = ink(d, dark)
    }
    // edges keep their glyph but take the theme's ink
    cells.forEach((cell, i) => {
      const d = baseAt(i)
      if (d > 0) cell.style.color = ink(d, dark)
    })
    for (const i of interior) paint(i, toneAt(i))
    const rest = () => {
      for (const i of interior) paint(i, baseAt(i))
    }
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return rest

    let visible = false
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting
    })
    io.observe(art)

    let raf = 0
    let last = 0
    const frame = (now: number) => {
      const mode = awakeRef.current ? AWAKE : IDLE
      if (visible && now - last >= mode.tick) {
        last = now
        for (const i of [...nudged.keys()]) if (Math.random() < SETTLE) nudged.delete(i)
        for (let k = 0; k < mode.nudges; k++) {
          const i = interior[Math.floor(Math.random() * interior.length)]
          const size = 2 + Math.floor(Math.random() * 3)
          nudged.set(i, Math.random() < 0.5 ? -size : size)
        }
        // a band of denser fur sweeps diagonally through the dog, then around
        const phase = (now / 1000) * RIPPLE_SPEED
        for (const i of interior) {
          const r = Math.floor(i / COLS)
          const c = i % COLS
          const wave = Math.sin(RIPPLE_K * (r + c * 0.6) - phase)
          const ripple = wave > 0.6 ? Math.round(mode.ripple * (wave - 0.6) / 0.4) : 0
          const d = toneAt(i) + ripple + (nudged.get(i) ?? 0)
          paint(i, Math.max(1, Math.min(top, d)))
        }
      }
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => {
      cancelAnimationFrame(raf)
      io.disconnect()
      rest()
    }
  }, [dark])

  // The bubble grows out of the head: the small circle first, then the larger
  // one, then the bubble itself, each easing up from a little below and a
  // little smaller. On the way out they all go at once.
  const bit = (delay: number) => ({
    // Tailwind 4's translate-y-* and scale-* set the standalone `translate`
    // and `scale` properties, not `transform`
    transitionProperty: 'opacity, translate, scale',
    transitionDuration: '420ms',
    transitionTimingFunction: MOTION.ease,
    transitionDelay: awake ? `${delay}ms` : '0ms',
  })
/**
 * The bubble rises and fades; it does NOT scale. A scaled-up element is
 * rasterised at its small size and stretched, so the text came in blurry and
 * only sharpened when the transition ended. The dots have no text, so they keep
 * their grow.
 */
  const shown = awake ? 'opacity-100' : 'opacity-0 motion-safe:translate-y-1'
  const shownDot = awake ? 'opacity-100' : 'opacity-0 motion-safe:translate-y-1 motion-safe:scale-90'
  const dot = { border: '1px solid var(--color-hairline)', background: 'var(--color-bg)' }

  return (
    <div
      className={`relative select-none ${className}`}
      onPointerEnter={() => setAwake(true)}
      onPointerLeave={() => setAwake(false)}
      style={{ overflowAnchor: 'none' }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-full right-0 z-10 mb-1 flex flex-col items-end"
        style={{ overflowAnchor: 'none' }}
      >
        <p
          className={`origin-bottom-right whitespace-nowrap rounded-full px-3 py-1.5 text-[12px] ${shown}`}
          style={{
            ...bit(140),
            fontFamily: FONTS.body,
            color: 'var(--color-ink)',
            background: 'var(--color-bg)',
            border: '1px solid var(--color-hairline)',
          }}
        >
          welcome to yihan&apos;s website :&apos;)
        </p>
        {/* the trail of little thought circles, down toward the head */}
        <span className={`mr-10 mt-1 block h-[6px] w-[6px] rounded-full ${shownDot}`} style={{ ...bit(70), ...dot }} />
        <span className={`mr-8 mt-0.5 block h-[4px] w-[4px] rounded-full ${shownDot}`} style={{ ...bit(0), ...dot }} />
      </div>
      <pre
        ref={artRef}
        aria-hidden
        className="m-0"
        style={{
          overflowAnchor: 'none',
          width: `${COLS}ch`,
          fontFamily: FONTS.mono,
          fontSize: `${FONT_PX}px`,
          lineHeight: `${LINE_H}px`,
        }}
      >
        {BASE.map((row, r) => (
          <span key={r}>
            {row.map((d, c) => (
              <span key={c} data-c style={{ color: ink(d, false) }}>
                {RAMP[d]}
              </span>
            ))}
            {r < BASE.length - 1 ? '\n' : null}
          </span>
        ))}
      </pre>
    </div>
  )
}

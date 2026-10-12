'use client'

import { useEffect, useRef, useState } from 'react'

import { useThemeColors } from '@/lib/useThemeColors'
import { COLORS, FONTS } from '@/styles/tokens'
import ImpastoCanvas, { fitLines, type Box, type NameLayout } from './ImpastoCanvas'
import { NAME, TAGLINE, loadFace } from './shared'

/**
 * The name, always on, beside the hero's object (the Classic).
 *
 * The object can put its own copy of the name away (a window closes), so the
 * name also lives outside it, in a column the object never covers: left of it
 * on a wide screen, above it on a tall one. `heroLayout` hands out both boxes,
 * so the 3D framing and the name agree on where the line between them is.
 *
 * Two treatments, fitting the same box with `fitLines`: the impasto engine
 * (thick paint, its lamp following the pointer), which is the hero's, and
 * plain Instrument Serif, drawn on a 2D canvas, for a browser with no WebGL to
 * paint with.
 */

export type NameMode = 'type' | 'paint'
export type HeroLayout = NameLayout & { portrait: boolean; object: Box }

/** The homepage's content column (`max-w-[1100px] px-6`, centred), which everything below the hero sits in. */
const COLUMN = 1100
const GUTTER = 24

export function heroLayout(W: number, H: number): HeroLayout {
  // the column's left edge: where the about photograph starts. The name hangs
  // from it, so the hero and the page under it share one left edge instead of
  // drifting apart as the screen widens
  const left = Math.max(GUTTER, (W - COLUMN) / 2 + GUTTER)
  if (W / H >= 1.15) {
    // landscape: the name stacked in a left column, the object to its right.
    // The pair is sized from the page column (the object may run past its
    // right edge by up to 30% of it, never past 98% of the screen, so on a wide
    // screen the machine stays big rather than shrinking to fit 1100px), then
    // centred on the screen as a whole: hung from the column's left edge, it
    // sat visibly right of centre with the machine against the right edge
    const right = Math.min(W * 0.98, W - left + (W - 2 * left) * 0.3)
    const span = right - left
    const x0 = Math.max(GUTTER, (W - span) / 2)
    return {
      portrait: false,
      lines: ['yihan', 'hong'],
      lh: 1.06,
      tint: ['blue', 'ink'],
      align: 'left',
      box: { x: x0, y: H * 0.17, w: span * 0.38, h: H * 0.56 },
      object: { x: x0 + span * 0.4, y: H * 0.07, w: span * 0.6, h: H * 0.86 },
    }
  }
  // portrait or square: the name across the top, the object underneath
  const stacked = W < 560
  return {
    portrait: true,
    lines: stacked ? ['yihan', 'hong'] : [NAME],
    lh: 1.06,
    tint: stacked ? ['blue', 'ink'] : ['blue'],
    align: 'left',
    box: { x: left, y: H * 0.08, w: W - 2 * left, h: H * (stacked ? 0.25 : 0.14) },
    object: { x: 0, y: H * (stacked ? 0.39 : 0.28), w: W, h: H * (stacked ? 0.57 : 0.66) },
  }
}

/** Absolutely fills its section, under the object. Pointer-transparent. */
export function NameLayer({ mode }: { mode: NameMode }) {
  const hostRef = useRef<HTMLDivElement>(null)
  const typeRef = useRef<HTMLCanvasElement>(null)
  const theme = useThemeColors()
  const [tag, setTag] = useState<{ x: number; y: number; size: number } | null>(null)

  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    let alive = true
    let face = ''
    const draw = () => {
      if (!alive || !face) return
      const W = host.clientWidth
      const H = host.clientHeight
      if (!W || !H) return
      const L = heroLayout(W, H)
      const probe = document.createElement('canvas').getContext('2d')!
      const fit = fitLines(probe, face, L.lines, L.box, L.lh)
      setTag({ x: L.box.x + fit.size * 0.03, y: fit.bottom + fit.size * 0.06, size: Math.max(18, Math.min(28, fit.size * 0.13)) })
      const c = typeRef.current
      if (!c) return
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      c.width = Math.round(W * dpr)
      c.height = Math.round(H * dpr)
      const x = c.getContext('2d')!
      x.setTransform(dpr, 0, 0, dpr, 0, 0)
      x.clearRect(0, 0, W, H)
      x.textBaseline = 'alphabetic'
      x.textAlign = L.align
      x.font = `400 ${fit.size}px ${face}`
      const ax = L.align === 'left' ? L.box.x + fit.size * 0.03 : L.box.x + L.box.w / 2
      if (L.lines.length === 1 && L.tint?.[0] === 'blue') {
        // one line: "yihan" in the accent, "hong" in ink
        const [first, ...rest] = L.lines[0].split(' ')
        const start = L.align === 'left' ? ax : ax - x.measureText(L.lines[0]).width / 2
        x.textAlign = 'left'
        x.fillStyle = theme.accent
        x.fillText(first, start, fit.baselines[0])
        x.fillStyle = theme.ink
        x.fillText(` ${rest.join(' ')}`, start + x.measureText(first).width, fit.baselines[0])
      } else
        L.lines.forEach((t, i) => {
          x.fillStyle = L.tint?.[i] === 'blue' ? theme.accent : theme.ink
          x.fillText(t, ax, fit.baselines[i])
        })
    }
    void loadFace('display').then((f) => {
      face = f
      draw()
    })
    const ro = new ResizeObserver(draw)
    ro.observe(host)
    return () => {
      alive = false
      ro.disconnect()
    }
  }, [mode, theme])

  return (
    <div ref={hostRef} aria-hidden className="pointer-events-none absolute inset-0">
      {mode === 'paint' ? (
        // a higher lamp than the standalone painting: the pointer is usually over the
        // object, far from the name, and a low lamp from there throws long shadows.
        // The linen stays under the paint: across the whole hero it ended in a hard
        // line at the fold, where the page below is plain white
        <ImpastoCanvas layout={heroLayout} lampHeight={0.3} linen="paint" className="absolute inset-0 h-full w-full" />
      ) : (
        <canvas ref={typeRef} className="absolute inset-0 h-full w-full" />
      )}
      {tag && (
        <p
          className="absolute whitespace-nowrap"
          style={{ left: tag.x, top: tag.y, fontFamily: FONTS.display, fontSize: tag.size, lineHeight: 1.2, color: COLORS.inkSoft }}
        >
          {TAGLINE}
        </p>
      )}
    </div>
  )
}

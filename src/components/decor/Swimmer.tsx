'use client'

import { useEffect, useRef } from 'react'

import { FONTS } from '@/styles/tokens'

/**
 * An ASCII animal that swims through its lane, head first.
 *
 * The parent positions the lane (a tall strip of whitespace, e.g. a page
 * margin). The swimmer:
 *   - travels in the direction its head points and never turns: it swims off
 *     one end of the lane, fading out, and comes back in from the other;
 *   - swims at the level of the characters, not the box. The drawing is held as
 *     a grid of densities and re-sampled every few frames along a gentle bend
 *     that grows toward the tail, so individual cells step denser or lighter as
 *     the body flexes — edges thin to `.` and thicken to `%` one cell at a time
 *     — and a few cells flicker on their own. The outline holds; the texture
 *     moves.
 *
 * `art` is drawn head-up. `headDown` flips the grid (rows reversed — the glyphs
 * themselves stay upright) and sends the swimmer down the lane instead.
 *
 * Travel is a transform per rAF frame; the characters are rewritten through a
 * ref about twenty times a second. rAF stops in background tabs on its own;
 * under prefers-reduced-motion the drawing rests at its starting point.
 */

const RAMP = ' .:-=+*#%@'
const LINE_H = 13
/** Approximate advance of one character: 14px mono (~0.6em) + 0.5px spacing. */
const CHAR_W = 8.9
const REDRAW_MS = 33
const FLICKER = 0.012
const FADE = 70
/** Columns of room on each side, so the tail can swing past the drawing's edge. */
const PAD = 3

/*
 * Swimming kinematics, after how sharks actually move (sub-carangiform
 * swimming): a lateral wave travels from head to tail at about one wavelength
 * per body length; its amplitude is small but not zero at the head (the head
 * yaws), dips to a quiet pivot about a fifth of the way back, then grows
 * steeply to the tail, which carries the largest excursion. Tail beat at
 * cruise is ~0.5–1 Hz. Pectoral fins mostly ride along with the body and make
 * pitch adjustments; here they get their own sweep, exaggerated a little so it
 * reads at ASCII resolution.
 */
/** Tail-beat angular frequency, rad/s (~0.7 Hz). */
const OMEGA = 4.4
/** Phase lag along the body: 0.9 wavelengths from head to tail. */
const WAVE = 2 * Math.PI * 0.9
/**
 * Lateral amplitude in characters at fraction `w` of the way from head (0) to
 * tail (1). The thick body stays under half a character, so only its edge
 * cells change and no row ever jumps a whole column; the big excursion is
 * saved for the thin tail stalk and fin, where moving means a few cells, not a
 * block.
 */
const envelope = (w: number) => {
  const tail = Math.max(0, (w - 0.62) / 0.38)
  return 0.28 + 0.12 * w + 2.3 * tail * tail
}
/** The head turns about the neck rather than sliding: max angle, radians. */
const HEAD_YAW = 0.07
/** Where the neck is, as a fraction of body length from the head. */
const NECK = 0.2
/** Fin sweep along the travel axis (rows) and flare sideways (chars), at a fin's tip. */
const FIN_SWEEP = 1.8
const FIN_FLARE = 0.9

export default function Swimmer({
  art,
  className = '',
  headDown = false,
  speed = 34,
  phase = 0,
}: {
  /** Drawn head-up. */
  art: string
  className?: string
  /** Flip the drawing so the head points down; it then swims down. */
  headDown?: boolean
  /** Travel speed, px/s. */
  speed?: number
  /** 0..1 — where along the lane this swimmer starts. */
  phase?: number
}) {
  const laneRef = useRef<HTMLDivElement | null>(null)
  const bodyRef = useRef<HTMLPreElement | null>(null)

  const rows0 = art.split('\n')
  const rows = headDown ? [...rows0].reverse() : rows0
  // the static first paint carries the same side padding the animation draws
  // with, so the drawing doesn't hop sideways when the first frame lands
  const drawn = rows.map((r) => ' '.repeat(PAD) + r).join('\n')
  // A fixed box, so the drawing's width never changes as the tail swings and
  // the shark is never re-centred frame to frame (which read as the whole body
  // jumping sideways).
  const cols = Math.max(...rows.map((r) => r.length)) + PAD * 2

  useEffect(() => {
    const lane = laneRef.current
    const body = bodyRef.current
    if (!lane || !body) return

    const n = rows.length
    const W = Math.max(...rows.map((r) => r.length))
    // density grid, padded to a rectangle
    const D: number[][] = rows.map((r) => {
      const out = new Array<number>(W).fill(0)
      for (let c = 0; c < r.length; c++) out[c] = Math.max(0, RAMP.indexOf(r[c]))
      return out
    })
    // distance of each row from the head, 0 at the head, 1 at the tail
    const tailness = rows.map((_, r) => {
      const fromHead = headDown ? n - 1 - r : r
      return n > 1 ? fromHead / (n - 1) : 0
    })
    const dir = headDown ? 1 : -1

    let laneW = lane.clientWidth
    let laneH = lane.clientHeight
    const ro = new ResizeObserver(() => {
      laneW = lane.clientWidth
      laneH = lane.clientHeight
    })
    ro.observe(lane)

    const baseX = () => Math.max(0, (laneW - body.offsetWidth) / 2)
    const place = (y: number) => {
      body.style.transform = `translate3d(${baseX()}px, ${y}px, 0)`
    }

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const rest = () => place(Math.max(0, laneH - body.offsetHeight) * phase)
      rest()
      const settle = new ResizeObserver(rest)
      settle.observe(lane)
      return () => {
        settle.disconnect()
        ro.disconnect()
      }
    }

    // ── fins: whatever sticks out past the body's running width ─────────────
    // Per row, the body's edges and centre; then a smoothed half-width over a
    // window of rows, so the fins (sudden local widenings) stand proud of it.
    const left = new Array<number>(n).fill(0)
    const right = new Array<number>(n).fill(-1)
    const centre = new Array<number>(n).fill(W / 2)
    for (let r = 0; r < n; r++) {
      let sum = 0
      let mass = 0
      for (let c = 0; c < W; c++) {
        if (!D[r][c]) continue
        if (right[r] < 0) left[r] = c
        right[r] = c
        sum += c * D[r][c]
        mass += D[r][c]
      }
      if (mass) centre[r] = sum / mass
    }
    const half = (r: number) => (right[r] >= 0 ? (right[r] - left[r]) / 2 : 0)
    const bodyHalf = rows.map((_, r) => {
      const win: number[] = []
      for (let k = Math.max(0, r - 4); k <= Math.min(n - 1, r + 4); k++) win.push(half(k))
      win.sort((a, b) => a - b)
      return win[Math.floor(win.length / 2)]
    })
    /**
     * 0 on the body, rising to 1 at a fin's tip. Pectoral/front fins only: the
     * tail fork also "sticks out", but it already rides the body wave, and
     * sweeping its lobes between rows made cells pop.
     */
    const finness = (r: number, c: number) => {
      if (tailness[r] > 0.72) return 0
      const span = half(r) - bodyHalf[r]
      if (span < 1.5) return 0
      const d = Math.abs(c - centre[r]) - bodyHalf[r]
      return d <= 0 ? 0 : Math.min(1, d / span)
    }

    const densityAt = (r: number, c: number) =>
      r >= 0 && r < n && c >= 0 && c < W ? D[r][c] : 0
    /** Bilinear sample of the density grid at a fractional (row, col). */
    const sample = (rf: number, cf: number) => {
      const r0 = Math.floor(rf)
      const c0 = Math.floor(cf)
      const fr = rf - r0
      const fc = cf - c0
      const top = densityAt(r0, c0) * (1 - fc) + densityAt(r0, c0 + 1) * fc
      const bot = densityAt(r0 + 1, c0) * (1 - fc) + densityAt(r0 + 1, c0 + 1) * fc
      return top * (1 - fr) + bot * fr
    }

    // row masses, to keep the body's centre of mass still (the wave bends the
    // shark; it must not carry it sideways)
    const rowMass = D.map((row) => row.reduce((a, b) => a + b, 0))
    const totalMass = rowMass.reduce((a, b) => a + b, 0) || 1
    // the neck: the row the head turns about. Nearest to NECK rather than the
    // first row past it: with headDown the rows run tail to head, so "first
    // row past NECK" was the tail tip, and the head swung about the far end of
    // the body (~6 chars of sway instead of ~1).
    let neckRow = 0
    tailness.forEach((w, r) => {
      if (Math.abs(w - NECK) < Math.abs(tailness[neckRow] - NECK)) neckRow = r
    })

    const draw = (t: number) => {
      const beat = OMEGA * t
      // the body wave, then re-centred on its mass
      const raw = tailness.map((w) => envelope(w) * Math.sin(beat - WAVE * w))
      let mean = 0
      for (let r = 0; r < n; r++) mean += raw[r] * rowMass[r]
      mean /= totalMass
      // the head's turn, a quarter-beat ahead of the body so it leads
      const yaw = HEAD_YAW * Math.sin(beat + Math.PI / 2)
      const cosY = Math.cos(yaw)
      const sinY = Math.sin(yaw)
      const pr = neckRow
      const pc = centre[pr]

      let out = ''
      for (let r = 0; r < n; r++) {
        const w = tailness[r]
        const bodyDx = raw[r] - mean
        let line = ''
        for (let oc = -PAD; oc < W + PAD; oc++) {
          // where this cell's content came from in the resting drawing
          let rs = r
          let cs = oc - bodyDx
          if (w < NECK) {
            // head: rotate about the neck, in pixel space so rows (13px) and
            // columns (~9px) turn together
            const px = (cs - pc) * CHAR_W
            const py = (rs - pr) * LINE_H
            cs = pc + (px * cosY + py * sinY) / CHAR_W
            rs = pr + (-px * sinY + py * cosY) / LINE_H
          }
          const cb = cs
          const f = finness(r, Math.round(cb))
          if (f > 0) {
            const side = cb < centre[r] ? -1 : 1
            rs -= FIN_SWEEP * f * Math.sin(beat * 1.25 + side * 0.6)
            cs -= FIN_FLARE * f * side * Math.sin(beat * 1.25 + Math.PI / 2)
          }
          let d = sample(rs, cs)
          // flicker the interior only, and never down to a blank — at an edge
          // (or in a two-cell tail row) a vanishing cell reads as a glitch
          if (d >= 3 && Math.random() < FLICKER) d += Math.random() < 0.5 ? -1 : 1
          line += RAMP[Math.max(0, Math.min(RAMP.length - 1, Math.round(d)))]
        }
        out += line.replace(/\s+$/, '') + (r < n - 1 ? '\n' : '')
      }
      body.textContent = out
    }

    let y = 0
    let started = false
    let raf = 0
    let last = performance.now()
    let lastDraw = 0

    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      // lane hidden (window too narrow for a margin): do nothing but wait
      if (laneW === 0 || laneH === 0) {
        raf = requestAnimationFrame(frame)
        return
      }
      const h = body.offsetHeight
      if (!started && laneH > 0) {
        // start `phase` of the way along the loop (lane + one body length)
        y = phase * (laneH + h) - h
        started = true
      }
      y += dir * speed * dt
      // off one end, back in from the other — no turn
      if (dir < 0 && y < -h) y = laneH
      if (dir > 0 && y > laneH) y = -h
      place(y)

      if (now - lastDraw >= REDRAW_MS) {
        lastDraw = now
        draw(now / 1000)
      }
      raf = requestAnimationFrame(frame)
    }

    raf = requestAnimationFrame(frame)
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
    }
    // rows is derived from art + headDown
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [art, headDown, speed, phase])

  return (
    <div
      ref={laneRef}
      aria-hidden
      className={`pointer-events-none select-none overflow-hidden ${className}`}
      style={{
        // Never let the browser pick the swimmer as its scroll anchor. On a
        // reload Chrome restores scroll by putting its saved anchor back where
        // it was; a moving shark is never where it was, so the page chased it
        // to the bottom. (Reproduced in Chrome at 2000px: reload from the top
        // landed at max scroll ~250ms later.)
        overflowAnchor: 'none',
        // fade in and out at the ends of the lane instead of a hard clip
        maskImage: `linear-gradient(to bottom, transparent, #000 ${FADE}px, #000 calc(100% - ${FADE}px), transparent)`,
        WebkitMaskImage: `linear-gradient(to bottom, transparent, #000 ${FADE}px, #000 calc(100% - ${FADE}px), transparent)`,
      }}
    >
      <pre
        ref={bodyRef}
        className="absolute left-0 top-0 m-0 will-change-transform"
        style={{
          overflowAnchor: 'none',
          width: `calc(${cols} * (1ch + 0.5px))`,
          fontFamily: FONTS.mono,
          fontSize: '14px',
          lineHeight: `${LINE_H}px`,
          letterSpacing: '0.5px',
          color: 'color-mix(in srgb, var(--color-ink) 62%, transparent)',
        }}
      >
        {drawn}
      </pre>
    </div>
  )
}

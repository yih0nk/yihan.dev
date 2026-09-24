'use client'

import { useEffect, useRef } from 'react'

import { FONTS } from '@/styles/tokens'

import { buildFrames, frameFor } from './asciiSprite'

/**
 * ASCII paper planes gliding in both margins of /blog, in the same language as
 * the sharks and the footer dog. A plane turns by changing its characters, not
 * by tilting the text: see asciiSprite. Each drifts across its lane
 * and slowly down, bobbing, and wraps from the bottom back to the top. Grab
 * one and throw it: it flies with the flick, loses speed to drag, bounces off
 * the lane's edges, and settles back into its glide.
 *
 * Lanes are the margins beside the 1100px column, shown only at 1400px and
 * wider so a plane never crosses the posts. One rAF per lane; rAF stops in a
 * background tab on its own. Under prefers-reduced-motion the planes rest
 * where they start.
 */

/**
 * Small cells, the same as the footer dog's, so the plane gets enough of them
 * to show its folds and shading: at 10px the whole dart was ~18 characters
 * across and the crease had nowhere to go.
 */
const FONT_PX = 6
/** Source Code Pro advances 0.6em. */
const CHAR_W = FONT_PX * 0.6
const LINE_H = 5
/** Angle steps: 96 (every 3.75deg), so a turn never jumps between shapes. */
const STEPS = 96
/** The drawing box is this many times the plane's nominal size. */
const BOX = 3

/**
 * A classic dart seen side-on, nose right. Paper catches light unevenly, so
 * each surface is shaded in bands rather than filled flat: the wing lightest
 * at its top edge and darkening into the crease, the keel darkest right under
 * the crease and easing toward its tip. Then the folds on top: the centre
 * crease hardest, two lighter folds across the wing, the keel's own fold, and
 * the notch cut into the tail.
 */
const drawPlane = (ctx: CanvasRenderingContext2D, s: number) => {
  const P = (x: number, y: number) => [x * s, y * s]
  const nose = P(0.5, 0)
  const tailTop = P(-0.46, -0.26)
  const tailCut = P(-0.33, -0.12)
  const crease = P(-0.46, -0.02)
  const keel = P(-0.29, 0.19)
  const lerp = (a: number[], b: number[], t: number) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]
  const poly = (pts: number[][], alpha: number) => {
    ctx.globalAlpha = alpha
    ctx.beginPath()
    ctx.moveTo(pts[0][0], pts[0][1])
    for (const q of pts.slice(1)) ctx.lineTo(q[0], q[1])
    ctx.closePath()
    ctx.fill()
  }
  const line = (a: number[], b: number[], alpha: number, w: number) => {
    ctx.globalAlpha = alpha
    ctx.lineWidth = w * s
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(a[0], a[1])
    ctx.lineTo(b[0], b[1])
    ctx.stroke()
  }
  // the wing, in bands from its top edge (light) down to the crease (darker)
  const WING = [0.18, 0.26, 0.34, 0.44]
  WING.forEach((alpha, k) => {
    const t0 = k / WING.length
    const t1 = (k + 1) / WING.length
    poly([nose, lerp(tailTop, crease, t0), lerp(tailTop, crease, t1)], alpha)
  })
  // the keel, darkest under the crease and easing toward its tip
  const KEEL = [0.92, 0.78, 0.62]
  KEEL.forEach((alpha, k) => {
    const t0 = k / KEEL.length
    const t1 = (k + 1) / KEEL.length
    poly([nose, lerp(crease, keel, t0), lerp(crease, keel, t1)], alpha)
  })
  // the notch the tail is cut into, a shade deeper than the wing around it
  poly([tailTop, tailCut, crease], 0.55)
  // folds and edges
  line(nose, crease, 1, 0.03)
  line(nose, lerp(tailTop, crease, 0.35), 0.5, 0.016)
  line(nose, lerp(tailTop, crease, 0.68), 0.42, 0.014)
  line(nose, tailTop, 0.8, 0.02)
  line(crease, keel, 0.75, 0.018)
  line(nose, keel, 0.7, 0.018)
  ctx.globalAlpha = 1
}

const dims = (size: number) => {
  const px = size * BOX
  return { cols: Math.ceil(px / CHAR_W), rows: Math.ceil(px / LINE_H) }
}

/** The dotted trail a thrown plane leaves: dots per plane, and how long each lasts. */
const TRAIL = 16
const TRAIL_S = 0.9

/** How long a throw can last before the plane eases back into its glide. */
const THROW_S = 1.4

type Seed = { size: number; fx: number; fy: number; dir: 1 | -1; cruise: number; phase: number }

/** Fixed, not random: the server render and the client must agree. */
const LEFT: Seed[] = [{ size: 36, fx: 0.4, fy: 0.3, dir: 1, cruise: 22, phase: 0 }]
const RIGHT: Seed[] = [
  { size: 38, fx: 0.55, fy: 0.15, dir: -1, cruise: 24, phase: 1.3 },
  { size: 32, fx: 0.4, fy: 0.68, dir: 1, cruise: 19, phase: 3.4 },
]

function Lane({ side, seeds }: { side: 'left' | 'right'; seeds: Seed[] }) {
  const laneRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const lane = laneRef.current
    if (!lane) return
    const els = Array.from(lane.querySelectorAll<HTMLPreElement>('[data-plane]'))
    const dotsFor = (i: number) => Array.from(lane.querySelectorAll<HTMLSpanElement>(`[data-trail="${i}"]`))

    let W = lane.clientWidth
    let H = lane.clientHeight
    const ro = new ResizeObserver(() => {
      W = lane.clientWidth
      H = lane.clientHeight
    })
    ro.observe(lane)

    // one set of frames per plane size
    // Two sets per size. Rotating a side-on plane past vertical turns it upside
    // down, keel on top, so a plane heading left draws from a set mirrored
    // across its own axis: it stays keel-down, the way a turned plane does.
    const framesBySize = new Map<number, { right: string[]; left: string[] }>()
    const mirrored = (ctx: CanvasRenderingContext2D, size: number) => {
      ctx.scale(1, -1)
      drawPlane(ctx, size)
    }
    for (const s of seeds) {
      if (framesBySize.has(s.size)) continue
      const { cols, rows } = dims(s.size)
      const spec = { cols, rows, charW: CHAR_W, lineH: LINE_H, steps: STEPS }
      framesBySize.set(s.size, { right: buildFrames({ ...spec, draw: drawPlane }), left: buildFrames({ ...spec, draw: mirrored }) })
    }
    const planes = seeds.map((s, i) => ({
      ...s,
      el: els[i],
      sets: framesBySize.get(s.size)!,
      bw: dims(s.size).cols * CHAR_W,
      bh: dims(s.size).rows * LINE_H,
      shown: -1,
      dots: dotsFor(i),
      trail: [] as { x: number; y: number; age: number }[],
      sinceDot: 0,
      x: s.fx * W,
      y: s.fy * H,
      vx: s.dir * s.cruise,
      vy: 10,
      angle: s.dir > 0 ? 0.3 : Math.PI - 0.3,
      thrown: false,
      /** seconds since release; a throw is over by THROW_S */
      flying: 0,
      held: false,
      grab: [] as { x: number; y: number; t: number }[],
    }))
    const place = (p: (typeof planes)[number]) => {
      p.el.style.transform = `translate3d(${p.x - p.bw / 2}px, ${p.y - p.bh / 2}px, 0)`
      const left = Math.cos(p.angle) < 0
      const f = frameFor(p.angle, STEPS) + (left ? STEPS : 0)
      if (f !== p.shown) {
        p.shown = f
        p.el.textContent = (left ? p.sets.left : p.sets.right)[f % STEPS]
      }
    }
    planes.forEach(place)

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return () => ro.disconnect()

    // grab and throw, per plane
    const off: (() => void)[] = []
    for (const p of planes) {
      const down = (e: PointerEvent) => {
        p.held = true
        p.el.setPointerCapture(e.pointerId)
        p.grab.length = 0
        p.el.style.cursor = 'grabbing'
      }
      const move = (e: PointerEvent) => {
        if (!p.held) return
        const r = lane.getBoundingClientRect()
        p.x = e.clientX - r.left
        p.y = e.clientY - r.top
        p.grab.push({ x: p.x, y: p.y, t: performance.now() })
        if (p.grab.length > 6) p.grab.shift()
        place(p)
      }
      const up = () => {
        if (!p.held) return
        p.held = false
        p.el.style.cursor = 'grab'
        if (p.grab.length >= 2) {
          const a = p.grab[0]
          const b = p.grab[p.grab.length - 1]
          const dt = Math.max(0.016, (b.t - a.t) / 1000)
          p.vx = Math.max(-1600, Math.min(1600, (b.x - a.x) / dt))
          p.vy = Math.max(-1600, Math.min(1600, (b.y - a.y) / dt))
          p.thrown = true
          p.flying = 0
        }
      }
      p.el.addEventListener('pointerdown', down)
      p.el.addEventListener('pointermove', move)
      p.el.addEventListener('pointerup', up)
      p.el.addEventListener('pointercancel', up)
      off.push(() => {
        p.el.removeEventListener('pointerdown', down)
        p.el.removeEventListener('pointermove', move)
        p.el.removeEventListener('pointerup', up)
        p.el.removeEventListener('pointercancel', up)
      })
    }

    let raf = 0
    let last = performance.now()
    let t = 0
    const frame = (now: number) => {
      const dt = Math.min(0.033, (now - last) / 1000)
      last = now
      t += dt
      if (W > 0) {
        for (const p of planes) {
          if (p.held) continue
          if (p.thrown) {
            // drag, a little gravity, and lift that fades as it slows. Drag
            // and gravity balance near 90px/s, so a speed test alone never
            // ends the throw; it also ends after THROW_S, and the glide below
            // eases it back to cruising from wherever it is.
            p.flying += dt
            const speed = Math.hypot(p.vx, p.vy)
            const drag = Math.exp(-1.4 * dt)
            p.vx *= drag
            p.vy = p.vy * drag + (220 - Math.min(200, speed * 0.25)) * dt
            if (speed < 110 || p.flying > THROW_S) p.thrown = false
          } else {
            // the idle glide: across and down, bobbing
            const dir = p.vx >= 0 ? 1 : -1
            const k = Math.min(1, dt * 1.5)
            p.vx += (dir * p.cruise - p.vx) * k
            p.vy += (p.cruise * 0.5 + Math.sin(t * 1.3 + p.phase) * 16 - p.vy) * k
          }
          p.x += p.vx * dt
          p.y += p.vy * dt
          const m = p.bw / 2
          if (p.x < m) {
            p.x = m
            p.vx = Math.abs(p.vx) * (p.thrown ? 0.55 : 1)
          }
          if (p.x > W - m) {
            p.x = W - m
            p.vx = -Math.abs(p.vx) * (p.thrown ? 0.55 : 1)
          }
          if (p.y < m) {
            p.y = m
            p.vy = Math.abs(p.vy) * 0.5
          }
          if (p.y > H + p.size) p.y = -p.size
          // nose into the direction of travel, eased
          let da = Math.atan2(p.vy, p.vx) - p.angle
          while (da > Math.PI) da -= 2 * Math.PI
          while (da < -Math.PI) da += 2 * Math.PI
          p.angle += da * Math.min(1, dt * 8)
          // a thrown plane drops dots from its tail; they fade where they fell
          p.sinceDot += dt
          if (p.thrown && p.sinceDot > 0.035) {
            p.sinceDot = 0
            const back = p.bw * 0.34
            p.trail.push({ x: p.x - Math.cos(p.angle) * back, y: p.y - Math.sin(p.angle) * back, age: 0 })
            if (p.trail.length > TRAIL) p.trail.shift()
          }
          for (const d of p.trail) d.age += dt
          while (p.trail.length && p.trail[0].age > TRAIL_S) p.trail.shift()
          p.dots.forEach((el, k) => {
            const d = p.trail[k]
            if (!d) {
              el.style.opacity = '0'
              return
            }
            el.textContent = d.age < TRAIL_S * 0.35 ? ':' : '.'
            el.style.opacity = String(0.7 * (1 - d.age / TRAIL_S))
            el.style.transform = `translate3d(${d.x - CHAR_W / 2}px, ${d.y - LINE_H / 2}px, 0)`
          })
          place(p)
        }
      }
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      off.forEach((f) => f())
    }
  }, [seeds])

  return (
    <div
      ref={laneRef}
      aria-hidden
      className={`pointer-events-none fixed ${side === 'left' ? 'left-0' : 'right-0'} top-[var(--nav-h)] bottom-0 z-0 hidden w-[calc((100vw-1100px)/2)] overflow-hidden min-[1400px]:block`}
      style={{ overflowAnchor: 'none' }}
    >
      {seeds.map((s, i) => {
        const { cols, rows } = dims(s.size)
        return (
          <pre
            key={i}
            data-plane
            className="pointer-events-auto absolute left-0 top-0 m-0 touch-none select-none"
            style={{
              width: cols * CHAR_W,
              height: rows * LINE_H,
              cursor: 'grab',
              willChange: 'transform',
              overflowAnchor: 'none',
              fontFamily: FONTS.mono,
              fontSize: FONT_PX,
              lineHeight: `${LINE_H}px`,
              color: 'color-mix(in srgb, var(--color-ink) 55%, transparent)',
            }}
          />
        )
      })}
      {seeds.map((_, i) =>
        Array.from({ length: TRAIL }, (_, k) => (
          <span
            key={`${i}-${k}`}
            data-trail={i}
            className="absolute left-0 top-0"
            style={{
              opacity: 0,
              fontFamily: FONTS.mono,
              fontSize: FONT_PX,
              lineHeight: `${LINE_H}px`,
              color: 'color-mix(in srgb, var(--color-ink) 55%, transparent)',
              overflowAnchor: 'none',
            }}
          />
        )),
      )}
    </div>
  )
}

export default function PaperPlanes() {
  return (
    <>
      <Lane side="left" seeds={LEFT} />
      <Lane side="right" seeds={RIGHT} />
    </>
  )
}

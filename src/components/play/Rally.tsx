'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import { useThemeColors } from '@/lib/useThemeColors'
import { COLORS, FONTS, MOTION } from '@/styles/tokens'

/**
 * Keep the shuttle up. That is the whole game.
 *
 * The badminton section is the only one on /play with nothing in it — music has
 * recordings and a listening block, art has a contact sheet, photography has a
 * link out. This is that section's object, and it is one mechanic with one
 * number: click the shuttle, do not let it land, watch the count.
 *
 * ── the drag is the point ───────────────────────────────────────────────────
 * A shuttlecock does not arc like a ball. Its cork-and-feather shape gives it a
 * drag coefficient several times a shuttlecock-sized sphere's, so it reaches
 * terminal velocity almost immediately: it leaves the racket fast, decelerates
 * hard, and then falls almost vertically. That asymmetry — steep up, sharp
 * apex, near-vertical drop — is the thing that makes badminton look like
 * badminton, and simulating it is what stops this from being generic
 * keepy-uppy with a different sprite.
 *
 * So the integrator is `dv/dt = -g - k*v*|v|`, quadratic drag opposing motion
 * on both axes, with `k` tuned so terminal velocity arrives inside a second.
 * Linear drag would have produced a lazy parabola and felt like a balloon.
 *
 * ── fixed timestep ──────────────────────────────────────────────────────────
 * Physics runs on a fixed 1/120s accumulator rather than on the frame delta.
 * Quadratic drag is stiff enough that a variable step visibly changes the
 * trajectory between a 60Hz and a 120Hz display, and the preview browser
 * throttles rAF to a few callbacks a second — the same reason ReelHero does
 * this. Accumulated time is clamped so a backgrounded tab does not return and
 * integrate a thousand steps at once.
 *
 * ── it stops ────────────────────────────────────────────────────────────────
 * The loop runs only while a rally is live AND the canvas is on screen AND the
 * tab is in front. It never starts on its own: a game that begins animating
 * because someone scrolled past it is an advert. Reduced motion is respected by
 * not auto-starting either — but the game itself is not suppressed, because the
 * motion is the visitor's own doing and refusing to run it would just be a
 * broken toy.
 */

/**
 * Court units. The canvas maps these to pixels, so physics is resolution-free.
 *
 * Landscape, not portrait. A tall narrow court gave the shuttle almost nowhere
 * to travel sideways and made the page scroll past a column of mostly empty
 * air.
 */
const W = 160
const H = 96
const GRAVITY = 150
/** Quadratic drag. High: a shuttle sheds speed unlike anything else in sport. */
const DRAG = 0.011
const SHUTTLE_R = 3.2
/**
 * Upward impulse from a hit, and it is worth showing the arithmetic because
 * eyeballing it is what made the first version feel limp.
 *
 * Under quadratic drag the rise from an impulse is
 *   h = ln(1 + k·v₀²/g) / 2k
 * At the old 118 that came to ~27 units of a 140-unit court — a fifth of the
 * height, which reads as a tap rather than a hit. 185 against this court gives
 * ~57 of 96, so the shuttle climbs to about 60% and there is real hang time at
 * the apex to react in.
 */
const HIT_V = 185
/** Random sideways impulse per hit, ± half this. See `hit`. */
const LATERAL_KICK = 150
/**
 * Vertical impulse varies by ± this fraction. Height was the one thing a rally
 * could rely on, which meant the apex arrived on a metronome and the whole game
 * settled into a rhythm you could keep without looking. Varying it means every
 * hit has to be re-read.
 */
const HIT_V_JITTER = 0.22
/** Ceiling on horizontal speed, so a run of same-side kicks cannot compound. */
const MAX_VX = 95
const SUB = 1 / 120

interface Shuttle {
  x: number
  y: number
  vx: number
  vy: number
  /** Radians; the shuttle turns to face its own travel, cork first. */
  angle: number
}

const BEST_KEY = 'play:rally:best'

/**
 * The cursor becomes a racket over the court.
 *
 * Scoped to this element on purpose. A custom cursor across a whole site
 * replaces the one affordance every visitor already knows, costs a frame of
 * latency on the thing the hand is following, does nothing on touch, and
 * suppresses the state changes the OS cursor gives for free — the I-beam over
 * text, the resize arrows on an edge. Over a toy it is the opposite: it says
 * "this is a thing you play with" before anyone reads the caption.
 *
 * Encoded rather than a file so there is no second request, and the hotspot is
 * the middle of the racket face so the visitor aims with the strings.
 */
/*
 * Takes the ink colour rather than reading the token, because a data: URI is a
 * separate document: `stroke="var(--color-ink)"` resolves against nothing there
 * and the racket draws with no stroke at all.
 */
const racketCursor = (ink: string) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36">
<ellipse cx="13" cy="13" rx="9.5" ry="11" fill="none" stroke="${ink}" stroke-width="2"/>
<line x1="18.5" y1="21.5" x2="29" y2="33" stroke="${ink}" stroke-width="3" stroke-linecap="round"/>
</svg>`
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}") 13 13, pointer`
}

export default function Rally() {
  const theme = useThemeColors()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const shuttleRef = useRef<Shuttle | null>(null)
  const rafRef = useRef(0)
  const liveRef = useRef(false)
  const visibleRef = useRef(false)

  const [score, setScore] = useState(0)
  const [best, setBest] = useState(0)
  const [state, setState] = useState<'idle' | 'live' | 'over'>('idle')

  useEffect(() => {
    try {
      const v = window.localStorage.getItem(BEST_KEY)
      if (v) setBest(parseInt(v, 10) || 0)
    } catch {
      /* private mode, or storage disabled — a best score is not worth an error */
    }
  }, [])

  /** Court units → device pixels. */
  const scale = useCallback(() => {
    const c = canvasRef.current
    if (!c) return 0
    return c.width / W
  }, [])

  const draw = useCallback(() => {
    const c = canvasRef.current
    const ctx = c?.getContext('2d')
    if (!c || !ctx || !c.width) return
    const s = scale()

    ctx.clearRect(0, 0, c.width, c.height)

    // The net: one hairline, because the court is not the point.
    ctx.strokeStyle = theme.hairline
    ctx.lineWidth = Math.max(1, s * 0.25)
    ctx.beginPath()
    ctx.moveTo(0, H * s - ctx.lineWidth)
    ctx.lineTo(c.width, H * s - ctx.lineWidth)
    ctx.stroke()

    const sh = shuttleRef.current
    if (!sh) return

    ctx.save()
    ctx.translate(sh.x * s, sh.y * s)
    ctx.rotate(sh.angle)

    // Skirt: a trapezoid opening away from travel. Cork: a filled round.
    ctx.fillStyle = theme.hairline
    ctx.beginPath()
    ctx.moveTo(-SHUTTLE_R * 0.55 * s, 0)
    ctx.lineTo(SHUTTLE_R * 0.55 * s, 0)
    ctx.lineTo(SHUTTLE_R * 1.15 * s, SHUTTLE_R * 2.2 * s)
    ctx.lineTo(-SHUTTLE_R * 1.15 * s, SHUTTLE_R * 2.2 * s)
    ctx.closePath()
    ctx.fill()

    ctx.fillStyle = theme.ink
    ctx.beginPath()
    ctx.arc(0, 0, SHUTTLE_R * 0.62 * s, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }, [scale, theme.hairline, theme.ink])

  const step = useCallback((h: number) => {
    const sh = shuttleRef.current
    if (!sh) return
    const speed = Math.hypot(sh.vx, sh.vy)
    // Quadratic drag opposes motion on each axis independently.
    sh.vx += -DRAG * sh.vx * speed * h
    sh.vy += (GRAVITY - DRAG * sh.vy * speed) * h
    sh.x += sh.vx * h
    sh.y += sh.vy * h

    // Walls are elastic-ish; the shuttle loses energy on contact like it does
    // off a racket frame.
    if (sh.x < SHUTTLE_R) {
      sh.x = SHUTTLE_R
      sh.vx = Math.abs(sh.vx) * 0.6
    } else if (sh.x > W - SHUTTLE_R) {
      sh.x = W - SHUTTLE_R
      sh.vx = -Math.abs(sh.vx) * 0.6
    }

    // Cork leads. Falling straight down means pointing straight down.
    if (speed > 0.5) sh.angle = Math.atan2(sh.vy, sh.vx) - Math.PI / 2
  }, [])

  const end = useCallback(() => {
    liveRef.current = false
    cancelAnimationFrame(rafRef.current)
    setState('over')
    setScore((s) => {
      setBest((b) => {
        const next = Math.max(b, s)
        try {
          window.localStorage.setItem(BEST_KEY, String(next))
        } catch {
          /* nothing worth reporting */
        }
        return next
      })
      return s
    })
  }, [])

  const loop = useCallback(
    (last: number) => {
      const tick = (now: number) => {
        if (!liveRef.current) return
        if (!visibleRef.current) {
          // Off screen or backgrounded: freeze rather than integrating into a
          // canvas nobody is watching, and resume from the same frame.
          rafRef.current = requestAnimationFrame(tick)
          last = now
          return
        }
        let acc = Math.min(now - last, 250) / 1000
        last = now
        while (acc > 0) {
          const h = Math.min(SUB, acc)
          step(h)
          acc -= h
        }
        draw()
        const sh = shuttleRef.current
        if (sh && sh.y > H + SHUTTLE_R * 3) {
          end()
          return
        }
        rafRef.current = requestAnimationFrame(tick)
      }
      rafRef.current = requestAnimationFrame(tick)
    },
    [draw, end, step],
  )

  const serve = useCallback(() => {
    shuttleRef.current = {
      // Serve from a random point across the middle third rather than dead
      // centre, so the first move is already a move.
      x: W * (0.2 + Math.random() * 0.6),
      y: H * (0.1 + Math.random() * 0.2),
      vx: (Math.random() - 0.5) * 90,
      vy: 0,
      angle: Math.PI,
    }
    setScore(0)
    setState('live')
    liveRef.current = true
    draw()
    loop(performance.now())
  }, [draw, loop])

  const hit = useCallback(
    (cx: number, cy: number) => {
      if (!liveRef.current) {
        serve()
        return
      }
      const sh = shuttleRef.current
      if (!sh) return
      // Only a hit near the shuttle counts. Anywhere-clicks would make it
      // impossible to lose and therefore pointless to play.
      if (Math.hypot(sh.x - cx, sh.y - cy) > SHUTTLE_R * 5) return
      sh.vy = -HIT_V * (1 + (Math.random() - 0.5) * 2 * HIT_V_JITTER)

      /**
       * Sideways travel comes from two places, and it used to come from only
       * one: where you struck it relative to centre. That made every rally a
       * vertical column — the shuttle went up, came down the same line, and the
       * only thing being tested was timing.
       *
       * A real shuttle leaves the strings at whatever angle the face happened to
       * be at, so a random lateral kick is both the more honest model and the
       * thing that makes this a game about moving rather than clicking. It is
       * added to the aim rather than replacing it, so a deliberate off-centre
       * hit still steers — it just no longer fully determines where the shuttle
       * goes.
       */
      sh.vx += (sh.x - cx) * 3.2 + (Math.random() - 0.5) * LATERAL_KICK
      sh.vx = Math.max(-MAX_VX, Math.min(MAX_VX, sh.vx))
      setScore((s) => s + 1)
    },
    [serve],
  )

  const onPointer = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      const c = canvasRef.current
      if (!c) return
      const r = c.getBoundingClientRect()
      if (!r.width) return
      hit(((e.clientX - r.left) / r.width) * W, ((e.clientY - r.top) / r.height) * H)
    },
    [hit],
  )

  // Size the backing store to the box, and to the device pixel ratio.
  useEffect(() => {
    const c = canvasRef.current
    if (!c) return
    const measure = () => {
      const r = c.getBoundingClientRect()
      // A canvas measured at zero silently falls back to 300x150 and every
      // draw after it is wrong. Bail and let the next observation retry.
      if (!r.width || !r.height) return
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const w = Math.round(r.width * dpr)
      if (w === c.width) return
      c.width = w
      c.height = Math.round(w * (H / W))
      draw()
    }
    const ro = new ResizeObserver(measure)
    ro.observe(c)
    measure()
    return () => ro.disconnect()
  }, [draw])

  // On screen AND in front. Both, for the same reason the /projects plate cycle
  // needed both: an IntersectionObserver alone keeps a loop alive in a hidden
  // tab.
  useEffect(() => {
    const c = canvasRef.current
    if (!c) return
    let onScreen = false
    const settle = () => {
      visibleRef.current = onScreen && !document.hidden
    }
    const io = new IntersectionObserver(([e]) => {
      onScreen = e.isIntersecting
      settle()
    })
    io.observe(c)
    document.addEventListener('visibilitychange', settle)
    return () => {
      io.disconnect()
      document.removeEventListener('visibilitychange', settle)
      cancelAnimationFrame(rafRef.current)
      liveRef.current = false
    }
  }, [])

  const UI = `${MOTION.ui} ${MOTION.ease}`

  return (
    <div className="mt-8 max-w-[560px]">
      <canvas
        ref={canvasRef}
        onPointerDown={onPointer}
        className="block w-full touch-none select-none"
        style={{ aspectRatio: `${W} / ${H}`, cursor: racketCursor(theme.ink) }}
        aria-label="Keep the shuttle up"
        role="img"
      />

      <div className="mt-4 flex items-baseline justify-between">
        <span
          className="text-[12px] tracking-[0.14em]"
          style={{
            fontFamily: FONTS.mono,
            color: state === 'live' ? COLORS.accent : COLORS.muted,
            transition: `color ${UI}`,
          }}
        >
          {state === 'idle' && 'click the shuttle to serve'}
          {state === 'live' && `rally ${score}`}
          {state === 'over' && `dropped at ${score} · click to serve`}
        </span>
        {best > 0 && (
          <span
            className="text-[12px] tracking-[0.14em]"
            style={{ fontFamily: FONTS.mono, color: COLORS.muted }}
          >
            best {best}
          </span>
        )}
      </div>
    </div>
  )
}

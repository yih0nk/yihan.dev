'use client'

import { useEffect, useRef, useState } from 'react'

import { DOG } from '@/components/decor/art/dog'
import { useThemeColors } from '@/lib/useThemeColors'
import { COLORS_DARK, FONTS, MOTION } from '@/styles/tokens'

/**
 * The footer retriever, along for the ride on /play. It sits in the left
 * margin and picks up a prop for the section you're reading: headphones for
 * music, a pencil for art, a camera for photography, a racket for badminton.
 * When the section changes it hops and the old prop dissolves into the new
 * one, cell by cell.
 *
 * The props are drawn as shapes and rasterised into characters over the dog,
 * like asciiSprite. They're objects, not tone, so they're solid ink in both
 * themes. The dog itself uses the footer dog's dark-mode treatment: its
 * interior tones invert (pale fur bright, shadow dim, floor at `A`), or it
 * reads as a photo negative.
 *
 * It thinks out loud on its own: every so often a thought bubble comes up over
 * its head for a few seconds and then goes again. No hover needed.
 *
 * You can pick it up and drag it anywhere on the page; "put back" returns it
 * to the margin. A dragged dog stays where it was dropped, in viewport
 * coordinates, so it rides along as you scroll, and it comes forward over the
 * text while it is out of the margin.
 *
 * Shown only at 1500px and wider, where the margin has room for it.
 */

const RAMP = ' .,:;irsXA253hMHGS#9B&@'
const PROP_RAMP = ' .:-=+*#%@'
const FONT_PX = 6
const CHAR_W = FONT_PX * 0.6
const LINE_H = 5
/** Room around the dog for the props: rows above, columns to the right. */
const PAD_T = 7
const PAD_R = 15

const DOG_ROWS = DOG.split('\n')
const DOG_COLS = Math.max(...DOG_ROWS.map((r) => r.length))
const ROWS = DOG_ROWS.length + PAD_T
const COLS = DOG_COLS + PAD_R
/** The dog's own tone per padded cell (0 = blank). */
const BASE: number[] = Array.from({ length: ROWS * COLS }, (_, i) => {
  const r = Math.floor(i / COLS) - PAD_T
  const c = i % COLS
  const ch = r >= 0 ? DOG_ROWS[r]?.[c] ?? ' ' : ' '
  return Math.max(0, RAMP.indexOf(ch))
})

const TOP = RAMP.length - 1
const DARK_FLOOR = RAMP.indexOf('A')
const dogInk = (d: number, dark: boolean) => {
  if (d === 0) return 'transparent'
  const t = (d / TOP) ** 1.3
  return `color-mix(in srgb, var(--color-ink) ${Math.round(dark ? 26 + 52 * t : 22 + 74 * t)}%, transparent)`
}

// ── props, drawn in px over the padded grid (x = column, y = dog row) ──────
const px = (c: number) => c * CHAR_W
const py = (r: number) => (r + PAD_T) * LINE_H
type Draw = (g: CanvasRenderingContext2D) => void

const PROPS: Record<string, Draw> = {
  none: () => {},
  // The cup sits on the ear, at the head's back edge, clear of the eye at
  // row 9: centred on the head it read as a blindfold. The band arcs over the
  // top of the skull so the pair reads as headphones, not a patch.
  headphones: (g) => {
    g.lineCap = 'round'
    g.lineWidth = 6
    g.beginPath()
    g.moveTo(px(14.2), py(6.5))
    g.bezierCurveTo(px(13), py(-5), px(33), py(-6), px(34.5), py(3))
    g.stroke()
    // near cup: a ring, so the fur shows through and it reads as a cup
    g.lineWidth = 4.5
    g.beginPath()
    g.ellipse(px(14.4), py(8.6), 2.3 * CHAR_W, 2.5 * LINE_H, 0, 0, Math.PI * 2)
    g.stroke()
    // far cup, just peeking past the other side of the head
    g.lineWidth = 4
    g.beginPath()
    g.ellipse(px(35), py(4.2), 1.3 * CHAR_W, 1.7 * LINE_H, 0, 0, Math.PI * 2)
    g.stroke()
  },
  // Held in the mouth and angled up and out, so the barrel clears the snout
  // and the sharpened end is against the lips: lying flat past the face it
  // read as a stray bar.
  pencil: (g) => {
    g.save()
    g.translate(px(35.5), py(12))
    g.rotate(-0.62)
    const h = 2 * LINE_H
    // barrel
    g.fillRect(0, -h / 2, 15 * CHAR_W, h)
    // ferrule, then the eraser, each a step lighter
    g.globalAlpha = 0.55
    g.fillRect(15 * CHAR_W, -h / 2, 1.6 * CHAR_W, h)
    g.globalAlpha = 0.3
    g.fillRect(16.6 * CHAR_W, -h / 2, 3 * CHAR_W, h)
    // the sharpened cone, and the lead at its point
    g.globalAlpha = 0.5
    g.beginPath()
    g.moveTo(0, -h / 2)
    g.lineTo(-5.5 * CHAR_W, 0)
    g.lineTo(0, h / 2)
    g.closePath()
    g.fill()
    g.globalAlpha = 1
    g.beginPath()
    g.moveTo(-3.6 * CHAR_W, -h * 0.26)
    g.lineTo(-5.5 * CHAR_W, 0)
    g.lineTo(-3.6 * CHAR_W, h * 0.26)
    g.closePath()
    g.fill()
    g.restore()
  },
  // held up to the face: a rounded body, a clear lens ring, viewfinder, button
  camera: (g) => {
    g.save()
    g.translate(px(41), py(10.5))
    const w = 13 * CHAR_W
    const h = 7.5 * LINE_H
    g.beginPath()
    g.roundRect(-w / 2, -h / 2, w, h, 5)
    g.fill()
    g.fillRect(-w / 2 + 1.5 * CHAR_W, -h / 2 - 1.4 * LINE_H, 3.2 * CHAR_W, 1.6 * LINE_H)
    g.fillRect(w / 2 - 3 * CHAR_W, -h / 2 - 0.9 * LINE_H, 1.8 * CHAR_W, 1 * LINE_H)
    g.globalCompositeOperation = 'destination-out'
    g.beginPath()
    g.arc(0.8 * CHAR_W, 0.2 * LINE_H, 2.7 * LINE_H, 0, Math.PI * 2)
    g.fill()
    g.globalCompositeOperation = 'source-over'
    g.globalAlpha = 0.45
    g.beginPath()
    g.arc(0.8 * CHAR_W, 0.2 * LINE_H, 1.6 * LINE_H, 0, Math.PI * 2)
    g.fill()
    g.globalAlpha = 1
    g.beginPath()
    g.arc(0.8 * CHAR_W, 0.2 * LINE_H, 0.6 * LINE_H, 0, Math.PI * 2)
    g.fill()
    g.restore()
  },
  // leaning in front, head up and clear of the dog, strings lighter than frame
  racket: (g) => {
    g.save()
    g.translate(px(43), py(5))
    g.rotate(0.32)
    const rx = 4.4 * CHAR_W
    const ry = 5.6 * LINE_H
    g.lineWidth = 3
    g.beginPath()
    g.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2)
    g.stroke()
    g.globalAlpha = 0.3
    g.lineWidth = 1
    for (let k = -3; k <= 3; k++) {
      g.beginPath()
      g.moveTo(k * rx * 0.28, -ry)
      g.lineTo(k * rx * 0.28, ry)
      g.stroke()
      g.beginPath()
      g.moveTo(-rx, k * ry * 0.28)
      g.lineTo(rx, k * ry * 0.28)
      g.stroke()
    }
    g.globalAlpha = 1
    g.lineWidth = 2.6
    g.beginPath()
    g.moveTo(0, ry)
    g.lineTo(0, ry + 8 * LINE_H)
    g.stroke()
    g.lineWidth = 4
    g.beginPath()
    g.moveTo(0, ry + 5 * LINE_H)
    g.lineTo(0, ry + 9 * LINE_H)
    g.stroke()
    g.restore()
  },
}
/**
 * What it thinks about. Shown one at a time, in order but starting anywhere,
 * so two visits don't open on the same line.
 */
const THOUGHTS = [
  'i wonder what\u2019s for dinner?',
  'oh no this guy is falling into some rabbit hole again.',
  'yihan really needs to study for the algorithms class...',
  'wow life is beautiful :p',
  '\u266A \u201Ci want it that way\u201D \u266A',
]
/** Seconds between thoughts, and how long one stays up. */
const GAP = [9, 16]
const HOLD = 4.5

const PROP_FOR: Record<string, string> = {
  music: 'headphones',
  art: 'pencil',
  photography: 'camera',
  badminton: 'racket',
}

/** Coverage of each padded cell by a prop, 4x4 supersampled, 0..1. */
function rasterise(draw: Draw): Float32Array {
  const SS = 4
  const cv = document.createElement('canvas')
  cv.width = COLS * SS
  cv.height = ROWS * SS
  const g = cv.getContext('2d', { willReadFrequently: true })!
  g.scale(SS / CHAR_W, SS / LINE_H)
  g.fillStyle = g.strokeStyle = '#000'
  draw(g)
  const d = g.getImageData(0, 0, cv.width, cv.height).data
  const out = new Float32Array(ROWS * COLS)
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++) {
      let s = 0
      for (let y = 0; y < SS; y++) for (let x = 0; x < SS; x++) s += d[((r * SS + y) * cv.width + c * SS + x) * 4 + 3]
      out[r * COLS + c] = s / (SS * SS * 255)
    }
  return out
}
const propGlyph = (cover: number) => PROP_RAMP[Math.min(PROP_RAMP.length - 1, 1 + Math.floor(cover * (PROP_RAMP.length - 1)))]

export default function TalentedDog() {
  const wrapRef = useRef<HTMLDivElement | null>(null)
  const artRef = useRef<HTMLPreElement | null>(null)
  /** Set once the dog has been picked up: it then stays where it was dropped. */
  const draggedRef = useRef(false)
  const [dragged, setDragged] = useState(false)
  /** The thought showing right now, or null between thoughts. */
  const [thought, setThought] = useState<string | null>(null)
  const [section, setSection] = useState('none')
  const dark = useThemeColors().bg === COLORS_DARK.bg

  // which section is under the middle of the viewport
  useEffect(() => {
    const ids = Object.keys(PROP_FOR)
    const pick = () => {
      let cur = 'none'
      for (const id of ids) {
        const el = document.getElementById(id)
        if (el && el.getBoundingClientRect().top < window.innerHeight * 0.55) cur = id
      }
      setSection(cur)
    }
    pick()
    window.addEventListener('scroll', pick, { passive: true })
    return () => window.removeEventListener('scroll', pick)
  }, [])

  // placement: pinned mid-viewport, riding beside the active section's heading,
  // or tucked in the bottom corner
  useEffect(() => {
    const wrap = wrapRef.current
    if (!wrap) return
    const place = () => {
      if (draggedRef.current) return
      wrap.style.setProperty('--y', `${(window.innerHeight - wrap.offsetHeight) / 2}px`)
    }
    place()
    window.addEventListener('scroll', place, { passive: true })
    window.addEventListener('resize', place)
    return () => {
      window.removeEventListener('scroll', place)
      window.removeEventListener('resize', place)
    }
  }, [])

  // drawing: the dog, the prop over it, the dissolve between props, the fur
  const propsRef = useRef<Record<string, Float32Array> | null>(null)
  const shownProp = useRef('none')
  useEffect(() => {
    const art = artRef.current
    if (!art) return
    const cells = Array.from(art.querySelectorAll<HTMLSpanElement>('span[data-c]'))
    if (!propsRef.current) {
      propsRef.current = Object.fromEntries(Object.entries(PROPS).map(([k, d]) => [k, rasterise(d)]))
    }
    const P = propsRef.current
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const inked = (i: number) => BASE[i] > 0
    const interior = new Set<number>()
    BASE.forEach((d, i) => {
      const c = i % COLS
      if (d && inked(i - COLS) && inked(i + COLS) && c > 0 && inked(i - 1) && c < COLS - 1 && inked(i + 1)) interior.add(i)
    })
    const dogTone = (i: number) => (dark && interior.has(i) ? Math.max(DARK_FLOOR, TOP + 1 - BASE[i]) : BASE[i])

    const from = P[shownProp.current] ?? P.none
    const to = P[PROP_FOR[section] ?? 'none']
    shownProp.current = PROP_FOR[section] ?? 'none'
    // each cell flips from the old prop to the new one at its own moment
    const flipAt = new Float32Array(ROWS * COLS).map(() => Math.random() * 420)
    const start = performance.now()

    // A blank one-cell ring around a prop wherever it sits on the dog, so the
    // prop reads as an object in front of the fur instead of blending into it.
    const ringOf = (P: Float32Array) => {
      const ring = new Uint8Array(ROWS * COLS)
      for (let i = 0; i < P.length; i++) {
        if (P[i] > 0.1) continue
        const r = Math.floor(i / COLS)
        const c = i % COLS
        for (let dr = -1; dr <= 1 && !ring[i]; dr++)
          for (let dc = -1; dc <= 1; dc++) {
            const rr = r + dr
            const cc = c + dc
            if (rr >= 0 && rr < ROWS && cc >= 0 && cc < COLS && P[rr * COLS + cc] > 0.1) {
              ring[i] = 1
              break
            }
          }
      }
      return ring
    }
    const fromRing = ringOf(from)
    const toRing = ringOf(to)

    // The grid keeps blank rows above the drawing for the props, so a bubble
    // hung off the box's top floated 35 to 55px above the dog depending on the
    // prop. Park it just above whatever the topmost inked cell is now.
    let firstRow = ROWS
    for (let i = 0; i < ROWS * COLS; i++) {
      if (to[i] > 0.1 || BASE[i] > 0) {
        firstRow = Math.floor(i / COLS)
        break
      }
    }
    wrapRef.current?.style.setProperty('--head', `${Math.max(0, firstRow * LINE_H - 6)}px`)

    const paint = (now: number) => {
      const t = still ? Infinity : now - start
      const wave = (now / 1000) * 2.6
      for (let i = 0; i < cells.length; i++) {
        const flipped = t >= flipAt[i]
        const cover = (flipped ? to : from)[i]
        const el = cells[i]
        if (cover > 0.1) {
          el.textContent = propGlyph(cover)
          el.style.color = 'color-mix(in srgb, var(--color-ink) 92%, transparent)'
          el.style.fontWeight = '700'
          continue
        }
        el.style.fontWeight = ''
        if ((flipped ? toRing : fromRing)[i]) {
          el.textContent = ' '
          continue
        }
        let d = dogTone(i)
        if (!still && interior.has(i) && d) {
          const r = Math.floor(i / COLS)
          const c = i % COLS
          const w = Math.sin(0.55 * (r + c * 0.6) - wave)
          if (w > 0.7) d = Math.min(TOP, d + 2)
        }
        el.textContent = RAMP[d]
        el.style.color = dogInk(d, dark)
      }
    }

    let raf = 0
    let last = 0
    const loop = (now: number) => {
      if (now - last > 70) {
        last = now
        paint(now)
      }
      raf = requestAnimationFrame(loop)
    }
    if (still) paint(performance.now())
    else raf = requestAnimationFrame(loop)

    // a small hop when the prop changes
    const wrap = wrapRef.current
    if (wrap && !still && from !== to) {
      wrap.animate(
        [{ translate: '0 0' }, { translate: '0 -14px', offset: 0.4 }, { translate: '0 0' }],
        { duration: 520, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' },
      )
    }
    return () => cancelAnimationFrame(raf)
  }, [section, dark])

  // thinks out loud now and then
  useEffect(() => {
    let i = Math.floor(Math.random() * THOUGHTS.length)
    let timer: ReturnType<typeof setTimeout>
    const hide = () => {
      setThought(null)
      timer = setTimeout(show, (GAP[0] + Math.random() * (GAP[1] - GAP[0])) * 1000)
    }
    const show = () => {
      setThought(THOUGHTS[i % THOUGHTS.length])
      i += 1
      timer = setTimeout(hide, HOLD * 1000)
    }
    timer = setTimeout(show, 2500)
    return () => clearTimeout(timer)
  }, [])

  // pick it up and put it anywhere
  useEffect(() => {
    const wrap = wrapRef.current
    const art = artRef.current
    if (!wrap || !art) return
    let id: number | null = null
    let gx = 0
    let gy = 0
    const down = (e: PointerEvent) => {
      // Pinned, the wrapper is as wide as the margin and the drawing is
      // centred in it; dragging makes the wrapper shrink to the drawing. Pin
      // the wrapper to where the DRAWING is first, or the dog jumps left by
      // half the leftover margin on the first grab.
      const art0 = art.getBoundingClientRect()
      wrap.style.transition = 'none'
      wrap.style.left = `${art0.left}px`
      wrap.style.setProperty('--y', `${art0.top}px`)
      gx = e.clientX - art0.left
      gy = e.clientY - art0.top
      id = e.pointerId
      art.setPointerCapture(e.pointerId)
      art.style.cursor = 'grabbing'
      draggedRef.current = true
      setDragged(true)
    }
    const move = (e: PointerEvent) => {
      if (id === null) return
      const h = wrap.offsetHeight
      const x = Math.max(8, Math.min(window.innerWidth - art.offsetWidth - 8, e.clientX - gx))
      const y = Math.max(8, Math.min(window.innerHeight - h - 8, e.clientY - gy))
      wrap.style.left = `${x}px`
      wrap.style.setProperty('--y', `${y}px`)
    }
    const up = () => {
      if (id === null) return
      id = null
      art.style.cursor = 'grab'
      wrap.style.transition = ''
    }
    art.addEventListener('pointerdown', down)
    art.addEventListener('pointermove', move)
    art.addEventListener('pointerup', up)
    art.addEventListener('pointercancel', up)
    return () => {
      art.removeEventListener('pointerdown', down)
      art.removeEventListener('pointermove', move)
      art.removeEventListener('pointerup', up)
      art.removeEventListener('pointercancel', up)
    }
  }, [])

  const sendHome = () => {
    const wrap = wrapRef.current
    if (!wrap) return
    draggedRef.current = false
    setDragged(false)
    wrap.style.left = ''
    window.dispatchEvent(new Event('scroll'))
  }

  return (
    <div
      ref={wrapRef}
      className={`pointer-events-none fixed top-0 hidden min-[1500px]:block ${
        dragged ? 'z-40' : `left-0 ${thought ? 'z-40' : 'z-0'}`
      }`}
      style={{
        overflowAnchor: 'none',
        width: dragged ? 'max-content' : 'calc((100vw - 1100px) / 2)',
        transform: 'translateY(var(--y, 40vh))',
      }}
    >
      {/* One box the width of the drawing: the bubble hangs off ITS left edge,
          so in the margin the bubble starts where the dog starts instead of at
          the screen's edge. */}
      <div className="relative mx-auto w-max">
        {/* the thought bubble: the small circle first, then the bubble */}
        <div
          aria-hidden
          // opens rightwards from the dog's left edge: centred, the longer
          // thoughts ran off the left edge of the screen
          style={{ transform: 'translateY(var(--head, 0px))' }}
        className="pointer-events-none absolute bottom-full left-0 z-10 mb-1 flex flex-col items-start"
        >
          <p
            // rises and fades, but never scales: a scaled-up element is rasterised
            // at its small size and stretched, so the text came in blurry
            className={`whitespace-nowrap rounded-full px-3 py-1.5 text-[12px] ${
              thought ? 'opacity-100' : 'opacity-0 motion-safe:translate-y-1'
            }`}
            style={{
              transitionProperty: 'opacity, translate, scale',
              transitionDuration: '420ms',
              transitionTimingFunction: MOTION.ease,
              transitionDelay: thought ? '140ms' : '0ms',
              fontFamily: FONTS.body,
              color: 'var(--color-ink)',
              background: 'var(--color-bg)',
              border: '1px solid var(--color-hairline)',
            }}
          >
            {thought ?? ''}
          </p>
          <span
            className={`ml-8 mt-1 block h-[6px] w-[6px] rounded-full ${thought ? 'opacity-100' : 'opacity-0 motion-safe:translate-y-1 motion-safe:scale-90'}`}
            style={{
              transitionProperty: 'opacity, translate, scale',
              transitionDuration: '420ms',
              transitionTimingFunction: MOTION.ease,
              transitionDelay: thought ? '70ms' : '0ms',
              border: '1px solid var(--color-hairline)',
              background: 'var(--color-bg)',
            }}
          />
          <span
            className={`ml-6 mt-0.5 block h-[4px] w-[4px] rounded-full ${thought ? 'opacity-100' : 'opacity-0 motion-safe:translate-y-1 motion-safe:scale-90'}`}
            style={{
              transitionProperty: 'opacity, translate, scale',
              transitionDuration: '420ms',
              transitionTimingFunction: MOTION.ease,
              border: '1px solid var(--color-hairline)',
              background: 'var(--color-bg)',
            }}
          />
        </div>
        <pre
          ref={artRef}
          aria-hidden
          className="pointer-events-auto m-0 mx-auto touch-none select-none"
          style={{
            cursor: 'grab',
            overflowAnchor: 'none',
            width: COLS * CHAR_W,
            fontFamily: FONTS.mono,
            fontSize: FONT_PX,
            lineHeight: `${LINE_H}px`,
          }}
        >
          {Array.from({ length: ROWS }, (_, r) => (
            <span key={r}>
              {Array.from({ length: COLS }, (_, c) => {
                const d = BASE[r * COLS + c]
                return (
                  <span key={c} data-c style={{ color: dogInk(d, false) }}>
                    {RAMP[d]}
                  </span>
                )
              })}
              {r < ROWS - 1 ? '\n' : null}
            </span>
          ))}
        </pre>
        {dragged ? (
          <button
            type="button"
            onClick={sendHome}
            className="pointer-events-auto mx-auto mt-1 block text-[11px] tracking-[0.08em] underline-offset-4 hover:underline"
            style={{ fontFamily: FONTS.mono, color: 'var(--color-muted)' }}
          >
            put back
          </button>
        ) : null}
      </div>
    </div>
  )
}

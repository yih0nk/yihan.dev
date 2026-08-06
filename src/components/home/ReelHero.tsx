'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'

import { COLORS } from '@/styles/tokens'
import { REEL_SETTLED } from './reelEvent'

/**
 * The hero: a reel that resolves — once — into the name.
 *
 * A 35mm filmstrip runs horizontally through the middle of the viewport. Five
 * frames, five places. The visitor scrubs by dragging, scrolling or with the
 * arrow keys; the strip carries inertia and settles onto the nearest stop.
 * Blank leader sits past both ends so the reel reads as continuous stock rather
 * than a carousel of cards. There is no wordmark above it — the strip *is* the
 * hero until it resolves.
 *
 * THE PAYOFF: the stops are not only the five frames. Scrubbing past the last
 * frame drives a sixth stop — `NAME_POS` — and the travel between them is a
 * dissolve. Frames empty out first, then the film base and its sprockets, while
 * "yihan hong" condenses in ASCII out of the grain that is left, with a quiet
 * caption underneath it.
 *
 * ONE WAY. Once the dissolve completes the component `settle()`s: position is
 * pinned at `NAME_POS`, every input handler early-returns, the canvas drops to
 * `pointer-events: none`, and the draw loop freezes on a final static frame.
 * Scrolling back up does not bring the film back — the reel is a title
 * sequence, and title sequences do not rewind. A page load starts it over.
 *
 * Non-obvious techniques:
 * - Physics runs on a fixed 1/120s substep accumulator, decoupled from rAF. The
 *   preview browser throttles rAF to ~5fps; integrating a clamped 250ms of
 *   substeps per callback keeps inertia and snap identical at 5fps and 60fps.
 *   The idle timer deliberately does NOT ride that accumulator — see `idleFrom`.
 * - Snap engages only as speed drops (`engage`), so a fling coasts a couple of
 *   frames on friction before the spring takes over — flicking a reel, not
 *   paging a carousel. The name stop sits 1.25 frames past the last frame, so
 *   its snap midpoint is at 4.6: a nudge springs back, a scrub commits.
 * - The ASCII is a coverage mask, not a font effect. The name is rasterised once
 *   to an offscreen buffer and sampled per cell, so letterform edges arrive
 *   anti-aliased instead of blocky. The raster is *dilated* with a stroke before
 *   sampling: a display serif's stems are ~8% of the em, barely one cell wide,
 *   and sampled straight the name comes out as a dotted skeleton. Cells are
 *   0.6:1 — the monospace advance ratio — so glyphs tile edge to edge and the
 *   mark reads as solid ink rather than a dot grid.
 * - CONTRAST IS THE POINT. Inside the letterform: near-black at full opacity,
 *   dense end of the ramp. Outside: a whisper capped at 0.055 alpha that falls
 *   off toward every edge. The name has to read from across the room; the field
 *   is texture, not content.
 * - Photos, when present, are converted once to a duotone between page and ink
 *   through a 256-entry LUT, so five differently-graded shots read as one roll
 *   and the per-frame cost stays a single `drawImage`. Missing files are not an
 *   error state: `onerror` leaves the slot null and the typographic frame — which
 *   is a finished design in its own right — stands in.
 * - The churn field is separable: per-column / per-row / per-diagonal tables are
 *   rebuilt once per frame, so the inner loop over a few thousand cells is
 *   trig-free.
 * - The strip measures the DOM chrome and centres itself in the band above it,
 *   re-running once the webfont settles. Fixed viewport fractions only compose
 *   at one aspect ratio; a measured band composes at all of them.
 */

/**
 * A frame is now nothing but its photograph. It used to carry a `title` and a
 * `caption` — place names, set large in the display face across the middle of
 * the picture — and when the frames went photo-first those fields collapsed to
 * the frame number, which the corner already prints. The big centred number was
 * the same value drawn twice, sitting on top of the photograph both times.
 */
const FRAMES: readonly string[] = [
  '/images/reel/01.jpg',
  '/images/reel/02.jpg',
  '/images/reel/03.jpg',
  '/images/reel/04.jpg',
  '/images/reel/05.jpg',
]

const NAME = 'yihan hong'
const TAGLINE = 'engineer, and a few other things.'
const RAMP = ' .:-=+*#%@' // index 0..9, sparse -> dense
const MONO = 'ui-monospace, "Source Code Pro", "JetBrains Mono", Menlo, monospace'

const LAST = FRAMES.length - 1
/** Frames of travel past the last frame that the dissolve takes. */
const RESOLVE = 1.25
const NAME_POS = LAST + RESOLVE
const STOPS = [...FRAMES.map((_, i) => i), NAME_POS]
// `pad2` is declared below and would still be in its temporal dead zone here.
const STOP_LABELS = [...FRAMES.map((_, i) => `0${i + 1}`), 'the name']

const IDLE_TO_NAME = 6 // seconds of stillness before the reel resolves itself
const MAX_CELLS = 14000
const MASK_MAX_W = 1600 // cap the offscreen raster; it is only a coverage mask
const PHOTO_MAX = 1400 // cap the duotone buffer

// One fixed look. No palette prop, no theme switch.
const BG = COLORS.bg
const BG_RGB = '247,248,249' // the same colour as COLORS.bg, pre-split for rgba()
const INK = COLORS.ink
const MUTED = COLORS.muted
const HAIRLINE = COLORS.hairline
const ACCENT = COLORS.accent
const BASE = '#161b21' // film base
const BASE_EDGE = '#0c1015'
const SLUG = '#f2f4f6' // unexposed frame interior

const INK_RGB: [number, number, number] = [20, 22, 26]
const PAGE_RGB: [number, number, number] = [247, 248, 249]

const pad2 = (n: number) => (n < 10 ? `0${n}` : String(n))
const clamp01 = (n: number) => (n < 0 ? 0 : n > 1 ? 1 : n)
const ease = (n: number) => n * n * (3 - 2 * n)

export default function ReelHero({ font }: { font: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const chromeRef = useRef<HTMLDivElement>(null)
  const jumpRef = useRef<(i: number) => void>(() => {})
  const [active, setActive] = useState(0)
  const [touched, setTouched] = useState(false)
  const [settled, setSettled] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const reduced =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    let disposed = false
    let raf = 0 // draw loop
    let rafBuild = 0 // resize retry — deliberately a separate handle
    let maskToken = 0

    let W = 0
    let H = 0

    // --- strip geometry (device px), recomputed on resize --------------------
    let fw = 0 // frame width
    let fh = 0 // frame height
    let perfH = 0 // sprocket band height
    let laneH = 0 // edge-print lane height
    let stripH = 0
    let stripTop = 0
    let stride = 0 // frame pitch
    let bandCy = 0 // vertical centre of the band the strip lives in

    // --- ascii field ---------------------------------------------------------
    let regTop = 0
    let regH = 0
    let gridTop = 0 // the cell grid only covers the name's own band
    let cols = 0
    let rows = 0
    let cellW = 0
    let cellH = 0
    let glyphFont = ''
    let subY = 0 // subtitle baseline, in region coords
    let subSize = 0
    let cov: Float32Array | null = null
    let near = new Float32Array(0) // blurred coverage — the halo hugs the letters
    let thr = new Float32Array(0) // per-cell arrival threshold
    let jxa = new Float32Array(0) // per-cell scatter direction
    let jya = new Float32Array(0)
    let sinCol = new Float32Array(0)
    let colFade = new Float32Array(0) // the whisper thins toward the edges
    let fastCol = new Float32Array(0)
    let cosRow = new Float32Array(0)
    let fastRow = new Float32Array(0)
    let diag = new Float32Array(0)

    const rnd = (n: number) => {
      const v = Math.sin(n * 12.9898) * 43758.5453
      return v - Math.floor(v)
    }

    // --- grade ----------------------------------------------------------------
    // These are photographs, not texture: several of them (the poncho against wet
    // grey, the Caribbean street) depend on their colour, so the earlier duotone
    // was dropped. All that is left is a light S-curve for contrast and a touch
    // of desaturation, enough to make five shots from five cameras sit together.
    const lut = new Uint8ClampedArray(256)
    for (let i = 0; i < 256; i++) {
      const v = i / 255
      // gentle S-curve
      const c = clamp01(v + 0.14 * Math.sin(Math.PI * (v - 0.5) * 2) * -0.5 + (v - 0.5) * 0.12)
      lut[i] = Math.round(c * 255)
    }
    const DESAT = 0.12

    const duos: Array<HTMLCanvasElement | null> = FRAMES.map(() => null)
    const loaders: HTMLImageElement[] = []

    const makeDuotone = (img: HTMLImageElement): HTMLCanvasElement | null => {
      const iw = img.naturalWidth
      const ih = img.naturalHeight
      if (!iw || !ih) return null
      const s = Math.min(1, PHOTO_MAX / Math.max(iw, ih))
      const w = Math.max(1, Math.round(iw * s))
      const h = Math.max(1, Math.round(ih * s))
      const off = document.createElement('canvas')
      off.width = w
      off.height = h
      const octx = off.getContext('2d', { willReadFrequently: true })
      if (!octx) return null
      octx.drawImage(img, 0, 0, w, h)
      let field: ImageData
      try {
        field = octx.getImageData(0, 0, w, h)
      } catch {
        return null // tainted somehow — better a typographic frame than a crash
      }
      const px = field.data
      for (let i = 0; i < px.length; i += 4) {
        const l = px[i] * 0.2126 + px[i + 1] * 0.7152 + px[i + 2] * 0.0722
        // pull each channel a little toward luminance, then run the S-curve
        px[i] = lut[(px[i] + (l - px[i]) * DESAT) | 0]
        px[i + 1] = lut[(px[i + 1] + (l - px[i + 1]) * DESAT) | 0]
        px[i + 2] = lut[(px[i + 2] + (l - px[i + 2]) * DESAT) | 0]
        px[i + 3] = 255
      }
      octx.putImageData(field, 0, 0)
      return off
    }

    /**
     * The strip fills — and centres itself in — the band above the DOM chrome.
     * That chrome is measured rather than guessed, so the composition stays
     * balanced at every aspect ratio instead of only at 16:9.
     */
    const layout = () => {
      const cRect = canvas.getBoundingClientRect()
      const bRect = chromeRef.current?.getBoundingClientRect()
      // top: clear of the site nav, but never more than a sixth of a short screen
      const top = Math.min(H * 0.17, Math.max(H * 0.09, 96 * dpr))
      const bot = bRect ? (bRect.top - cRect.top) * dpr : H * 0.86
      const pad = 34 * dpr
      const avail = Math.max(150 * dpr, bot - top - pad * 2)

      const fhMax = avail / 1.46 // 1.46 = frame + both perf bands + both lanes
      // 0.60 leaves the neighbouring frames breaking both edges, which is what
      // makes it a strip and not a carousel. A phone gets 0.80: the pitch is
      // 1.09x the frame so the neighbours still show, and at 0.60 a narrow
      // viewport strands the strip in dead space.
      const fwMax = Math.min(W * (W > 620 * dpr ? 0.6 : 0.8), 620 * dpr)
      fw = Math.min(fwMax, fhMax * 1.5)
      // 3:2 by default. When width is the binding constraint and there is height
      // going spare — a phone, a tall window — the frame is allowed to square up
      // instead, or the strip ends up a thin ribbon stranded in dead space.
      const aspectCap = avail > fw * 1.6 ? 1 : W > 620 * dpr ? 1.2 : 1.05
      fh = Math.max(fw / 1.5, Math.min(fhMax, fw / aspectCap))

      perfH = fh * 0.15
      laneH = fh * 0.072
      stripH = fh + 2 * (perfH + laneH)
      stride = fw + fw * 0.09
      bandCy = (top + bot) / 2
      stripTop = bandCy - stripH / 2

      // the name takes over the strip's band, with air around it
      regH = Math.min(avail, Math.max(stripH * 1.28, fh * 1.7))
      regTop = bandCy - regH / 2
    }

    /**
     * Rasterise the name and sample it into per-cell coverage. Async because a
     * raster taken before the webfont lands would be the fallback's letterforms.
     */
    const buildMask = async () => {
      const token = ++maskToken
      try {
        await document.fonts.ready
      } catch {
        /* fonts API unavailable — fall through with whatever is loaded */
      }
      if (disposed || token !== maskToken) return
      if (!W || !H || !regH) return

      const rw = W
      const rh = regH
      const ms = Math.min(1, MASK_MAX_W / rw)
      const maskW = Math.max(1, Math.round(rw * ms))
      const maskH = Math.max(1, Math.round(rh * ms))
      const off = document.createElement('canvas')
      off.width = maskW
      off.height = maskH
      const octx = off.getContext('2d', { willReadFrequently: true })
      if (!octx) return
      octx.scale(ms, ms) // draw in device-px coordinates, land in mask px
      octx.textAlign = 'center'
      octx.textBaseline = 'alphabetic'

      // Sized to the width budget, not to a fixed fraction: 0.28 is generous
      // enough that the `maxW` clamp below is what actually binds on a phone,
      // where a fixed fraction leaves the name marooned in a tall band.
      let size = Math.min(rw * 0.28, rh * 0.58)
      octx.font = `${size}px ${font}`
      // measureText ignores the transform, so this comparison is device-space
      const measured = octx.measureText(NAME).width
      // 0.68, not 0.8. At 0.8 the mark spanned four fifths of the viewport and
      // measured 1.5% ink coverage over its own bounding box — every glyph was
      // near-black, but spread so thin that the name averaged out to grey from
      // any distance. Narrowing concentrates the same strokes.
      const maxW = rw * 0.68
      if (measured > maxW && measured > 0) {
        size *= maxW / measured
        octx.font = `${size}px ${font}`
      }

      const m = octx.measureText(NAME)
      const ascent = m.actualBoundingBoxAscent || size * 0.72
      const descent = m.actualBoundingBoxDescent || size * 0.2
      // Dilation is a balance, and it was tuned by eye: too little and the
      // serif's thin strokes sample away to a dotted skeleton, too much and the
      // counters of a / o / g / e close up and the name turns into five blobs.
      const dilate = size * 0.019
      const inkH = ascent + descent + dilate
      subSize = Math.max(12 * dpr, Math.min(22 * dpr, size * 0.15))
      const gap = Math.max(14 * dpr, size * 0.26)
      // The name and its caption are one optical block, centred together on the
      // band — centring the name alone leaves the pair sitting low.
      const blockTop = rh / 2 - (inkH + gap + subSize) / 2
      const baselineY = blockTop + dilate / 2 + ascent
      subY = blockTop + inkH + gap + subSize * 0.76

      octx.fillStyle = '#000'
      octx.lineJoin = 'round'
      octx.lineCap = 'round'
      // Dilate before sampling — see the file header.
      octx.lineWidth = dilate
      octx.strokeStyle = '#000'
      octx.strokeText(NAME, rw / 2, baselineY)
      octx.fillText(NAME, rw / 2, baselineY)

      // The grid only covers the name's own band. Spanning the whole region
      // spends most of its cell budget on empty air above and below the mark,
      // which is exactly the resolution the letterforms need.
      const nameTop = baselineY - ascent - dilate / 2
      const nameBot = baselineY + descent + dilate / 2
      gridTop = Math.max(0, nameTop - inkH * 0.5)
      const gridH = Math.min(rh, nameBot + inkH * 0.5) - gridTop

      // ~26 rows per em: fine enough that a serif survives the grid, coarse
      // enough that it still reads as ASCII. Cells are 0.6:1 — the monospace
      // advance ratio — so glyphs tile edge to edge and the mark is solid ink.
      let ch = Math.max(4 * dpr, size / 26)
      let cwv = ch * 0.6
      const est = Math.ceil(rw / cwv) * Math.ceil(gridH / ch)
      if (est > MAX_CELLS) {
        const k = Math.sqrt(est / MAX_CELLS)
        ch *= k
        cwv *= k
      }
      cellH = ch
      cellW = cwv
      cols = Math.max(1, Math.ceil(rw / cellW))
      rows = Math.max(1, Math.ceil(gridH / cellH))
      // bold: a regular '@' leaves enough paper showing that the mark averages
      // out to grey from a distance, which is the opposite of the brief
      glyphFont = `700 ${(cellH * 0.98).toFixed(2)}px ${MONO}`

      const data = octx.getImageData(0, 0, maskW, maskH).data
      const total = cols * rows
      const nextCov = new Float32Array(total)
      const nextThr = new Float32Array(total)
      const nextJx = new Float32Array(total)
      const nextJy = new Float32Array(total)

      for (let j = 0; j < rows; j++) {
        for (let i = 0; i < cols; i++) {
          let sum = 0
          for (let sy = 0; sy < 3; sy++) {
            const py = Math.min(maskH - 1, ((gridTop + (j + (sy * 2 + 1) / 6) * cellH) * ms) | 0)
            const rowOff = py * maskW
            for (let sx = 0; sx < 2; sx++) {
              const pxi = Math.min(maskW - 1, ((i + (sx * 2 + 1) / 4) * cellW * ms) | 0)
              sum += data[(rowOff + pxi) * 4 + 3]
            }
          }
          const k = j * cols + i
          // gamma: partial coverage on an anti-aliased edge should still read as
          // ink, but not so much that the letterforms bloom
          const raw = sum / (6 * 255)
          nextCov[k] = raw <= 0 ? 0 : Math.min(1, Math.pow(raw, 0.72))
          // arrival is mostly random, biased left-to-right so the name condenses
          // in the same direction the reel is travelling
          nextThr[k] = 0.66 * rnd(k * 1.37 + 0.5) + 0.34 * (i / cols)
          const ang = rnd(k * 2.71 + 1.5) * Math.PI * 2
          nextJx[k] = Math.cos(ang)
          nextJy[k] = Math.sin(ang)
        }
      }

      // Separable box blur of the coverage. The whisper field is gated on this
      // rather than on a distance falloff, so it reads as a halo condensing
      // around the letters instead of as wallpaper behind them. Sliding-window
      // sums keep both passes O(cells) regardless of radius.
      const rx = Math.max(2, Math.round(cols * 0.035))
      const ry = Math.max(2, Math.round(rx * 0.6))
      const tmp = new Float32Array(total)
      const nextNear = new Float32Array(total)
      const ci = (i: number) => (i < 0 ? 0 : i > cols - 1 ? cols - 1 : i)
      const cj = (j: number) => (j < 0 ? 0 : j > rows - 1 ? rows - 1 : j)
      for (let j = 0; j < rows; j++) {
        const base = j * cols
        let acc = 0
        for (let i = -rx; i <= rx; i++) acc += nextCov[base + ci(i)]
        for (let i = 0; i < cols; i++) {
          tmp[base + i] = acc / (2 * rx + 1)
          acc += nextCov[base + ci(i + rx + 1)] - nextCov[base + ci(i - rx)]
        }
      }
      for (let i = 0; i < cols; i++) {
        let acc = 0
        for (let j = -ry; j <= ry; j++) acc += tmp[cj(j) * cols + i]
        for (let j = 0; j < rows; j++) {
          nextNear[j * cols + i] = acc / (2 * ry + 1)
          acc += tmp[cj(j + ry + 1) * cols + i] - tmp[cj(j - ry) * cols + i]
        }
      }

      sinCol = new Float32Array(cols)
      fastCol = new Float32Array(cols)
      colFade = new Float32Array(cols)
      cosRow = new Float32Array(rows)
      fastRow = new Float32Array(rows)
      diag = new Float32Array(cols + rows)
      for (let i = 0; i < cols; i++) {
        const nx = Math.abs(((i + 0.5) * cellW) / rw - 0.5) * 2
        colFade[i] = 1 - clamp01((nx - 0.4) / 0.6)
      }

      near = nextNear
      thr = nextThr
      jxa = nextJx
      jya = nextJy
      cov = nextCov // assigned last: the null check gates the rest
      holdDrawn = false // the frozen frame is stale now
    }

    const build = () => {
      if (disposed) return
      if (!canvas.clientWidth || !canvas.clientHeight) {
        rafBuild = requestAnimationFrame(build)
        return
      }
      W = canvas.width = Math.round(canvas.clientWidth * dpr)
      H = canvas.height = Math.round(canvas.clientHeight * dpr)
      layout()
      holdDrawn = false
      void buildMask()
    }

    // --- scrub state ---------------------------------------------------------
    let pos = -0.55 // frame units; starts off-head so the reel threads itself
    let vel = 0
    let dragging = false
    let lastX = 0
    let lastMoveT = 0
    let snapTo: number | null = null
    let auto = false // the idle drift to the name is running
    let isSettled = false
    let settleAt = 0
    let holdDrawn = false // the final frame is on the canvas; stop redrawing
    // Wall clock, not accumulated substeps: the preview browser throttles rAF to
    // a few callbacks a second and the accumulator is clamped at 250ms, so an
    // idle timer fed from it would run several times slow exactly where the
    // passive-visitor payoff matters most.
    let idleFrom = performance.now()
    let pointerX = 0
    let pointerY = 0
    let pointerIn = false
    let pxS = 0 // smoothed cursor, -1..1
    let pyS = 0
    let cursorStyle = ''
    let touchedOnce = false
    let lastActive = -1

    const stopIndex = (v: number) => {
      let bi = 0
      let bd = Infinity
      for (let i = 0; i < STOPS.length; i++) {
        const d = Math.abs(v - STOPS[i])
        if (d < bd) {
          bd = d
          bi = i
        }
      }
      return bi
    }

    /**
     * The one-way door. Everything after this is the name: input is refused, the
     * canvas stops intercepting pointer and wheel events so the page below is
     * immediately reachable, and the draw loop coasts to a frozen frame.
     *
     * It also announces itself. The nav hides over the reel and comes back the
     * moment the name lands, and the alternative — having the nav guess from
     * scroll position — was wrong in both directions: it stayed hidden through
     * the whole idle auto-advance while the name sat finished on screen, and it
     * had no way to know the difference between a reel still running and a reel
     * already spent. An event is the fact itself rather than a proxy for it.
     */
    const settle = (now: number) => {
      if (isSettled) return
      isSettled = true
      settleAt = now
      pos = NAME_POS
      vel = 0
      snapTo = null
      auto = false
      dragging = false
      canvas.style.pointerEvents = 'none'
      canvas.style.touchAction = 'auto'
      canvas.style.cursor = 'default'
      setSettled(true)
      window.dispatchEvent(new CustomEvent(REEL_SETTLED))
    }

    const interact = () => {
      idleFrom = performance.now()
      auto = false
      if (touchedOnce) return
      touchedOnce = true
      setTouched(true)
    }

    const applyDelta = (d: number) => {
      const soft = (pos < 0 && d < 0) || (pos > NAME_POS && d > 0) ? 0.32 : 1
      pos = Math.max(-0.45, Math.min(NAME_POS + 0.35, pos + d * soft))
      snapTo = null
    }

    // --- pointer -------------------------------------------------------------
    const setCursor = (v: string) => {
      if (v === cursorStyle) return
      cursorStyle = v
      canvas.style.cursor = v
    }

    const onDown = (e: PointerEvent) => {
      if (isSettled) return
      if (e.pointerType === 'mouse' && e.button !== 0) return
      dragging = true
      lastX = e.clientX
      lastMoveT = e.timeStamp
      vel = 0
      snapTo = null
      try {
        canvas.setPointerCapture(e.pointerId)
      } catch {
        /* capture is a nicety, not a requirement */
      }
      setCursor('grabbing')
      interact()
      e.preventDefault()
    }

    const onMove = (e: PointerEvent) => {
      if (isSettled) return
      const r = canvas.getBoundingClientRect()
      pointerX = (e.clientX - r.left) * dpr
      pointerY = (e.clientY - r.top) * dpr
      pointerIn = true

      if (!dragging) {
        const overBand = pointerY > stripTop - 24 * dpr && pointerY < stripTop + stripH + 24 * dpr
        setCursor(overBand ? 'grab' : 'default')
        return
      }

      const dx = e.clientX - lastX
      lastX = e.clientX
      const strideCss = stride / dpr || 1
      const d = -dx / strideCss
      applyDelta(d)
      interact()

      const dt = Math.max(1, e.timeStamp - lastMoveT)
      lastMoveT = e.timeStamp
      const inst = Math.max(-8, Math.min(8, d / (dt / 1000)))
      vel = vel * 0.68 + inst * 0.32
    }

    const onUp = (e: PointerEvent) => {
      if (!dragging) return
      dragging = false
      vel = Math.max(-5, Math.min(5, vel))
      setCursor('grab')
      try {
        if (canvas.hasPointerCapture(e.pointerId)) canvas.releasePointerCapture(e.pointerId)
      } catch {
        /* already released */
      }
    }

    const onLeave = () => {
      // Pointer capture keeps delivering moves during a drag, but boundary
      // events still fire — ignore them or the cursor sticks for the rest of it.
      if (dragging) return
      pointerIn = false
      setCursor('default')
    }

    const onWheel = (e: WheelEvent) => {
      if (isSettled) return // the page owns the wheel now
      const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 400 : 1
      const raw = (Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY) * unit
      if (!raw) return
      const strideCss = stride / dpr || 1
      // Clamped per event: a trackpad flick can carry a four-figure delta, and
      // unclamped it would teleport straight past the dissolve so the name pops
      // instead of condensing. Momentum still arrives as many small events.
      const d = Math.max(-0.6, Math.min(0.6, raw / (strideCss * 0.75)))

      // Hand the wheel back to the page at the head. `applyDelta` keeps a soft
      // overscroll band, so "did pos change" is always true while rubber-banding
      // and the reel would otherwise swallow every upward scroll.
      if (pos <= 0.02 && d < 0) return

      const before = pos
      applyDelta(d)
      if (pos === before) return // only swallow the gesture when it did something
      vel = Math.max(-5, Math.min(5, vel * 0.5 + d * 3))
      e.preventDefault()
      interact()
    }

    const onKey = (e: KeyboardEvent) => {
      if (isSettled) return
      const el = e.target as HTMLElement | null
      if (
        el &&
        (el.tagName === 'INPUT' ||
          el.tagName === 'SELECT' ||
          el.tagName === 'TEXTAREA' ||
          el.isContentEditable)
      ) {
        return
      }
      let dir = 0
      if (e.key === 'ArrowRight') dir = 1
      else if (e.key === 'ArrowLeft') dir = -1
      else return
      e.preventDefault()
      const from = stopIndex(snapTo !== null ? snapTo : pos)
      snapTo = STOPS[Math.max(0, Math.min(STOPS.length - 1, from + dir))]
      interact()
    }

    jumpRef.current = (i: number) => {
      if (isSettled) return
      snapTo = STOPS[Math.max(0, Math.min(STOPS.length - 1, i))]
      interact()
    }

    canvas.addEventListener('pointerdown', onDown)
    canvas.addEventListener('pointermove', onMove)
    canvas.addEventListener('pointerup', onUp)
    canvas.addEventListener('pointercancel', onUp)
    canvas.addEventListener('pointerleave', onLeave)
    canvas.addEventListener('wheel', onWheel, { passive: false })
    window.addEventListener('resize', build)
    window.addEventListener('keydown', onKey)
    const onFontsDone = () => build()
    document.fonts.addEventListener('loadingdone', onFontsDone)

    // --- physics -------------------------------------------------------------
    const step = (h: number) => {
      // smoothed cursor for parallax — eased so motion never snaps
      if (W && H) {
        const pxT = pointerIn ? Math.max(-1, Math.min(1, (pointerX / W - 0.5) * 2)) : 0
        const pyT = pointerIn ? Math.max(-1, Math.min(1, (pointerY - bandCy) / (H * 0.5))) : 0
        const k = Math.min(1, 7 * h)
        pxS += (pxT - pxS) * k
        pyS += (pyT - pyS) * k
      }

      if (dragging) return // pos is driven straight from pointermove

      vel *= Math.exp(-1.9 * h) // transport friction
      const target = snapTo !== null ? snapTo : STOPS[stopIndex(pos)]
      const engage = snapTo !== null ? 1 : 1 - Math.min(1, Math.abs(vel) / 2.2)
      // the idle drift is a much softer spring than a snap: it glides over a
      // couple of seconds instead of yanking the strip out from under a reader
      const stiff = auto ? 10 : 34
      const damp = auto ? 5.4 : 8.5
      vel += (target - pos) * stiff * engage * h
      vel *= Math.exp(-damp * engage * h)

      if (pos < 0) {
        vel += -pos * 70 * h
        vel *= Math.exp(-11 * h)
      } else if (pos > NAME_POS) {
        vel += (NAME_POS - pos) * 70 * h
        vel *= Math.exp(-11 * h)
      }

      pos += vel * h

      if (snapTo !== null && Math.abs(pos - snapTo) < 0.004 && Math.abs(vel) < 0.05) {
        pos = snapTo
        vel = 0
        snapTo = null
      }
    }

    // --- drawing helpers -----------------------------------------------------
    const rrect = (x: number, y: number, w: number, h: number, r: number) => {
      const rr = Math.min(r, w / 2, h / 2)
      ctx.beginPath()
      ctx.moveTo(x + rr, y)
      ctx.lineTo(x + w - rr, y)
      ctx.quadraticCurveTo(x + w, y, x + w, y + rr)
      ctx.lineTo(x + w, y + h - rr)
      ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h)
      ctx.lineTo(x + rr, y + h)
      ctx.quadraticCurveTo(x, y + h, x, y + h - rr)
      ctx.lineTo(x, y + rr)
      ctx.quadraticCurveTo(x, y, x + rr, y)
      ctx.closePath()
    }

    /**
     * Letter-spaced text, drawn glyph by glyph. `ctx.letterSpacing` is not
     * universally available and the meta type here is tracked hard, so tracking
     * is done by hand rather than trusted to the platform.
     */
    const trackedW = (s: string, sp: number) => {
      let w = 0
      for (let i = 0; i < s.length; i++) w += ctx.measureText(s[i]).width + sp
      return s.length ? w - sp : 0
    }
    const tracked = (s: string, cx: number, y: number, sp: number, align: 'center' | 'left') => {
      const prev = ctx.textAlign
      ctx.textAlign = 'left'
      let x = align === 'center' ? cx - trackedW(s, sp) / 2 : cx
      for (let i = 0; i < s.length; i++) {
        ctx.fillText(s[i], x, y)
        x += ctx.measureText(s[i]).width + sp
      }
      ctx.textAlign = prev
    }

    /** The double rule that makes a rectangle read as a film frame. */
    const edges = (x0: number, yy: number, f: number) => {
      ctx.lineWidth = Math.max(1, 1.5 * dpr)
      ctx.strokeStyle = 'rgba(5,8,11,0.9)'
      ctx.strokeRect(x0 + 0.75 * dpr, yy + 0.75 * dpr, fw - 1.5 * dpr, fh - 1.5 * dpr)
      ctx.lineWidth = Math.max(1, dpr)
      ctx.strokeStyle = `rgba(${BG_RGB},${0.05 + 0.07 * f})`
      ctx.strokeRect(x0 + 3 * dpr, yy + 3 * dpr, fw - 6 * dpr, fh - 6 * dpr)
    }

    // rgba strings are reused via a quantised cache so fillStyle churn stays low
    const QA = 24
    const styleCache: Array<string | undefined> = new Array(QA + 1)

    /**
     * The name, built out of live ASCII.
     *
     * Contrast is deliberate and asymmetric: cells inside the letterform take
     * the dense end of the ramp at full opacity in near-black, and cells outside
     * it are capped at 0.055 alpha and fall off toward every edge. `amt` is the
     * dissolve, and each cell has its own arrival threshold, so at `amt = 0.3`
     * the name is still mostly scattered grain and at `amt = 1` it is type.
     */
    const drawName = (t: number, amt: number) => {
      const c0 = cov
      if (!c0 || !cols || !rows) return

      for (let i = 0; i < cols; i++) {
        sinCol[i] = Math.sin(i * 0.09 + t * 0.55)
        fastCol[i] = Math.sin(i * 0.4 + t * 5.5)
      }
      for (let j = 0; j < rows; j++) {
        cosRow[j] = Math.cos(j * 0.15 - t * 0.42)
        fastRow[j] = Math.cos(j * 0.55 - t * 4.7)
      }
      for (let di = 0, dn = cols + rows; di < dn; di++) {
        diag[di] = Math.sin(di * 0.06 - t * 0.31)
      }

      ctx.font = glyphFont
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      const halfW = cellW / 2
      const halfH = cellH / 2
      const gTop = regTop + gridTop
      let lastStyle = ''

      for (let j = 0; j < rows; j++) {
        const baseY = gTop + j * cellH + halfH
        const cr = cosRow[j]
        const fr = fastRow[j]
        const rowBase = j * cols
        for (let i = 0; i < cols; i++) {
          const k = rowBase + i
          const app = clamp01((amt - thr[k] * 0.6) / 0.4)
          if (app <= 0) continue

          const cvg = c0[k]

          let gi: number
          let a: number
          if (cvg > 0.02) {
            // inside the letterform: this is the mark, and it is loud. The core
            // is flat '@' at full opacity — no gradient, no tint, no mercy.
            gi = cvg >= 0.62 ? 9 : Math.max(3, Math.min(8, Math.round(3 + cvg * 9)))
            a = clamp01(0.35 + cvg) * app
          } else {
            // outside: a whisper hugging the letters, never above 0.055
            const q = clamp01(0.5 + 0.5 * (0.62 * sinCol[i] * cr + 0.38 * diag[i + j]))
            const halo = q * clamp01(near[k] * 2.6) * colFade[i]
            if (halo < 0.14) continue
            gi = 1 + ((halo * 3.2) | 0)
            a = 0.055 * halo * amt * app
            if (a < 0.012) continue
          }

          // still condensing: the glyph churns like grain before it settles
          if (app < 0.92) {
            const noisy = 1 + ((((fastCol[i] * fr + 1) * 0.5) * 4) | 0)
            gi = Math.max(1, Math.min(9, Math.round(gi * app + noisy * (1 - app))))
          }
          if (gi <= 0) continue

          const scatter = (1 - app) * cellH * 2.6
          const gx = i * cellW + halfW + scatter * jxa[k]
          const gy = baseY + scatter * jya[k]

          const qa = (a * QA + 0.5) | 0
          if (qa <= 0) continue
          let style = styleCache[qa]
          if (style === undefined) {
            style = `rgba(20,22,26,${(qa / QA).toFixed(3)})`
            styleCache[qa] = style
          }
          if (style !== lastStyle) {
            ctx.fillStyle = style
            lastStyle = style
          }

          ctx.fillText(RAMP[gi], gx, gy)
        }
      }

      // The through-line, quiet, and arriving after the mark it belongs to.
      //
      // This block used to set up its own text state and then never call
      // fillText — the caption had been half-removed, so `subSize` and `subY`
      // were computed every rebuild and thrown away. It belongs here: a title
      // card names the person and then says what they do, and hanging it off
      // the photograph two screens down made it a caption to a picture rather
      // than the second line of the mark.
      const sa = ease(clamp01((amt - 0.6) / 0.4))
      if (sa > 0.01 && subSize > 0) {
        ctx.textAlign = 'center'
        ctx.textBaseline = 'alphabetic'
        ctx.fillStyle = `rgba(92,98,109,${(sa * 0.95).toFixed(3)})`
        ctx.font = `${subSize}px ${font}`
        ctx.fillText(TAGLINE, W / 2, regTop + subY)
      }
    }

    /** One frame's interior — photo if we have one, bare stock if we do not. */
    const drawFrameFace = (idx: number, x0: number, y0: number, focus: boolean) => {
      const duo = duos[idx]

      if (duo) {
        // cover fit, cropped from the centre
        const iw = duo.width
        const ih = duo.height
        const sc = Math.max(fw / iw, fh / ih)
        const sw = Math.min(iw, fw / sc)
        const sh = Math.min(ih, fh / sc)
        ctx.drawImage(duo, (iw - sw) / 2, (ih - sh) / 2, sw, sh, x0, y0, fw, fh)

        // Scrim: enough to carry type, not enough to kill the photograph. The
        // knee sits at 0.62 because that is where the title lands — a linear
        // ramp leaves the title floating over whatever the picture happens to
        // be doing there, which on a bright frame is unreadable.
        const scrim = ctx.createLinearGradient(0, y0, 0, y0 + fh)
        // Much lighter than it was: the frames no longer carry a title and
        // caption, so the scrim only has to keep the corner ticks and the frame
        // number legible. The photograph is the content now.
        scrim.addColorStop(0, 'rgba(14,17,21,0.02)')
        scrim.addColorStop(0.5, 'rgba(14,17,21,0.06)')
        scrim.addColorStop(1, 'rgba(14,17,21,0.26)')
        ctx.fillStyle = scrim
        ctx.fillRect(x0, y0, fw, fh)
      } else {
        ctx.fillStyle = SLUG
        ctx.fillRect(x0, y0, fw, fh)
      }

      const onPhoto = !!duo
      const numFill = focus ? ACCENT : onPhoto ? 'rgba(247,248,249,0.66)' : 'rgba(107,114,128,0.9)'
      const tickFill = onPhoto ? 'rgba(247,248,249,0.4)' : 'rgba(20,22,26,0.22)'

      // corner ticks — a frame, not a card
      const ti = fw * 0.038
      const tl = fw * 0.048
      const hair = Math.max(1, dpr)
      ctx.fillStyle = tickFill
      for (const sx of [0, 1]) {
        for (const sy of [0, 1]) {
          const bx = x0 + (sx ? fw - ti - tl : ti)
          const by = y0 + (sy ? fh - ti - hair : ti)
          ctx.fillRect(bx, by, tl, hair)
          ctx.fillRect(sx ? bx + tl - hair : bx, y0 + (sy ? fh - ti - tl : ti), hair, tl)
        }
      }

      // The frame number is the only type left in the frame, and it is metadata:
      // mono, tracked, hung in the corner. Sizes are keyed to the frame's WIDTH,
      // never to fractions of its height — the frame runs from 3:2 to square
      // depending on the viewport, and a height fraction strands the number
      // somewhere different at every aspect ratio.
      ctx.textBaseline = 'alphabetic'
      const numSize = Math.max(9 * dpr, fw * 0.0367)
      ctx.font = `${numSize}px ${MONO}`
      ctx.fillStyle = numFill
      tracked(pad2(idx + 1), x0 + fw * 0.075, y0 + fw * 0.107, numSize * 0.16, 'left')
    }

    const draw = (t: number) => {
      const noiseFrame = Math.floor(t * 14) // film-ish resample rate
      // gate weave: the whole strip is a hair unsteady
      const wAmp = 1.1 * dpr
      const wx = (rnd(noiseFrame * 1.7) - 0.5) * wAmp
      const wy = (rnd(noiseFrame * 2.3) - 0.5) * wAmp * 0.7
      // never truly at rest: the transport breathes
      const dpos = isSettled
        ? pos
        : pos + Math.sin(t * 0.55) * 0.012 + Math.sin(t * 0.23) * 0.008

      // the dissolve, entirely a function of position
      const reveal = clamp01((pos - LAST) / RESOLVE)
      const amt = ease(reveal)
      // frames empty out first, then the film base and its sprockets follow
      const frameA = 1 - ease(clamp01(reveal / 0.62))
      const stripA = 1 - ease(clamp01((reveal - 0.16) / 0.84))

      const sTop = stripTop
      const sBot = stripTop + stripH
      const y0 = bandCy - fh / 2

      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.globalAlpha = 1
      ctx.fillStyle = BG
      ctx.fillRect(0, 0, W, H)

      // the lamp sweeps on its own and leans toward the cursor
      const lampAuto = 0.5 + 0.42 * Math.sin(t * 0.4)
      const lampX = W * (pointerIn ? lampAuto * 0.45 + (pointerX / W) * 0.55 : lampAuto)

      if (stripA > 0.003) {
        ctx.save()
        ctx.globalAlpha = stripA
        ctx.translate(wx, wy)

        // --- film base ---
        const bg = ctx.createLinearGradient(0, sTop, 0, sBot)
        bg.addColorStop(0, BASE_EDGE)
        bg.addColorStop(0.16, BASE)
        bg.addColorStop(0.84, BASE)
        bg.addColorStop(1, BASE_EDGE)
        ctx.fillStyle = bg
        ctx.fillRect(0, sTop, W, stripH)

        // --- perforations, four per frame, travelling with the strip ---
        const pitch = stride / 4
        const originX = W / 2 - dpos * stride
        const pw = pitch * 0.4
        const ph = perfH * 0.44
        const k0 = Math.floor((-originX - pitch) / pitch)
        const k1 = Math.ceil((W - originX + pitch) / pitch)
        ctx.fillStyle = `rgba(${BG_RGB},0.84)`
        for (let k = k0; k <= k1; k++) {
          const x = originX + k * pitch + (pitch - pw) / 2
          rrect(x, sTop + (perfH - ph) / 2, pw, ph, 2 * dpr)
          ctx.fill()
          rrect(x, sBot - perfH + (perfH - ph) / 2, pw, ph, 2 * dpr)
          ctx.fill()
        }

        // --- edge print lanes ---
        ctx.fillStyle = `rgba(${BG_RGB},0.12)`
        ctx.fillRect(0, sBot - perfH - laneH * 0.52, W, Math.max(1, dpr))
        for (let k = k0; k <= k1; k++) {
          const x = originX + k * pitch
          ctx.fillRect(x, sBot - perfH - laneH * 0.9, Math.max(1, dpr), laneH * 0.34)
        }

        ctx.textBaseline = 'middle'
        ctx.fillStyle = `rgba(${BG_RGB},0.3)`
        const printSize = Math.max(7 * dpr, Math.min(laneH * 0.6, fw * 0.03))
        ctx.font = `${printSize}px ${MONO}`
        for (let i = -2; i <= FRAMES.length + 2; i++) {
          const x = originX + i * stride - fw / 2
          if (x > W || x + fw < 0) continue
          tracked('YH · 2026', x + fw * 0.02, sTop + perfH + laneH / 2, printSize * 0.22, 'left')
        }

        // --- frames ---
        const snapped = Math.max(0, Math.min(LAST, Math.round(pos)))
        const span = Math.ceil(W / (2 * stride)) + 1
        const from = Math.floor(dpos) - span
        const to = Math.ceil(dpos) + span

        for (let i = from; i <= to; i++) {
          const cxF = W / 2 + (i - dpos) * stride
          const x0 = cxF - fw / 2
          if (x0 > W || x0 + fw < 0) continue

          // outside the reel: unexposed stock, so head leader and tail read as
          // film rather than as empty space. The leader belongs to the strip, so
          // it fades with the base and not with the frames.
          if (i < 0 || i > LAST) {
            ctx.globalAlpha = stripA
            ctx.fillStyle = '#12171d'
            ctx.fillRect(x0, y0, fw, fh)
            if (i === -1 || i === LAST + 1) {
              ctx.strokeStyle = `rgba(${BG_RGB},0.09)`
              ctx.lineWidth = Math.max(1, dpr)
              ctx.beginPath()
              ctx.arc(cxF, bandCy, fh * 0.2, 0, Math.PI * 2)
              ctx.moveTo(cxF - fh * 0.3, bandCy)
              ctx.lineTo(cxF + fh * 0.3, bandCy)
              ctx.moveTo(cxF, bandCy - fh * 0.3)
              ctx.lineTo(cxF, bandCy + fh * 0.3)
              ctx.stroke()
            }
            edges(x0, y0, 0)
            continue
          }

          if (frameA <= 0.003) continue
          ctx.globalAlpha = stripA * frameA

          const d = Math.abs(i - dpos)
          const f = Math.max(0, Math.min(1, 1 - d * 0.86))
          const par = (0.35 + 0.65 * Math.min(1, d)) * 9 * dpr

          ctx.save()
          ctx.beginPath()
          ctx.rect(x0, y0, fw, fh)
          ctx.clip()
          ctx.translate(-pxS * par, -pyS * par * 0.45)
          drawFrameFace(i, x0, y0, i === snapped)
          ctx.restore()

          // focus scrim — dims interior and type as one object
          if (f < 1) {
            ctx.fillStyle = `rgba(14,18,23,${(1 - f) * 0.68})`
            ctx.fillRect(x0, y0, fw, fh)
          }

          edges(x0, y0, f)
        }

        ctx.globalAlpha = stripA

        // --- projector lamp ---
        const beam = ctx.createLinearGradient(lampX - W * 0.3, 0, lampX + W * 0.3, 0)
        beam.addColorStop(0, 'rgba(255,255,255,0)')
        beam.addColorStop(0.5, 'rgba(226,238,250,0.07)')
        beam.addColorStop(1, 'rgba(255,255,255,0)')
        ctx.fillStyle = beam
        ctx.fillRect(0, sTop, W, stripH)

        // --- dust, and a hair in the gate ---
        for (let i = 0; i < 22; i++) {
          const s = noiseFrame * 7 + i
          const x = rnd(s * 1.3) * W
          const y = sTop + rnd(s * 2.7) * stripH
          ctx.fillStyle = rnd(s * 3.9) > 0.45 ? 'rgba(236,242,247,0.2)' : 'rgba(8,12,16,0.14)'
          ctx.fillRect(x, y, 1.4 * dpr, (0.6 + rnd(s * 4.4) * 4) * dpr)
        }
        const hs = Math.floor(t / 2.6)
        const hx = rnd(hs * 5.1) * W
        ctx.strokeStyle = 'rgba(236,242,247,0.16)'
        ctx.lineWidth = Math.max(1, 1.2 * dpr)
        ctx.beginPath()
        ctx.moveTo(hx, sTop)
        ctx.quadraticCurveTo(hx + 10 * dpr, sTop + stripH * 0.35, hx - 5 * dpr, sTop + stripH * 0.62)
        ctx.stroke()

        ctx.restore()

        // --- the strip runs off both edges ---
        // full opacity: the vignette is page, not film, so it keeps covering the
        // strip's ends cleanly all the way through the dissolve
        ctx.globalAlpha = 1
        const fade = ctx.createLinearGradient(0, 0, W, 0)
        fade.addColorStop(0, BG)
        fade.addColorStop(0.08, `rgba(${BG_RGB},0)`)
        fade.addColorStop(0.92, `rgba(${BG_RGB},0)`)
        fade.addColorStop(1, BG)
        ctx.fillStyle = fade
        ctx.fillRect(-4 * dpr, sTop - 4 * dpr, W + 8 * dpr, stripH + 8 * dpr)
      }

      // --- the name assembles out of what is left ---
      if (amt > 0.003) drawName(t, amt)

      // --- emulsion: a cool speckle over the whole plate ---
      // it peaks mid-dissolve — film turning to grain turning to type
      const churn = amt * (1 - amt) * 4
      const count = Math.floor(Math.min(1200, Math.floor((W * H) / 3000)) * (1 + 1.3 * churn))
      for (let i = 0; i < count; i++) {
        const s = noiseFrame * 13 + i
        ctx.fillStyle = rnd(s * 3.33) > 0.5 ? 'rgba(120,140,160,0.045)' : 'rgba(255,255,255,0.05)'
        ctx.fillRect(rnd(s * 1.11) * W, rnd(s * 2.22) * H, 1.4 * dpr, 1.4 * dpr)
      }

      const nowActive = stopIndex(pos)
      if (nowActive !== lastActive) {
        lastActive = nowActive
        setActive(nowActive)
      }
    }

    // --- photos --------------------------------------------------------------
    // Reduced motion never shows the reel, so there is nothing to load for it.
    if (!reduced) {
      FRAMES.forEach((f, i) => {
        const img = new Image()
        img.decoding = 'async'
        img.onload = () => {
          if (disposed) return
          const made = makeDuotone(img)
          if (!made) return
          duos[i] = made
          holdDrawn = false
        }
        // A missing file is a supported state, not a failure: the typographic
        // frame is a finished design and simply stands in.
        img.onerror = () => {}
        img.src = f
        loaders.push(img)
      })
    }

    build()
    // the webfont changes the name's metrics, which moves the mask
    document.fonts.ready
      .then(() => {
        if (!disposed) build()
      })
      .catch(() => {})

    // --- loop ----------------------------------------------------------------
    const t0 = performance.now()
    let lastT = t0
    const SUB = 1 / 120

    if (reduced) {
      // no reel, no dissolve — the name is simply already there
      pos = NAME_POS
      settle(t0)
    }

    const loop = (now: number) => {
      raf = requestAnimationFrame(loop)
      let acc = Math.min(now - lastT, 250) / 1000
      lastT = now
      if (!W || !H) return

      if (!isSettled) {
        // nobody has touched it in a while: let the reel resolve itself, so the
        // payoff is not gated on the visitor guessing that they can scrub
        if (dragging) idleFrom = now
        else if (!auto && now - idleFrom > IDLE_TO_NAME * 1000 && pos < NAME_POS - 0.002) {
          auto = true
          snapTo = NAME_POS
        }

        while (acc > 0) {
          const h = Math.min(SUB, acc)
          step(h)
          acc -= h
        }

        if (pos >= NAME_POS - 0.004) settle(now)
      } else if (holdDrawn) {
        return // the name is static; the canvas already holds it
      }

      draw((now - t0) / 1000)
      // let the last of the arrival play out, then stop burning frames
      if (isSettled && (reduced || now - settleAt > 900)) holdDrawn = true
    }
    raf = requestAnimationFrame(loop)

    return () => {
      disposed = true
      cancelAnimationFrame(raf)
      cancelAnimationFrame(rafBuild)
      for (const img of loaders) {
        img.onload = null
        img.onerror = null
      }
      canvas.removeEventListener('pointerdown', onDown)
      canvas.removeEventListener('pointermove', onMove)
      canvas.removeEventListener('pointerup', onUp)
      canvas.removeEventListener('pointercancel', onUp)
      canvas.removeEventListener('pointerleave', onLeave)
      canvas.removeEventListener('wheel', onWheel)
      window.removeEventListener('resize', build)
      window.removeEventListener('keydown', onKey)
      document.fonts.removeEventListener('loadingdone', onFontsDone)
    }
  }, [font])

  const meta: CSSProperties = {
    fontFamily: '"Source Code Pro", monospace',
    color: MUTED,
    letterSpacing: '0.22em',
    textTransform: 'uppercase',
  }

  return (
    <section
      className="relative w-full h-screen min-h-[100svh] overflow-hidden select-none"
      style={{ background: BG }}
    >
      {/* the canvas is decorative; the name itself is real text for everyone else */}
      <h1 className="sr-only">Yihan Hong — engineer, and a few other things.</h1>

      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{
          touchAction: settled ? 'auto' : 'pan-y',
          pointerEvents: settled ? 'none' : 'auto',
        }}
        aria-hidden="true"
      />

      {/* bottom chrome: where you are in the roll, and how to move through it */}
      <div ref={chromeRef} className="absolute inset-x-0 bottom-0 z-10 pb-8 md:pb-11">
        <div className="relative max-w-[1100px] mx-auto px-6">
          {/* the reel's chrome — retires for good once the name lands */}
          <div
            className="grid grid-cols-1 sm:grid-cols-3 items-center gap-3"
            style={{
              opacity: settled ? 0 : 1,
              pointerEvents: settled ? 'none' : 'auto',
              transition: 'opacity 520ms ease',
            }}
          >
            <span className="hidden sm:block text-[12px] truncate" style={meta}>
              {active < FRAMES.length
                ? `${pad2(active + 1)} / ${pad2(FRAMES.length)}`
                : 'resolving'}
            </span>

            <div className="flex items-center justify-center">
              {STOP_LABELS.map((label, i) => {
                const on = i === active
                const isName = i === STOP_LABELS.length - 1
                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => jumpRef.current(i)}
                    aria-label={label}
                    aria-current={on ? 'true' : undefined}
                    tabIndex={settled ? -1 : 0}
                    className="appearance-none bg-transparent border-0 cursor-pointer py-3 flex justify-center items-center"
                    style={{ width: 30 }}
                  >
                    <span
                      className="block"
                      style={{
                        width: isName ? (on ? 9 : 6) : on ? 22 : 11,
                        height: isName ? (on ? 9 : 6) : 2,
                        borderRadius: isName ? 999 : 0,
                        background: on ? ACCENT : 'rgba(20,22,26,0.2)',
                        transition:
                          'width 280ms cubic-bezier(.2,.8,.2,1), height 280ms cubic-bezier(.2,.8,.2,1), background-color 280ms linear',
                      }}
                    />
                  </button>
                )
              })}
            </div>

            <span
              className="block sm:text-right text-center text-[12px]"
              style={{ ...meta, opacity: touched ? 0.55 : 1, transition: 'opacity 700ms ease' }}
            >
              <span className="hidden sm:inline">drag · scroll · ← →</span>
              <span className="sm:hidden">drag · swipe</span>
            </span>
          </div>

          {/* what replaces it: the page keeps going */}
          <div
            className="absolute inset-0 flex flex-col items-center justify-center gap-2"
            style={{
              opacity: settled ? 1 : 0,
              pointerEvents: 'none',
              transition: 'opacity 900ms ease 320ms',
            }}
            aria-hidden="true"
          >
            <span
              className="block w-px h-6"
              style={{ background: `linear-gradient(to bottom, transparent, ${HAIRLINE})` }}
            />
            <span className="text-[12px]" style={meta}>
              scroll
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}

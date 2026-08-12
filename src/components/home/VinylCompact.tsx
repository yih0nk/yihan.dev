'use client'

import { useEffect, useRef, useState } from 'react'
import { useThemeColors } from '@/lib/useThemeColors'
import { RESTING_LABEL } from './tracks'

/**
 * The record at small size.
 *
 * This is not the big vinyl scaled down. At ~180px the things that make the
 * large one convincing — a hundred and twenty individually stroked grooves, a
 * tonearm with a headshell and a counterweight, deadwax — land inside two or
 * three pixels each and turn into mud. So the compact record keeps only what
 * survives: the disc gradient, a sparse groove field, one moving sheen, the
 * coloured label, and a spindle. The tonearm is a single tapered line, because
 * at this size the arm reads as "record player" purely from its angle.
 *
 * It still turns at a true 33⅓, driven from wall-clock rather than accumulated
 * frames, so a throttled or briefly-backgrounded rAF cannot make it drift slow.
 */

const TAU = Math.PI * 2

export default function VinylCompact({
  label,
  reduced,
  size = 188,
  art = null,
  progress = 0,
}: {
  /** Label colour, rgb. Defaults to the resting grey when nothing is known. */
  label?: [number, number, number]
  reduced: boolean
  size?: number
  /** Album art URL, or null to leave the label its authored colour. */
  art?: string | null
  /** 0..1 through the track. Positions the stylus; 0 parks it at the lead-in. */
  progress?: number
}) {
  /*
   * Canvas cannot take a CSS variable, so the spindle needs the resolved value
   * — but through a ref, not the effect deps. `theme.bg` in the dependency
   * array rebuilt the whole canvas on every toggle, and `started` is captured
   * there, so the record jumped back to angle zero mid-spin.
   */
  const theme = useThemeColors()
  const themeRef = useRef(theme)
  const repaintRef = useRef<(() => void) | null>(null)
  useEffect(() => {
    themeRef.current = theme
    repaintRef.current?.()
  }, [theme])
  const canvasRef = useRef<HTMLCanvasElement>(null)
  // Read inside the loop so a track change never re-initialises the canvas.
  const targetRef = useRef<[number, number, number]>(label ?? RESTING_LABEL)
  const artRef = useRef<HTMLImageElement | null>(null)
  // Read inside the loop, like the label colour: a position tick must not tear
  // down and rebuild the canvas twice a second.
  const progressRef = useRef(0)
  /** Bumped when a cover finishes loading, to force a repaint while parked. */
  const [artLoaded, setArtLoaded] = useState(0)

  useEffect(() => {
    targetRef.current = label ?? RESTING_LABEL
  }, [label])

  useEffect(() => {
    progressRef.current = Number.isFinite(progress) ? Math.max(0, Math.min(1, progress)) : 0
  }, [progress])

  /**
   * Load the cover out of band. The draw loop reads `artRef` and does not care
   * how it got there, so a slow or failed image simply leaves the label its
   * colour — a missing cover is a supported state, not an error to render.
   *
   * `setArtLoaded` exists purely to repaint: the loop stops when the record is
   * off-screen or the tab is hidden, so an image that finishes loading in that
   * window would otherwise never reach the canvas.
   */
  useEffect(() => {
    if (!art) {
      artRef.current = null
      setArtLoaded((n) => n + 1)
      return
    }
    let alive = true
    const img = new Image()
    img.decoding = 'async'
    img.onload = () => {
      if (!alive) return
      artRef.current = img
      setArtLoaded((n) => n + 1)
    }
    img.onerror = () => {
      if (!alive) return
      artRef.current = null
      setArtLoaded((n) => n + 1)
    }
    img.src = art
    return () => {
      alive = false
      img.onload = null
      img.onerror = null
    }
  }, [art])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    let alive = true
    let raf = 0
    let W = 0
    let H = 0

    /**
     * Measure, then paint one frame immediately — before the loop and
     * regardless of it. The record is an object on the page first and an
     * animation second, and setting `canvas.width` above has just cleared it.
     *
     * A ResizeObserver rather than a rAF retry loop. The obvious shape here is
     * "if clientWidth is 0, try again next frame", and it is quietly broken:
     * rAF does not fire at all in a background tab, so a canvas that mounted
     * before layout settled stayed at the HTML default 300×150 and never drew
     * anything — a hole in the layout that only appeared for people who opened
     * the page in a background tab. The observer fires on layout, which is the
     * thing actually being waited for, and it covers resize too.
     */
    const build = () => {
      if (!alive) return
      const w = canvas.clientWidth
      const h = canvas.clientHeight
      if (!w || !h) return
      const nw = Math.round(w * dpr)
      const nh = Math.round(h * dpr)
      // Assigning width/height clears the canvas even when the value is
      // unchanged, so skip the no-op and keep whatever is already drawn.
      if (nw === W && nh === H) return
      W = canvas.width = nw
      H = canvas.height = nh
      draw(performance.now())
    }

    const rgb: [number, number, number] = [...(label ?? RESTING_LABEL)]
    const started = performance.now()
    let last = started
    let armEase = progressRef.current

    /**
     * The loop is gated on the record actually being watchable. An unconditional
     * rAF here would keep repainting a 168px canvas for the whole life of the
     * page — including while it is scrolled a screen and a half out of view, and
     * including under prefers-reduced-motion, where every frame is identical to
     * the last. Both are pure battery.
     *
     * `onScreen` starts false and the observer supplies the truth on its first
     * callback, which fires immediately on observe.
     */
    let onScreen = false
    let running = false

    const tick = () => {
      if (!alive) return
      if (!onScreen || document.hidden) {
        running = false
        return
      }
      raf = requestAnimationFrame(tick)
      draw(performance.now())
    }

    const start = () => {
      if (running || !alive) return
      running = true
      // A gap in the loop is a gap in wall clock too; without this the disc
      // would jump forward by however long it was parked.
      last = performance.now()
      raf = requestAnimationFrame(tick)
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        onScreen = entry.isIntersecting
        if (onScreen) start()
      },
      { rootMargin: '120px' }
    )

    const onVisibility = () => {
      if (!document.hidden) start()
    }

    const draw = (now: number) => {
      if (!W || !H) return

      const dt = Math.min((now - last) / 1000, 0.25)
      last = now

      const tgt = targetRef.current
      const k = 1 - Math.exp(-dt * 3.4)
      rgb[0] += (tgt[0] - rgb[0]) * k
      rgb[1] += (tgt[1] - rgb[1]) * k
      rgb[2] += (tgt[2] - rgb[2]) * k

      // 33 1/3 rpm = 0.5556 rev/s, taken from wall clock
      const spin = reduced ? -0.35 : ((now - started) / 1000) * 0.5556 * TAU

      // The arm chases the reported position instead of snapping to it, so a
      // re-sync after a seek reads as the arm being moved rather than teleporting.
      armEase += (progressRef.current - armEase) * (1 - Math.exp(-dt * 2.6))

      ctx.clearRect(0, 0, W, H)

      const S = Math.min(W, H)
      const cx = W * 0.5
      const cy = H * 0.5
      const R = S * 0.42
      // 0.44 rather than the 0.38 a real 12" label measures. At 148px that was a
      // 47px circle to hold a cover in, which reads as a coloured smudge rather
      // than as artwork. This is as far as it can go: the groove field starts at
      // 0.46R, and a label past that would sit on top of its own grooves.
      const LR = R * 0.44

      // contact shadow
      ctx.save()
      ctx.translate(cx + S * 0.008, cy + S * 0.018)
      const shade = ctx.createRadialGradient(0, 0, R * 0.55, 0, 0, R * 1.14)
      shade.addColorStop(0, 'rgba(16,18,22,0.18)')
      shade.addColorStop(0.76, 'rgba(16,18,22,0.07)')
      shade.addColorStop(1, 'rgba(16,18,22,0)')
      ctx.beginPath()
      ctx.arc(0, 0, R * 1.14, 0, TAU)
      ctx.fillStyle = shade
      ctx.fill()
      ctx.restore()

      ctx.save()
      ctx.translate(cx, cy)

      // disc body
      const body = ctx.createRadialGradient(-R * 0.3, -R * 0.34, R * 0.04, 0, 0, R)
      body.addColorStop(0, '#26282e')
      body.addColorStop(0.55, '#16181c')
      body.addColorStop(1, '#0c0d10')
      ctx.beginPath()
      ctx.arc(0, 0, R, 0, TAU)
      ctx.fillStyle = body
      ctx.fill()

      // grooves — a coarse field, spaced so they stay distinct at this size
      ctx.save()
      ctx.rotate(spin)
      const step = Math.max(2.6 * dpr, R * 0.052)
      let band = 0
      for (let r = R * 0.46; r < R * 0.97; r += step) {
        ctx.beginPath()
        ctx.arc(0, 0, r, 0, TAU)
        ctx.strokeStyle =
          band % 4 === 0 ? 'rgba(255,255,255,0.085)' : 'rgba(255,255,255,0.038)'
        ctx.lineWidth = dpr
        ctx.stroke()
        band += 1
      }
      // the sheen turns with the grooves, which is what sells the rotation
      const streak = ctx.createLinearGradient(-R, -R * 0.55, R, R * 0.55)
      streak.addColorStop(0, 'rgba(255,255,255,0)')
      streak.addColorStop(0.44, 'rgba(255,255,255,0.04)')
      streak.addColorStop(0.5, 'rgba(255,255,255,0.115)')
      streak.addColorStop(0.56, 'rgba(255,255,255,0.04)')
      streak.addColorStop(1, 'rgba(255,255,255,0)')
      ctx.beginPath()
      ctx.arc(0, 0, R * 0.99, 0, TAU)
      ctx.fillStyle = streak
      ctx.fill()
      ctx.restore()

      // rim
      ctx.beginPath()
      ctx.arc(0, 0, R - dpr * 0.5, 0, TAU)
      ctx.strokeStyle = 'rgba(255,255,255,0.14)'
      ctx.lineWidth = dpr
      ctx.stroke()

      // label — the authored colour is the base, and stays the whole label when
      // there is no art: nothing is playing, or a real cover has not arrived yet.
      const cr = Math.round(rgb[0])
      const cg = Math.round(rgb[1])
      const cb = Math.round(rgb[2])
      ctx.beginPath()
      ctx.arc(0, 0, LR, 0, TAU)
      ctx.fillStyle = `rgb(${cr},${cg},${cb})`
      ctx.fill()

      /**
       * The cover, clipped to the label and turning with the record.
       *
       * Inside its own save/restore with the rotation applied, so the artwork
       * turns with the disc the way a real label does — drawing it outside the
       * rotation would leave a still picture on a spinning record, which is the
       * one thing that would make the whole object read as fake.
       *
       * The canvas is knowingly tainted by this: the image is cross-origin from
       * Spotify's CDN and `crossOrigin` is deliberately NOT set, because
       * requesting CORS would fail closed if the CDN ever stopped sending the
       * header, and nothing here reads pixels back — there is no getImageData
       * in this component, so tainting costs nothing.
       */
      const cover = artRef.current
      if (cover) {
        ctx.save()
        ctx.beginPath()
        ctx.arc(0, 0, LR, 0, TAU)
        ctx.clip()
        ctx.rotate(spin)
        // cover-fit, cropped from the centre
        const iw = cover.naturalWidth
        const ih = cover.naturalHeight
        if (iw && ih) {
          const side = LR * 2
          const sc = Math.max(side / iw, side / ih)
          const dw = iw * sc
          const dh = ih * sc
          ctx.drawImage(cover, -dw / 2, -dh / 2, dw, dh)
        }
        ctx.restore()
      }

      // The sheen is a highlight on paper, and paper is what it should read as.
      // Over a photograph it is just a white wash across the middle of the cover
      // and a dark ring around it, so it halves when there is art underneath.
      const paperLit = cover ? 0.08 : 0.16
      const paperEdge = cover ? 0.07 : 0.13
      const paper = ctx.createRadialGradient(-LR * 0.3, -LR * 0.34, LR * 0.05, 0, 0, LR)
      paper.addColorStop(0, `rgba(255,255,255,${paperLit})`)
      paper.addColorStop(0.7, 'rgba(255,255,255,0)')
      paper.addColorStop(1, `rgba(0,0,0,${paperEdge})`)
      ctx.beginPath()
      ctx.arc(0, 0, LR, 0, TAU)
      ctx.fillStyle = paper
      ctx.fill()
      ctx.beginPath()
      ctx.arc(0, 0, LR, 0, TAU)
      ctx.strokeStyle = 'rgba(0,0,0,0.22)'
      ctx.lineWidth = dpr
      ctx.stroke()

      // spindle
      ctx.beginPath()
      ctx.arc(0, 0, R * 0.035, 0, TAU)
      ctx.fillStyle = themeRef.current.bg
      ctx.fill()
      ctx.strokeStyle = 'rgba(0,0,0,0.26)'
      ctx.lineWidth = dpr
      ctx.stroke()

      ctx.restore()

      /**
       * The tonearm, tracking inward as the track plays.
       *
       * The stylus sits on a radius that runs from the lead-in at the rim to
       * the run-out groove beside the label, and the arm is then SOLVED to
       * reach it — law of cosines against the fixed pivot — rather than having
       * both ends interpolated independently. Interpolating the tip is the
       * obvious shortcut and it looks wrong immediately: the arm changes length
       * as it sweeps, which no tonearm does.
       *
       * `armEase` lags the raw position slightly so a poll that re-syncs by a
       * couple of seconds glides rather than jumping.
       */
      const stylusR = R * (0.92 - 0.46 * armEase)
      const pvx = cx + R * 1.02
      const pvy = cy - R * 0.94
      const armLen = R * 1.30
      const pc = Math.hypot(cx - pvx, cy - pvy)
      const basePhi = Math.atan2(cy - pvy, cx - pvx)
      const cosD = Math.max(
        -1,
        Math.min(1, (armLen * armLen + pc * pc - stylusR * stylusR) / (2 * armLen * pc))
      )
      const phi = basePhi - Math.acos(cosD)
      const tipx = pvx + Math.cos(phi) * armLen
      const tipy = pvy + Math.sin(phi) * armLen
      ctx.lineCap = 'round'
      ctx.strokeStyle = 'rgba(12,14,18,0.13)'
      ctx.lineWidth = 3.2 * dpr
      ctx.beginPath()
      ctx.moveTo(pvx + 1.5 * dpr, pvy + 3.5 * dpr)
      ctx.lineTo(tipx + 1.5 * dpr, tipy + 3.5 * dpr)
      ctx.stroke()
      ctx.strokeStyle = '#b4b8bf'
      ctx.lineWidth = 2.6 * dpr
      ctx.beginPath()
      ctx.moveTo(pvx, pvy)
      ctx.lineTo(tipx, tipy)
      ctx.stroke()
      // pivot
      ctx.beginPath()
      ctx.arc(pvx, pvy, 5.2 * dpr, 0, TAU)
      ctx.fillStyle = '#c6c9cf'
      ctx.fill()
      ctx.strokeStyle = 'rgba(20,22,26,0.3)'
      ctx.lineWidth = dpr
      ctx.stroke()
      // headshell
      ctx.beginPath()
      ctx.arc(tipx, tipy, 2.6 * dpr, 0, TAU)
      ctx.fillStyle = '#20232a'
      ctx.fill()
    }

    // Wiring happens last: `build` paints immediately and both `build` and
    // `tick` close over `draw`, which is only initialised at the end of this
    // effect body. Calling any of them above this line would hit its dead zone.
    // `artLoaded` is in the dependency list, so a cover arriving while the loop
    // is parked still reaches the canvas through this one paint.
    repaintRef.current = () => draw(performance.now())

    const sizer = new ResizeObserver(build)
    sizer.observe(canvas)
    build()
    observer.observe(canvas)
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      repaintRef.current = null
      alive = false
      running = false
      sizer.disconnect()
      observer.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
      cancelAnimationFrame(raf)
    }
    // `index` is read through targetRef inside the loop; it is listed only so the
    // initial colour matches when the component mounts mid-rotation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced, artLoaded])

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <canvas ref={canvasRef} aria-hidden className="block h-full w-full" />
    </div>
  )
}

'use client'

import { useEffect, useRef, type CSSProperties } from 'react'

import { useThemeColors } from '@/lib/useThemeColors'
import { COLORS_DARK } from '@/styles/tokens'
import { FULLSCREEN_VS, loadFace, makeProgram, uploadCanvas } from './shared'

/**
 * The impasto engine, on its own: the name painted thick in oil on primed
 * linen, under a raking lamp that follows the pointer. ImpastoHero is this,
 * full screen and paintable; the CRT and the Mac use it as the name beside the
 * object, read-only.
 *
 * The paint is real geometry as far as the light is concerned. Every brush
 * stroke is laid twice, into a colour map and a height map, bristle by
 * bristle: grooves where the hairs dragged, ridges where paint was pushed
 * aside, a lump where the brush lifted. Strokes follow the letterforms (the
 * flow field is the gradient of the blurred glyph mask, turned 90°), so the
 * brushwork runs down stems and around bowls the way a hand would paint it.
 *
 * The shader lights that height field from a point lamp held low over the
 * canvas at the pointer: relief Lambert for the body, a tight Blinn highlight
 * for the oil's wet sheen, and a short ray-march across the height map toward
 * the lamp so every ridge throws a shadow. Bare canvas renders exactly the
 * page colour, so the layer can sit under anything.
 */

export type Box = { x: number; y: number; w: number; h: number }
export type NameLayout = {
  lines: string[]
  box: Box
  align: 'left' | 'center'
  /** Baseline to baseline, in em. Stacked lines need ~1.04 or a descender meets the ascender below. */
  lh?: number
  /** Per line: paint it mostly blue, or mostly ink. */
  tint?: Array<'blue' | 'ink'>
}

/**
 * Fit lines of display type into a box: as large as the box allows, block
 * centred vertically. Shared by the painted name and the typeset one so the two
 * land on exactly the same baselines.
 */
export function fitLines(ctx: CanvasRenderingContext2D, face: string, lines: string[], box: Box, lh = 0.84) {
  ctx.font = `400 100px ${face}`
  const widest = Math.max(...lines.map((l) => ctx.measureText(l).width)) / 100
  const ASC = 0.74
  const DESC = 0.24
  const LH = lh
  let size = box.w / widest
  const blockEm = ASC + LH * (lines.length - 1) + DESC
  if (size * blockEm > box.h) size = box.h / blockEm
  const top = box.y + (box.h - size * blockEm) / 2
  const baselines = lines.map((_, i) => top + size * (ASC + LH * i))
  return { size, baselines, top, bottom: top + size * blockEm, width: widest * size }
}

const FS = `
precision highp float;
varying vec2 v_uv;
uniform sampler2D u_height;
uniform sampler2D u_color;
uniform vec2 u_res;
uniform vec3 u_light;
uniform vec3 u_ground;
uniform float u_dark;
// 1: the whole canvas is primed linen (the standalone painting). 0: only the
// paint sits on linen, and bare canvas is the page itself
uniform float u_linenAll;

float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
}
// primed linen: warp and weft threads, over-under, slubby and uneven, mostly
// buried under the gesso so it only shows when the light rakes across it
float weave(vec2 p) {
  float f = 1.05;
  float slub = noise(p * vec2(0.03, 0.4)) * 0.8;
  float warp = 0.5 + 0.5 * cos(p.x * f + slub);
  float weft = 0.5 + 0.5 * cos(p.y * f * 0.97 + noise(p * vec2(0.4, 0.03)) * 0.8);
  float over = step(0.5, fract((floor(p.x * f / 6.2832) + floor(p.y * f / 6.2832)) * 0.5));
  return mix(warp * 0.6 + weft * 0.4, weft * 0.6 + warp * 0.4, over);
}
// how much linen is under this texel
float linen(vec2 p) { return u_linenAll > 0.5 ? 1.0 : texture2D(u_color, p / u_res).a; }
float paintH(vec2 px) { return texture2D(u_height, px / u_res).r; }
// the weave only shows where paint is thin: thick paint buries it
float H(vec2 px) { float ph = paintH(px); return ph * 14.0 + weave(px) * 0.22 * linen(px) * (1.0 - smoothstep(0.0, 0.25, ph)); }

void main() {
  vec2 p = v_uv * u_res;
  vec4 paint = texture2D(u_color, v_uv);
  float h0 = H(p);

  // normal from the height field
  float e = 1.0;
  vec3 N = normalize(vec3(H(p - vec2(e, 0.0)) - H(p + vec2(e, 0.0)), H(p - vec2(0.0, e)) - H(p + vec2(0.0, e)), 2.0 * e));

  vec3 Lv = vec3(u_light.xy - p, u_light.z);
  float dist = length(Lv);
  vec3 L = Lv / dist;

  // short march toward the lamp: anything taller on the way shades us
  float shade = 1.0;
  vec2 dir = normalize(Lv.xy + 1e-4);
  float rise = L.z / max(length(L.xy), 1e-3);
  for (int i = 1; i <= 14; i++) {
    float s = float(i) * 2.2;
    float hh = H(p + dir * s);
    float need = h0 + rise * s;
    shade = min(shade, clamp(1.0 - (hh - need) * 0.6, 0.0, 1.0));
  }
  shade = mix(u_dark > 0.5 ? 0.5 : 0.62, 1.0, shade);

  // relief lighting: shade by how much a texel faces the lamp MORE or LESS
  // than flat canvas would, so bare gesso stays exactly the page colour and
  // only the paint and the weave pick up light and shadow
  float diff = dot(N, L);
  float relief = diff - L.z;
  float fall = 1.0 / (1.0 + pow(dist / (0.7 * max(u_res.x, u_res.y)), 2.0));
  vec3 Hh = normalize(L + vec3(0.0, 0.0, 1.0));
  float spec = pow(max(dot(N, Hh), 0.0), 80.0);

  vec3 albedo = mix(u_ground, paint.rgb, paint.a);
  float lightK = mix(1.1, u_dark > 0.5 ? 1.15 : 1.6, paint.a);
  vec3 col = albedo * clamp(1.0 + lightK * relief * (0.5 + 0.5 * fall), 0.45, 1.5) * shade;
  // the wet sheen reads on dark paint and light paint alike
  col += spec * shade * fall * paint.a * (u_dark > 0.5 ? 0.35 : 0.55);
  // the dither goes with the linen: off it, bare canvas is the page colour exactly
  col += (hash(p + fract(u_light.x)) - 0.5) * 0.012 * linen(p);
  gl_FragColor = vec4(col, 1.0);
}`


type Stroke = { pts: number[]; w: number; c: number; seed: number }

/** Seeded PRNG so a theme change repaints the exact same brushwork. */
function mulberry(a: number) {
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export default function ImpastoCanvas({
  layout,
  paintable = false,
  lampHeight = 0.16,
  linen = 'full',
  className,
  style,
}: {
  /** Where the name goes, in css px of the canvas, recomputed on every resize. */
  layout: (W: number, H: number) => NameLayout
  paintable?: boolean
  /** How high the lamp hangs, as a fraction of the canvas's long side. Lower rakes harder. */
  lampHeight?: number
  /**
   * Where the weave shows. 'full' is a whole primed canvas, for the standalone
   * painting. 'paint' keeps it under the paint only, so bare canvas is exactly
   * the page: for a layer whose edge meets plain page, where whole-canvas linen
   * ends in a visible line (and a fading patch of it reads as a grey smudge).
   */
  linen?: 'full' | 'paint'
  className?: string
  style?: CSSProperties
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const theme = useThemeColors()
  const themeRef = useRef(theme)
  const repaintRef = useRef<() => void>(() => {})
  const layoutRef = useRef(layout)
  const linenRef = useRef(linen)
  themeRef.current = theme
  layoutRef.current = layout
  linenRef.current = linen

  useEffect(() => {
    repaintRef.current()
  }, [theme])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const gl = canvas.getContext('webgl', { antialias: false })
    if (!gl) return
    const prog = makeProgram(gl, FULLSCREEN_VS, FS)
    if (!prog) return
    gl.useProgram(prog)
    const U = (n: string) => gl.getUniformLocation(prog, n)
    const uRes = U('u_res'), uLight = U('u_light'), uGround = U('u_ground'), uDark = U('u_dark')
    gl.uniform1f(U('u_linenAll'), linenRef.current === 'full' ? 1 : 0)
    gl.uniform1i(U('u_height'), 0)
    gl.uniform1i(U('u_color'), 1)
    const texH = gl.createTexture()!, texC = gl.createTexture()!
    const cH = document.createElement('canvas')
    const cC = document.createElement('canvas')

    const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let disposed = false
    let Wc = 0, Hc = 0, W = 0, Hp = 0
    let face = ''
    let nameStrokes: Stroke[] = []
    let ragged: HTMLCanvasElement | null = null
    let lampBox: { x: number; y: number; w: number; h: number } | null = null
    // which line a point belongs to, for per-line colour
    let lineSplits: number[] = []
    let lineTints: Array<'blue' | 'ink'> = []
    const lineAt = (y: number) => {
      let i = 0
      while (i < lineSplits.length && y > lineSplits[i]) i++
      return i
    }
    const userStrokes: Stroke[] = []

    // ── palettes: blue-black and ultramarine on white gesso, inverted on black
    const palette = () => {
      const dark = themeRef.current.bg === COLORS_DARK.bg
      return dark
        ? { ground: [17 / 255, 19 / 255, 21 / 255], paints: ['#e9e7e0', '#d7dce6', '#f4f1e8', '#6b93ff', '#aebbe0', '#4f7bff', '#9db8ff'] }
        : { ground: [1, 1, 1], paints: ['#15171d', '#1c2440', '#0f1116', '#2f6bff', '#34446e', '#1f4fd8', '#5b88ff'] }
    }
    /** Which paint a stroke takes: mostly the dark body colour, some blue. */
    const pick = (r: number) => (r < 0.42 ? 0 : r < 0.68 ? 1 : r < 0.82 ? 2 : r < 0.93 ? 4 : 3)
    /** A blue line: ultramarine body, accent and pale-blue strokes, a little navy for depth. */
    const pickBlue = (r: number) => (r < 0.34 ? 5 : r < 0.62 ? 3 : r < 0.78 ? 6 : r < 0.92 ? 1 : 4)

    const shade = (hex: string, k: number) => {
      const n = parseInt(hex.slice(1), 16)
      const f = (v: number) => Math.max(0, Math.min(255, Math.round(v * k)))
      return `rgb(${f((n >> 16) & 255)},${f((n >> 8) & 255)},${f(n & 255)})`
    }

    /** Lay one stroke into the colour and height maps, bristle by bristle. */
    const lay = (s: Stroke, cx: CanvasRenderingContext2D, hx: CanvasRenderingContext2D) => {
      const rnd = mulberry(s.seed)
      const pts = s.pts
      const n = pts.length / 2
      if (n < 2) return
      const paints = palette().paints
      const base = paints[s.c]
      const B = Math.max(6, Math.round(s.w / 2.2))
      // normals along the path
      const nx: number[] = [], ny: number[] = []
      for (let i = 0; i < n; i++) {
        const a = Math.max(0, i - 1), b = Math.min(n - 1, i + 1)
        const dx = pts[b * 2] - pts[a * 2], dy = pts[b * 2 + 1] - pts[a * 2 + 1]
        const l = Math.hypot(dx, dy) || 1
        nx.push(-dy / l)
        ny.push(dx / l)
      }
      cx.lineCap = hx.lineCap = 'round'
      cx.lineJoin = hx.lineJoin = 'round'
      // the body of the stroke: a plateau of paint
      hx.strokeStyle = 'rgb(120,120,120)'
      hx.lineWidth = s.w * 0.9
      cx.strokeStyle = base
      cx.lineWidth = s.w * 0.86
      for (const x of [cx, hx]) {
        x.beginPath()
        for (let i = 0; i < n; i++) (i ? x.lineTo : x.moveTo).call(x, pts[i * 2], pts[i * 2 + 1])
        x.stroke()
      }
      // bristles: each one a slightly different value, height and length
      for (let b = 0; b < B; b++) {
        const o = (b / (B - 1) - 0.5) * s.w
        const edge = Math.abs(o) / (s.w / 2)
        const run = 1 - rnd() * 0.35 * (0.4 + edge) // outer hairs run dry first
        const end = Math.max(2, Math.floor(n * run))
        const g = 0.82 + rnd() * 0.36
        // ridges at the edges where paint is shoved aside, grooves between hairs
        const hv = Math.round(100 + rnd() * 70 + edge * edge * 70)
        hx.strokeStyle = `rgb(${hv},${hv},${hv})`
        hx.lineWidth = (s.w / B) * (0.7 + rnd() * 0.6)
        cx.strokeStyle = shade(base, g)
        cx.lineWidth = (s.w / B) * (0.8 + rnd() * 0.5)
        cx.globalAlpha = 0.55 + rnd() * 0.45
        for (const x of [cx, hx]) {
          x.beginPath()
          for (let i = 0; i < end; i++) {
            const px = pts[i * 2] + nx[i] * o, py = pts[i * 2 + 1] + ny[i] * o
            if (i) x.lineTo(px, py)
            else x.moveTo(px, py)
          }
          x.stroke()
        }
        cx.globalAlpha = 1
      }
      // the lump where the brush lifted off
      const lx = pts[(n - 1) * 2], ly = pts[(n - 1) * 2 + 1]
      const lump = hx.createRadialGradient(lx, ly, 0, lx, ly, s.w * 0.4)
      lump.addColorStop(0, 'rgba(200,200,200,0.55)')
      lump.addColorStop(1, 'rgba(200,200,200,0)')
      hx.fillStyle = lump
      hx.beginPath()
      hx.arc(lx, ly, s.w * 0.4, 0, Math.PI * 2)
      hx.fill()
    }

    /** Plan the brushwork for the name: strokes that follow the letterforms. */
    const plan = () => {
      const mask = document.createElement('canvas')
      mask.width = W
      mask.height = Hp
      const m = mask.getContext('2d', { willReadFrequently: true })!
      const L = layoutRef.current(Wc, Hc)
      const box = { x: L.box.x * dpr, y: L.box.y * dpr, w: L.box.w * dpr, h: L.box.h * dpr }
      const fit = fitLines(m, face, L.lines, box, L.lh)
      lineSplits = fit.baselines.slice(0, -1).map((b, i) => (b + fit.baselines[i + 1]) / 2 - fit.size * 0.3)
      lineTints = L.tint ?? L.lines.map(() => 'ink' as const)
      m.font = `400 ${fit.size}px ${face}`
      m.textAlign = L.align
      m.textBaseline = 'alphabetic'
      m.fillStyle = '#000'
      m.strokeStyle = '#000'
      m.lineJoin = 'round'
      // fatten the serif: oil does not hold a hairline
      m.lineWidth = fit.size * 0.05
      const ax = L.align === 'left' ? box.x + fit.size * 0.03 : box.x + box.w / 2
      L.lines.forEach((text, i) => {
        m.strokeText(text, ax, fit.baselines[i])
        m.fillText(text, ax, fit.baselines[i])
      })
      lampBox = { x: box.x, y: fit.top, w: Math.min(box.w, fit.width), h: fit.bottom - fit.top }
      // ragged edges: blur the glyphs a touch and threshold against noise, so
      // the letters keep their shape but end the way paint ends
      const soft0 = document.createElement('canvas')
      soft0.width = W
      soft0.height = Hp
      const s0 = soft0.getContext('2d', { willReadFrequently: true })!
      s0.filter = `blur(${Math.max(1, Math.round(fit.size * 0.012))}px)`
      s0.drawImage(mask, 0, 0)
      const sd = s0.getImageData(0, 0, W, Hp)
      const nr = mulberry(3)
      const cell = Math.max(3, Math.round(fit.size * 0.02))
      const gw = Math.ceil(W / cell) + 1
      const grid = new Float32Array(gw * (Math.ceil(Hp / cell) + 1)).map(() => nr())
      for (let y = 0; y < Hp; y++) {
        for (let x = 0; x < W; x++) {
          const i = (y * W + x) * 4 + 3
          const gx = x / cell, gy = y / cell
          const x0 = gx | 0, y0 = gy | 0, fx = gx - x0, fy = gy - y0
          const nz =
            grid[y0 * gw + x0] * (1 - fx) * (1 - fy) + grid[y0 * gw + x0 + 1] * fx * (1 - fy) +
            grid[(y0 + 1) * gw + x0] * (1 - fx) * fy + grid[(y0 + 1) * gw + x0 + 1] * fx * fy
          sd.data[i] = sd.data[i] > 70 + nz * 110 ? 255 : 0
        }
      }
      s0.filter = 'none'
      s0.putImageData(sd, 0, 0)
      ragged = soft0
      const inside = sd.data
      // a blurred copy gives the flow field
      const blur = document.createElement('canvas')
      blur.width = W
      blur.height = Hp
      const bx = blur.getContext('2d', { willReadFrequently: true })!
      bx.filter = `blur(${Math.round(fit.size * 0.035)}px)`
      bx.drawImage(mask, 0, 0)
      const soft = bx.getImageData(0, 0, W, Hp).data
      const A = (x: number, y: number, d: Uint8ClampedArray) => {
        const xi = Math.max(0, Math.min(W - 1, x | 0)), yi = Math.max(0, Math.min(Hp - 1, y | 0))
        return d[(yi * W + xi) * 4 + 3]
      }
      const rnd = mulberry(7)
      // about a stem wide, so a letter is two or three passes of the brush
      const brush = Math.max(10, fit.size * 0.1)
      const strokes: Stroke[] = []
      let coverage = 0
      for (let i = 0; i < inside.length; i += 16) if (inside[i + 3] > 128) coverage += 4
      const count = Math.min(1400, Math.round((coverage / (brush * brush * 3)) * 2.4))
      for (let tries = 0; strokes.length < count && tries < count * 30; tries++) {
        let x = rnd() * W, y = rnd() * Hp
        if (A(x, y, inside) < 128) continue
        const pts: number[] = [x, y]
        const len = brush * (1.8 + rnd() * 2.4)
        const step = Math.max(2, brush * 0.18)
        let px = 0, py = -1
        for (let t = 0; t < len; t += step) {
          // along the letter: perpendicular to the gradient of the soft mask
          const gx = A(x + 3, y, soft) - A(x - 3, y, soft)
          const gy = A(x, y + 3, soft) - A(x, y - 3, soft)
          let tx = -gy, ty = gx
          const tl = Math.hypot(tx, ty)
          if (tl < 4) {
            tx = px
            ty = py // deep inside a thick stroke: carry on as before
          } else {
            tx /= tl
            ty /= tl
          }
          if (tx * px + ty * py < 0) {
            tx = -tx
            ty = -ty
          }
          px = tx * 0.7 + px * 0.3
          py = ty * 0.7 + py * 0.3
          x += px * step
          y += py * step
          if (A(x, y, inside) < 40 && pts.length > 4) break
          pts.push(x, y)
        }
        if (pts.length < 6) continue
        const blue = lineTints[lineAt(pts[1])] === 'blue'
        strokes.push({ pts, w: brush * (0.75 + rnd() * 0.5), c: blue ? pickBlue(rnd()) : pick(rnd()), seed: (rnd() * 1e9) | 0 })
      }
      nameStrokes = strokes
    }

    const repaint = () => {
      if (!W || !face) return
      cH.width = cC.width = W
      cH.height = cC.height = Hp
      const hx = cH.getContext('2d')!
      const cx = cC.getContext('2d')!
      hx.fillStyle = '#000'
      hx.fillRect(0, 0, W, Hp)
      cx.clearRect(0, 0, W, Hp)
      if (ragged) {
        // the name on its own layers: a base coat, then brushwork, both cut to
        // the ragged letterforms, then composited onto the canvas
        const nc = document.createElement('canvas'), nh = document.createElement('canvas')
        nc.width = nh.width = W
        nc.height = nh.height = Hp
        const ncx = nc.getContext('2d')!, nhx = nh.getContext('2d')!
        // the base coat, per line: ultramarine under a blue line, ink under the rest
        const paints = palette().paints
        const edges = [0, ...lineSplits, Hp]
        for (let i = 0; i < edges.length - 1; i++) {
          ncx.fillStyle = lineTints[i] === 'blue' ? paints[5] : paints[0]
          ncx.fillRect(0, edges[i], W, edges[i + 1] - edges[i])
        }
        nhx.fillStyle = 'rgb(105,105,105)'
        nhx.fillRect(0, 0, W, Hp)
        for (const s of nameStrokes) lay(s, ncx, nhx)
        for (const x of [ncx, nhx]) {
          x.globalCompositeOperation = 'destination-in'
          x.drawImage(ragged, 0, 0)
          x.globalCompositeOperation = 'source-over'
        }
        cx.drawImage(nc, 0, 0)
        hx.drawImage(nh, 0, 0)
      }
      for (const s of userStrokes) lay(s, cx, hx)
      uploadCanvas(gl, texH, cH)
      uploadCanvas(gl, texC, cC)
    }
    repaintRef.current = repaint

    const resize = () => {
      Wc = canvas.clientWidth
      Hc = canvas.clientHeight
      W = canvas.width = Math.round(Wc * dpr)
      Hp = canvas.height = Math.round(Hc * dpr)
      gl.viewport(0, 0, W, Hp)
      // Laid out at zero size (a hidden tab, a parent mid-mount): planning would
      // throw on a 0×0 canvas, and on first load that throw landed before the
      // frame loop started, so the name never drew at all. The observer calls
      // back once there is a size.
      if (!face || !W || !Hp) return
      userStrokes.length = 0
      plan()
      repaint()
    }

    // ── the lamp and the brush ───────────────────────────────────────────
    let lx = 0, ly = 0, ltx = 0, lty = 0
    let lastPointer = -1e9
    let painting: Stroke | null = null
    let dirty = false
    let strokeNo = 0
    const local = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect()
      return [(e.clientX - r.left) * dpr, (e.clientY - r.top) * dpr] as const
    }
    const onMove = (e: PointerEvent) => {
      const [x, y] = local(e)
      ltx = x
      lty = y
      lastPointer = performance.now()
      if (!painting) return
      const p = painting.pts
      const dx = x - p[p.length - 2], dy = y - p[p.length - 1]
      if (dx * dx + dy * dy < 9 * dpr * dpr) return
      p.push(x, y)
      // re-lay just this stroke on top: cheap, and paint over paint is what happens anyway
      lay({ ...painting, pts: p.slice(-8) }, cC.getContext('2d')!, cH.getContext('2d')!)
      dirty = true
    }
    const onDown = (e: PointerEvent) => {
      if (!paintable) return
      const [x, y] = local(e)
      canvas.setPointerCapture(e.pointerId)
      strokeNo++
      const c = [3, 0, 4, 1][strokeNo % 4]
      painting = { pts: [x, y], w: Math.min(Wc, Hc) * 0.035 * dpr, c, seed: (Math.random() * 1e9) | 0 }
    }
    const onUp = () => {
      if (painting && painting.pts.length > 2) {
        userStrokes.push(painting)
        // re-lay it whole so the bristles run the full length and the lump lands at the end
        lay(painting, cC.getContext('2d')!, cH.getContext('2d')!)
        dirty = true
      }
      painting = null
    }
    // the lamp listens to the whole page: in a composed hero this canvas sits
    // underneath other layers and never sees the pointer itself
    window.addEventListener('pointermove', onMove, { passive: true })
    canvas.addEventListener('pointerdown', onDown)
    canvas.addEventListener('pointerup', onUp)
    canvas.addEventListener('pointercancel', onUp)
    const ro = new ResizeObserver(() => resize())
    ro.observe(canvas)
    // off screen (the page scrolled on past it), nothing is drawn: the lamp's
    // sweep is not worth a frame the page could be scrolling with
    let visible = true
    const io = new IntersectionObserver(([en]) => {
      visible = en.isIntersecting
    })
    io.observe(canvas)

    let raf = 0
    let last = performance.now()
    const t0 = last
    const frame = (now: number) => {
      if (disposed) return
      raf = requestAnimationFrame(frame)
      if (!W || !visible) return
      if (dirty) {
        uploadCanvas(gl, texH, cH)
        uploadCanvas(gl, texC, cC)
        dirty = false
      }
      const t = (now - t0) / 1000
      if (now - lastPointer > 2500) {
        // the gallery lamp sweeps on its own, low and from the upper left
        const w = reduced ? 1.2 : t * 0.28
        // ...over the name, wherever the name is
        const b = lampBox ?? { x: 0, y: 0, w: W, h: Hp }
        ltx = b.x + b.w * (0.5 + 0.5 * Math.sin(w))
        lty = b.y - b.h * 0.15 + b.h * 0.5 * (0.5 + 0.5 * Math.cos(w * 1.3))
      }
      let acc = Math.min(0.5, (now - last) / 1000)
      last = now
      while (acc > 1e-4) {
        const h = Math.min(1 / 120, acc)
        const k = 1 - Math.exp(-h * 9)
        lx += (ltx - lx) * k
        ly += (lty - ly) * k
        acc -= h
      }
      const g = palette().ground
      gl.uniform2f(uRes, W, Hp)
      // GL is bottom-up; the lamp hangs ~ a fifth of the screen above the canvas
      gl.uniform3f(uLight, lx, Hp - ly, Math.max(W, Hp) * lampHeight)
      gl.uniform3f(uGround, g[0], g[1], g[2])
      gl.uniform1f(uDark, themeRef.current.bg === COLORS_DARK.bg ? 1 : 0)
      gl.activeTexture(gl.TEXTURE0)
      gl.bindTexture(gl.TEXTURE_2D, texH)
      gl.activeTexture(gl.TEXTURE1)
      gl.bindTexture(gl.TEXTURE_2D, texC)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
    }

    void loadFace('display').then((f) => {
      if (disposed) return
      face = f
      resize()
      lx = ltx = (lampBox?.x ?? 0) + (lampBox?.w ?? W) * 0.2
      ly = lty = (lampBox?.y ?? Hp * 0.3) - 20
      raf = requestAnimationFrame(frame)
    })

    return () => {
      disposed = true
      repaintRef.current = () => {}
      cancelAnimationFrame(raf)
      window.removeEventListener('pointermove', onMove)
      canvas.removeEventListener('pointerdown', onDown)
      canvas.removeEventListener('pointerup', onUp)
      canvas.removeEventListener('pointercancel', onUp)
      ro.disconnect()
      io.disconnect()
      gl.deleteTexture(texH)
      gl.deleteTexture(texC)
    }
  }, [])

  return <canvas ref={canvasRef} aria-hidden className={className} style={style} />
}

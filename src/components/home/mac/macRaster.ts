import { NAME } from './shared'

/**
 * The Classic's one-bit library: the framebuffer and its raster ops, a
 * hand-drawn 10px system font, sprites and icons (flood-filled from their
 * outlines), 8×8 fill patterns, Atkinson dithering for photographs, and the
 * site's display face rasterised and thresholded to one bit. No three.js and
 * no DOM beyond scratch canvases: MacHero and its desk accessories draw with it.
 */

/** The screen, in logical pixels. */
export const SW = 512
export const SH = 342

// ── one bit ───────────────────────────────────────────────────────────────
/**
 * The system font: 10 rows, caps on rows 1–7, x-height 3–7, descenders 8–9.
 * Each block is one row per line, glyphs separated by bars.
 */
export const FONT_SRC: [string, string][] = [
  [
    'abcdefghijklm',
    `
....|#...|...|...#|....|.##|....|#...|.|..|#...|#|.....
....|#...|...|...#|....|.#.|....|#...|#|.#|#...|#|.....
....|#...|...|...#|....|.#.|....|#...|.|..|#...|#|.....
.##.|###.|.##|.###|.##.|###|.###|###.|#|.#|#..#|#|####.
...#|#..#|#..|#..#|#..#|.#.|#..#|#..#|#|.#|#.#.|#|#.#.#
.###|#..#|#..|#..#|####|.#.|#..#|#..#|#|.#|##..|#|#.#.#
#..#|#..#|#..|#..#|#...|.#.|#..#|#..#|#|.#|#.#.|#|#.#.#
.###|###.|.##|.###|.###|.#.|.###|#..#|#|.#|#..#|#|#.#.#
....|....|...|....|....|...|...#|....|.|.#|....|.|.....
....|....|...|....|....|...|###.|....|.|#.|....|.|.....`,
  ],
  [
    'nopqrstuvwxyz',
    `
....|....|....|....|....|....|...|....|.....|.....|...|....|....
....|....|....|....|....|....|.#.|....|.....|.....|...|....|....
....|....|....|....|....|....|.#.|....|.....|.....|...|....|....
###.|.##.|###.|.###|#.##|.###|###|#..#|#...#|#...#|#.#|#..#|####
#..#|#..#|#..#|#..#|##..|#...|.#.|#..#|#...#|#...#|#.#|#..#|...#
#..#|#..#|#..#|#..#|#...|.##.|.#.|#..#|.#.#.|#.#.#|.#.|#..#|.##.
#..#|#..#|#..#|#..#|#...|...#|.#.|#..#|.#.#.|#.#.#|#.#|#..#|#...
#..#|.##.|###.|.###|#...|###.|..#|.###|..#..|.#.#.|#.#|.###|####
....|....|#...|...#|....|....|...|....|.....|.....|...|...#|....
....|....|#...|...#|....|....|...|....|.....|.....|...|.##.|....`,
  ],
  [
    'ABCDEFGHIJKLM',
    `
.....|.....|.....|.....|....|....|.....|.....|...|....|.....|....|.....
.###.|####.|.###.|####.|####|####|.###.|#...#|###|...#|#...#|#...|#...#
#...#|#...#|#...#|#...#|#...|#...|#...#|#...#|.#.|...#|#..#.|#...|##.##
#...#|#...#|#....|#...#|#...|#...|#....|#...#|.#.|...#|#.#..|#...|#.#.#
#####|####.|#....|#...#|###.|###.|#.###|#####|.#.|...#|##...|#...|#.#.#
#...#|#...#|#....|#...#|#...|#...|#...#|#...#|.#.|...#|#.#..|#...|#...#
#...#|#...#|#...#|#...#|#...|#...|#...#|#...#|.#.|#..#|#..#.|#...|#...#
#...#|####.|.###.|####.|####|#...|.###.|#...#|###|.##.|#...#|####|#...#
.....|.....|.....|.....|....|....|.....|.....|...|....|.....|....|.....
.....|.....|.....|.....|....|....|.....|.....|...|....|.....|....|.....`,
  ],
  [
    'NOPQRSTUVWXYZ',
    `
.....|.....|.....|.....|.....|.....|.....|.....|.....|.....|.....|.....|.....
#...#|.###.|####.|.###.|####.|.###.|#####|#...#|#...#|#...#|#...#|#...#|#####
##..#|#...#|#...#|#...#|#...#|#...#|..#..|#...#|#...#|#...#|#...#|#...#|....#
##..#|#...#|#...#|#...#|#...#|#....|..#..|#...#|#...#|#...#|.#.#.|.#.#.|...#.
#.#.#|#...#|####.|#...#|####.|.###.|..#..|#...#|.#.#.|#.#.#|..#..|..#..|..#..
#..##|#...#|#....|#.#.#|#.#..|....#|..#..|#...#|.#.#.|#.#.#|.#.#.|..#..|.#...
#..##|#...#|#....|#..#.|#..#.|#...#|..#..|#...#|..#..|##.##|#...#|..#..|#....
#...#|.###.|#....|.##.#|#...#|.###.|..#..|.###.|..#..|#...#|#...#|..#..|#####
.....|.....|.....|.....|.....|.....|.....|.....|.....|.....|.....|.....|.....
.....|.....|.....|.....|.....|.....|.....|.....|.....|.....|.....|.....|.....`,
  ],
  [
    '0123456789',
    `
....|...|....|....|....|....|....|....|....|....
.##.|.#.|.##.|###.|..#.|####|.##.|####|.##.|.##.
#..#|##.|#..#|...#|.##.|#...|#...|...#|#..#|#..#
#..#|.#.|...#|...#|#.#.|###.|#...|..#.|#..#|#..#
#..#|.#.|..#.|.##.|#.#.|...#|###.|..#.|.##.|.###
#..#|.#.|.#..|...#|####|...#|#..#|.#..|#..#|...#
#..#|.#.|#...|...#|..#.|#..#|#..#|.#..|#..#|...#
.##.|###|####|###.|..#.|.##.|.##.|.#..|.##.|.##.
....|...|....|....|....|....|....|....|....|....
....|...|....|....|....|....|....|....|....|....`,
  ],
  [
    `.,:;-_/'"()&@`,
    `
.|..|.|..|...|....|....|.|...|.#|#.|.....|.....
.|..|.|..|...|....|...#|#|#.#|#.|.#|.##..|.###.
.|..|.|..|...|....|..#.|#|#.#|#.|.#|#..#.|#...#
.|..|.|..|...|....|..#.|.|...|#.|.#|#.#..|#.###
.|..|#|.#|...|....|.#..|.|...|#.|.#|.#...|#.#.#
.|..|.|..|###|....|.#..|.|...|#.|.#|#.#.#|#.###
.|..|.|..|...|....|#...|.|...|#.|.#|#..#.|#....
#|.#|#|.#|...|....|#...|.|...|#.|.#|.##.#|.###.
.|#.|.|#.|...|####|....|.|...|.#|#.|.....|.....
.|..|.|..|...|....|....|.|...|..|..|.....|.....`,
  ],
  [
    '·!?+#%…→↗<>=*|×▸[]',
    `
.|.|....|...|.....|.....|.....|.....|.....|...|...|...|...|#|...|...|##|##
.|#|.##.|...|.....|##..#|.....|.....|.####|...|...|...|...|#|...|...|#.|.#
.|#|#..#|...|.#.#.|##.#.|.....|.....|...##|...|...|...|#.#|#|...|...|#.|.#
.|#|...#|...|#####|...#.|.....|.....|..#.#|..#|#..|...|.#.|#|...|#..|#.|.#
.|#|..#.|.#.|.#.#.|..#..|.....|...#.|.#..#|.#.|.#.|###|#.#|#|#.#|##.|#.|.#
#|#|.#..|###|#####|.#...|.....|#####|#....|#..|..#|...|...|#|.#.|###|#.|.#
.|.|....|.#.|.#.#.|.#.##|.....|...#.|.....|.#.|.#.|###|...|#|#.#|##.|#.|.#
.|#|.#..|...|.....|#..##|#.#.#|.....|.....|..#|#..|...|...|#|...|#..|#.|.#
.|.|....|...|.....|.....|.....|.....|.....|...|...|...|...|#|...|...|##|##
.|.|....|...|.....|.....|.....|.....|.....|...|...|...|...|#|...|...|..|..`,
  ],
]

export type Glyph = { w: number; rows: Uint8Array }
let FONT: Map<string, Glyph> | null = null
export function font(): Map<string, Glyph> {
  if (FONT) return FONT
  const m = new Map<string, Glyph>()
  for (const [chars, src] of FONT_SRC) {
    const rows = src
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
      .map((l) => l.split('|'))
    ;[...chars].forEach((ch, k) => {
      const w = rows[0][k].length
      const bits = new Uint8Array(10)
      for (let r = 0; r < 10; r++) {
        const seg = rows[r]?.[k] ?? ''
        for (let c = 0; c < w; c++) if (seg[c] === '#') bits[r] |= 1 << (w - 1 - c)
      }
      m.set(ch, { w, rows: bits })
    })
  }
  m.set(' ', { w: 2, rows: new Uint8Array(10) })
  FONT = m
  return m
}
export const glyph = (ch: string) => font().get(ch) ?? font().get(ch.toLowerCase()) ?? font().get('?')!

/** Width of a run of system type, in pixels. */
export function tw(s: string, bold = false): number {
  let w = 0
  for (const ch of s) w += glyph(ch).w + 1 + (bold ? 1 : 0)
  return Math.max(0, w - 1)
}
/** Cut to fit, with an ellipsis. */
export function fitPx(s: string, max: number): string {
  if (tw(s) <= max) return s
  let t = s
  while (t.length && tw(`${t}…`) > max) t = t.slice(0, -1)
  return `${t.trimEnd()}…`
}
/** Word wrap to a pixel width. */
export function wrapPx(s: string, max: number): string[] {
  const out: string[] = []
  let line = ''
  for (const word of s.split(' ')) {
    const next = line ? `${line} ${word}` : word
    if (tw(next) > max && line) {
      out.push(line)
      line = word
    } else line = next
  }
  if (line) out.push(line)
  return out
}

/** 0 = clear, 1 = ink, 2 = paper. */
export type Spr = { w: number; h: number; d: Uint8Array }
export type Rect = { x: number; y: number; w: number; h: number }
export const inRect = (r: Rect, x: number, y: number) => x >= r.x && y >= r.y && x < r.x + r.w && y < r.y + r.h

/** The framebuffer: 1 is ink, 0 is lit phosphor. Colour 2 means XOR. */
export class Raster {
  fb = new Uint8Array(SW * SH)
  x0 = 0
  y0 = 0
  x1 = SW
  y1 = SH
  clip(r: Rect) {
    this.x0 = Math.max(0, r.x)
    this.y0 = Math.max(0, r.y)
    this.x1 = Math.min(SW, r.x + r.w)
    this.y1 = Math.min(SH, r.y + r.h)
  }
  unclip() {
    this.x0 = 0
    this.y0 = 0
    this.x1 = SW
    this.y1 = SH
  }
  px(x: number, y: number, c: number) {
    if (x < this.x0 || y < this.y0 || x >= this.x1 || y >= this.y1) return
    const i = (y | 0) * SW + (x | 0)
    this.fb[i] = c === 2 ? this.fb[i] ^ 1 : c
  }
  rect(x: number, y: number, w: number, h: number, c: number) {
    const xa = Math.max(this.x0, Math.floor(x))
    const xb = Math.min(this.x1, Math.floor(x + w))
    const ya = Math.max(this.y0, Math.floor(y))
    const yb = Math.min(this.y1, Math.floor(y + h))
    for (let yy = ya; yy < yb; yy++) {
      let i = yy * SW + xa
      for (let xx = xa; xx < xb; xx++, i++) this.fb[i] = c === 2 ? this.fb[i] ^ 1 : c
    }
  }
  pat(x: number, y: number, w: number, h: number, p: readonly number[]) {
    const xa = Math.max(this.x0, Math.floor(x))
    const xb = Math.min(this.x1, Math.floor(x + w))
    const ya = Math.max(this.y0, Math.floor(y))
    const yb = Math.min(this.y1, Math.floor(y + h))
    for (let yy = ya; yy < yb; yy++) {
      let i = yy * SW + xa
      const row = p[yy & 7]
      for (let xx = xa; xx < xb; xx++, i++) this.fb[i] = (row >> (7 - (xx & 7))) & 1
    }
  }
  frame(x: number, y: number, w: number, h: number, c = 1) {
    this.rect(x, y, w, 1, c)
    this.rect(x, y + h - 1, w, 1, c)
    this.rect(x, y + 1, 1, h - 2, c)
    this.rect(x + w - 1, y + 1, 1, h - 2, c)
  }
  /** The marching-ants outline: every other pixel, inverted. */
  dotted(x: number, y: number, w: number, h: number) {
    x = Math.round(x)
    y = Math.round(y)
    w = Math.round(w)
    h = Math.round(h)
    for (let i = 0; i < w; i += 2) {
      this.px(x + i, y, 2)
      this.px(x + i, y + h - 1, 2)
    }
    for (let j = 2; j < h - 1; j += 2) {
      this.px(x, y + j, 2)
      this.px(x + w - 1, y + j, 2)
    }
  }
  line(x0: number, y0: number, x1: number, y1: number, c = 1) {
    x0 = Math.round(x0)
    y0 = Math.round(y0)
    x1 = Math.round(x1)
    y1 = Math.round(y1)
    const dx = Math.abs(x1 - x0)
    const dy = -Math.abs(y1 - y0)
    const sx = x0 < x1 ? 1 : -1
    const sy = y0 < y1 ? 1 : -1
    let err = dx + dy
    for (;;) {
      this.px(x0, y0, c)
      if (x0 === x1 && y0 === y1) break
      const e2 = 2 * err
      if (e2 >= dy) {
        err += dy
        x0 += sx
      }
      if (e2 <= dx) {
        err += dx
        y0 += sy
      }
    }
  }
  spr(s: Spr, x: number, y: number, inv = false) {
    for (let j = 0; j < s.h; j++) {
      for (let i = 0; i < s.w; i++) {
        const v = s.d[j * s.w + i]
        if (v) this.px(x + i, y + j, (v === 1) !== inv ? 1 : 0)
      }
    }
  }
  /** An opaque one-bit image (the contact sheet, the paint document). */
  bits(d: Uint8Array, w: number, h: number, x: number, y: number) {
    const xa = Math.max(this.x0, x)
    const xb = Math.min(this.x1, x + w)
    const ya = Math.max(this.y0, y)
    const yb = Math.min(this.y1, y + h)
    for (let yy = ya; yy < yb; yy++) {
      let si = (yy - y) * w + (xa - x)
      let di = yy * SW + xa
      for (let xx = xa; xx < xb; xx++) this.fb[di++] = d[si++]
    }
  }
  text(s: string, x: number, y: number, c = 1, bold = false): number {
    for (const ch of s) {
      const g = glyph(ch)
      for (let r = 0; r < 10; r++) {
        const row = g.rows[r]
        if (!row) continue
        for (let k = 0; k < g.w; k++) {
          if (!(row & (1 << (g.w - 1 - k)))) continue
          this.px(x + k, y + r, c)
          if (bold) this.px(x + k + 1, y + r, c)
        }
      }
      x += g.w + 1 + (bold ? 1 : 0)
    }
    return x
  }
  /** Disabled: knock out every other pixel in the box, the way greyed menu items look. */
  grey(x: number, y: number, w: number, h: number) {
    for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) if ((xx + yy) & 1) this.px(xx, yy, 0)
  }
}

// fill patterns, 8×8, a byte a row
export const PATS: readonly (readonly number[])[] = [
  [0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff],
  [0x77, 0xdd, 0x77, 0xdd, 0x77, 0xdd, 0x77, 0xdd],
  [0xaa, 0x55, 0xaa, 0x55, 0xaa, 0x55, 0xaa, 0x55],
  [0x88, 0x22, 0x88, 0x22, 0x88, 0x22, 0x88, 0x22],
  [0x80, 0x00, 0x08, 0x00, 0x80, 0x00, 0x08, 0x00],
  [0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00],
  [0xff, 0x00, 0x00, 0x00, 0xff, 0x00, 0x00, 0x00],
  [0x88, 0x88, 0x88, 0x88, 0x88, 0x88, 0x88, 0x88],
  [0x01, 0x02, 0x04, 0x08, 0x10, 0x20, 0x40, 0x80],
  [0xff, 0x80, 0x80, 0x80, 0xff, 0x08, 0x08, 0x08],
  [0xf0, 0xf0, 0xf0, 0xf0, 0x0f, 0x0f, 0x0f, 0x0f],
  [0x81, 0x42, 0x24, 0x18, 0x18, 0x24, 0x42, 0x81],
  [0x08, 0x1c, 0x22, 0xc1, 0x80, 0x01, 0x02, 0x04],
  [0x00, 0x44, 0x00, 0x00, 0x00, 0x11, 0x00, 0x00],
]
export const PAT_GREY = PATS[2]

/** Ink from '#', paper from 'o', clear from '.'. */
export function fromRows(rows: string[]): Spr {
  const w = Math.max(...rows.map((r) => r.length))
  const d = new Uint8Array(w * rows.length)
  rows.forEach((r, j) => [...r].forEach((c, i) => (d[j * w + i] = c === '#' ? 1 : c === 'o' ? 2 : 0)))
  return { w, h: rows.length, d }
}
/** Ink from '#', with a one-pixel paper outline all round, so a cursor reads on any ground. */
export function outlined(rows: string[]): Spr {
  const s = fromRows(rows)
  const w = s.w + 2
  const h = s.h + 2
  const d = new Uint8Array(w * h)
  for (let j = 0; j < s.h; j++) for (let i = 0; i < s.w; i++) if (s.d[j * s.w + i] === 1) d[(j + 1) * w + i + 1] = 1
  for (let j = 0; j < h; j++) {
    for (let i = 0; i < w; i++) {
      if (d[j * w + i] === 1) continue
      let near = false
      for (let b = -1; b <= 1; b++) {
        for (let a = -1; a <= 1; a++) {
          const x = i + a
          const y = j + b
          if (x >= 0 && y >= 0 && x < w && y < h && d[y * w + x] === 1) near = true
        }
      }
      if (near) d[j * w + i] = 2
    }
  }
  return { w, h, d }
}

export const ARROW = outlined([
  '#.........',
  '##........',
  '###.......',
  '####......',
  '#####.....',
  '######....',
  '#######...',
  '########..',
  '#########.',
  '#####.....',
  '##.##.....',
  '#...##....',
  '....##....',
  '.....##...',
  '.....##...',
])
export const CROSS = outlined(['....#....', '....#....', '....#....', '.........', '###...###', '.........', '....#....', '....#....', '....#....'])
export const ERASER_CUR = fromRows(['############', ...Array.from({ length: 10 }, () => '#oooooooooo#'), '############'])
export const STAR = fromRows(['....#....', '.#..#..#.', '..#.#.#..', '...###...', '#########', '...###...', '..#.#.#..', '.#..#..#.', '....#....'])
export const MINI_DOC = fromRows(['#####...', '#ooo##..', '#ooo#o#.', '#ooo####', '#oooooo#', '#oooooo#', '#oooooo#', '#oooooo#', '#oooooo#', '########'])

export type Pen = {
  dot: (x: number, y: number) => void
  line: (x0: number, y0: number, x1: number, y1: number) => void
  rect: (x: number, y: number, w: number, h: number) => void
  fill: (x: number, y: number, w: number, h: number) => void
  paper: (x: number, y: number, w: number, h: number) => void
}
/** Draw an outline, then flood the outside: whatever the flood cannot reach is the icon's white body. */
export function buildIcon(w: number, h: number, draw: (p: Pen) => void): Spr {
  const d = new Uint8Array(w * h)
  const dot = (x: number, y: number) => {
    if (x >= 0 && y >= 0 && x < w && y < h) d[y * w + x] = 1
  }
  const pen: Pen = {
    dot,
    line: (x0, y0, x1, y1) => {
      const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1)
      for (let i = 0; i <= n; i++) dot(Math.round(x0 + ((x1 - x0) * i) / n), Math.round(y0 + ((y1 - y0) * i) / n))
    },
    rect: (x, y, rw, rh) => {
      for (let i = 0; i < rw; i++) {
        dot(x + i, y)
        dot(x + i, y + rh - 1)
      }
      for (let j = 0; j < rh; j++) {
        dot(x, y + j)
        dot(x + rw - 1, y + j)
      }
    },
    fill: (x, y, rw, rh) => {
      for (let j = 0; j < rh; j++) for (let i = 0; i < rw; i++) dot(x + i, y + j)
    },
    paper: (x, y, rw, rh) => {
      for (let j = 0; j < rh; j++) for (let i = 0; i < rw; i++) if (x + i < w && y + j < h) d[(y + j) * w + x + i] = 3
    },
  }
  draw(pen)
  const outside = new Uint8Array(w * h)
  const stack: number[] = []
  for (let i = 0; i < w; i++) stack.push(i, (h - 1) * w + i)
  for (let j = 0; j < h; j++) stack.push(j * w, j * w + w - 1)
  while (stack.length) {
    const i = stack.pop()!
    if (outside[i] || d[i] === 1) continue
    outside[i] = 1
    const x = i % w
    const y = (i / w) | 0
    if (x > 0) stack.push(i - 1)
    if (x < w - 1) stack.push(i + 1)
    if (y > 0) stack.push(i - w)
    if (y < h - 1) stack.push(i + w)
  }
  for (let i = 0; i < w * h; i++) if (d[i] === 3 || (!d[i] && !outside[i])) d[i] = 2
  return { w, h, d }
}

export const docOutline = (p: Pen) => {
  p.line(6, 1, 21, 1)
  p.line(21, 1, 27, 7)
  p.line(27, 7, 27, 30)
  p.line(27, 30, 6, 30)
  p.line(6, 30, 6, 1)
  p.line(21, 1, 21, 7)
  p.line(21, 7, 27, 7)
}
export const folderOutline = (p: Pen) => {
  p.line(1, 7, 3, 5)
  p.line(3, 5, 11, 5)
  p.line(11, 5, 13, 7)
  p.line(13, 7, 30, 7)
  p.line(30, 7, 30, 28)
  p.line(30, 28, 1, 28)
  p.line(1, 28, 1, 7)
  p.line(1, 10, 30, 10)
}
export type BaseIconId = 'about' | 'projects' | 'paint' | 'contact' | 'trash'
export const ICON_SPR: Record<BaseIconId, () => Spr> = {
  about: () =>
    buildIcon(32, 32, (p) => {
      docOutline(p)
      ;[14, 11, 14, 8, 13, 10, 6].forEach((n, i) => p.line(10, 10 + i * 3, 10 + n, 10 + i * 3))
    }),
  contact: () =>
    buildIcon(32, 32, (p) => {
      docOutline(p)
      p.rect(10, 12, 14, 10)
      p.line(10, 12, 16, 17)
      p.line(23, 12, 17, 17)
      p.line(10, 25, 20, 25)
    }),
  projects: () => buildIcon(32, 32, folderOutline),
  paint: () =>
    buildIcon(32, 32, (p) => {
      p.rect(2, 9, 22, 21)
      // a swash of paint on the canvas
      for (let i = 0; i <= 26; i++) {
        const t = i / 26
        p.fill(Math.round(5 + t * 12), Math.round(23 - Math.sin(t * Math.PI * 1.3) * 5), 2, 3)
      }
      // and the brush that laid it, resting across the corner
      p.line(19, 15, 29, 3)
      p.line(20, 16, 30, 4)
      p.line(21, 15, 30, 5)
      p.fill(16, 16, 4, 3)
      p.fill(14, 18, 3, 3)
      p.fill(12, 20, 3, 2)
    }),
  trash: () =>
    buildIcon(32, 32, (p) => {
      p.rect(12, 2, 8, 4)
      p.rect(5, 5, 22, 4)
      p.line(7, 9, 9, 30)
      p.line(25, 9, 23, 30)
      p.line(9, 30, 23, 30)
      for (const x of [12, 16, 20]) p.line(x, 12, x, 27)
    }),
}

export const TOOL_SPR = {
  pencil: fromRows([
    '..........##..',
    '.........#..#.',
    '........#..#..',
    '.......#..#...',
    '......#..#....',
    '.....#..#.....',
    '....#..#......',
    '...#..#.......',
    '..##.#........',
    '..#.#.........',
    '..##..........',
  ]),
  brush: fromRows([
    '...........##.',
    '..........#..#',
    '.........#..#.',
    '........#..#..',
    '.......#..#...',
    '......####....',
    '.....#####....',
    '....#####.....',
    '...#####......',
    '..####........',
    '.##...........',
  ]),
  spray: fromRows([
    '.......#.#.#..',
    '...##...#.#...',
    '..####.#.#.#..',
    '..#..#........',
    '.######.......',
    '.#....#.......',
    '.#.##.#.......',
    '.#.##.#.......',
    '.#....#.......',
    '.#....#.......',
    '.######.......',
  ]),
  eraser: fromRows([
    '.....########.',
    '....#......##.',
    '...#......#.#.',
    '..#......#..#.',
    '.########..#..',
    '.#......#.#...',
    '.#......##....',
    '.########.....',
  ]),
}
export type Tool = keyof typeof TOOL_SPR
export const TOOLS: Tool[] = ['pencil', 'brush', 'spray', 'eraser']

/** Atkinson error diffusion: three quarters of the error is passed on and the rest let go, which is the period look. */
export function atkinson(lum: Float32Array, w: number, h: number): Uint8Array {
  const e = Float32Array.from(lum)
  const out = new Uint8Array(w * h)
  const add = (x: number, y: number, v: number) => {
    if (x >= 0 && x < w && y < h) e[y * w + x] += v
  }
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x
      const nv = e[i] < 0.5 ? 0 : 1
      out[i] = nv ? 0 : 1
      const err = (e[i] - nv) / 8
      add(x + 1, y, err)
      add(x + 2, y, err)
      add(x - 1, y + 1, err)
      add(x, y + 1, err)
      add(x + 1, y + 1, err)
      add(x, y + 2, err)
    }
  }
  return out
}

/** A photo cover-fitted into a landscape frame (portraits lie sideways, as on a roll), as luminance. */
export function photoLum(img: HTMLImageElement, w: number, h: number): Float32Array {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const x = c.getContext('2d', { willReadFrequently: true })!
  const portrait = img.naturalHeight > img.naturalWidth
  x.save()
  if (portrait) {
    x.translate(w / 2, h / 2)
    x.rotate(-Math.PI / 2)
    x.translate(-h / 2, -w / 2)
  }
  const bw = portrait ? h : w
  const bh = portrait ? w : h
  const s = Math.max(bw / img.naturalWidth, bh / img.naturalHeight)
  const sw = bw / s
  const sh = bh / s
  x.drawImage(img, (img.naturalWidth - sw) / 2, (img.naturalHeight - sh) / 2, sw, sh, 0, 0, bw, bh)
  x.restore()
  const px = x.getImageData(0, 0, w, h).data
  const lum = new Float32Array(w * h)
  const hist = new Uint32Array(256)
  for (let i = 0; i < w * h; i++) {
    const l = 0.2126 * px[i * 4] + 0.7152 * px[i * 4 + 1] + 0.0722 * px[i * 4 + 2]
    lum[i] = l / 255
    hist[Math.min(255, l | 0)]++
  }
  // levels, the way a printer would set them: some of these are night shots,
  // and one bit has nothing to give a frame that lives in the bottom fifth
  let lo = 0
  let hi = 255
  for (let c = 0, i = 0; i < 256; i++) if ((c += hist[i]) > w * h * 0.01) { lo = i; break }
  for (let c = 0, i = 255; i >= 0; i--) if ((c += hist[i]) > w * h * 0.01) { hi = i; break }
  const span = Math.max(24, hi - lo) / 255
  for (let i = 0; i < w * h; i++) {
    const t = Math.min(1, Math.max(0, (lum[i] - lo / 255) / span))
    lum[i] = t * t * (3 - 2 * t) * 0.35 + t * 0.65 // a gentle S, for a little more snap
  }
  return lum
}

/** Seeded PRNG, so a restart paints the same brushwork. */
export function mulberry(a: number) {
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function boxBlur(a: Float32Array, w: number, h: number, r: number): Float32Array {
  const tmp = new Float32Array(w * h)
  const out = new Float32Array(w * h)
  const n = 2 * r + 1
  for (let y = 0; y < h; y++) {
    let s = 0
    for (let x = -r; x <= r; x++) s += a[y * w + Math.min(w - 1, Math.max(0, x))]
    for (let x = 0; x < w; x++) {
      tmp[y * w + x] = s / n
      s += a[y * w + Math.min(w - 1, x + r + 1)] - a[y * w + Math.max(0, x - r)]
    }
  }
  for (let x = 0; x < w; x++) {
    let s = 0
    for (let y = -r; y <= r; y++) s += tmp[Math.min(h - 1, Math.max(0, y)) * w + x]
    for (let y = 0; y < h; y++) {
      out[y * w + x] = s / n
      s += tmp[Math.min(h - 1, y + r + 1) * w + x] - tmp[Math.max(0, y - r) * w + x]
    }
  }
  return out
}

/** Display type, rasterised and thresholded to one bit, cropped to its ink. */
export function serifSpr(text: string, size: number, face: string, thicken = 0, cut = 110): Spr {
  const c = document.createElement('canvas')
  const x = c.getContext('2d', { willReadFrequently: true })!
  x.font = `400 ${size}px ${face}`
  const w = Math.ceil(x.measureText(text).width + size * 0.3 + 6)
  const h = Math.ceil(size * 1.35)
  c.width = w
  c.height = h
  x.font = `400 ${size}px ${face}`
  x.fillStyle = '#000'
  x.strokeStyle = '#000'
  x.lineJoin = 'round'
  const by = Math.round(size)
  if (thicken) {
    x.lineWidth = thicken
    x.strokeText(text, 3, by)
  }
  x.fillText(text, 3, by)
  const a = x.getImageData(0, 0, w, h).data
  let minX = w
  let maxX = -1
  let minY = h
  let maxY = -1
  for (let j = 0; j < h; j++) {
    for (let i = 0; i < w; i++) {
      if (a[(j * w + i) * 4 + 3] <= cut) continue
      minX = Math.min(minX, i)
      maxX = Math.max(maxX, i)
      minY = Math.min(minY, j)
      maxY = Math.max(maxY, j)
    }
  }
  if (maxX < 0) return { w: 1, h: 1, d: new Uint8Array(1) }
  const cw = maxX - minX + 1
  const ch = maxY - minY + 1
  const d = new Uint8Array(cw * ch)
  for (let j = 0; j < ch; j++) for (let i = 0; i < cw; i++) d[j * cw + i] = a[((j + minY) * w + i + minX) * 4 + 3] > cut ? 1 : 0
  return { w: cw, h: ch, d }
}

/**
 * The name in brushy one-bit paint: the letters as a ragged mask, then dry
 * bristle streaks combed through them along the letterforms (the flow is the
 * blurred mask's gradient turned 90°, as in the impasto), and a little spray
 * where the brush skipped off the edge.
 */
export function brushName(face: string, W: number, H: number): Uint8Array {
  const c = document.createElement('canvas')
  c.width = W
  c.height = H
  const x = c.getContext('2d', { willReadFrequently: true })!
  x.font = `400 100px ${face}`
  const w100 = x.measureText(NAME).width
  const size = Math.min((W * 0.86 * 100) / w100, H * 0.7)
  x.font = `400 ${size}px ${face}`
  x.textAlign = 'center'
  x.textBaseline = 'alphabetic'
  x.lineJoin = 'round'
  x.lineWidth = size * 0.1 // paint, even in pixels, does not hold a hairline
  x.strokeText(NAME, W / 2, H * 0.52 + size * 0.22)
  x.fillText(NAME, W / 2, H * 0.52 + size * 0.22)
  const px = x.getImageData(0, 0, W, H).data
  const a = new Float32Array(W * H)
  for (let i = 0; i < W * H; i++) a[i] = px[i * 4 + 3] / 255
  const soft = boxBlur(a, W, H, Math.max(2, Math.round(size * 0.05)))
  const rnd = mulberry(11)
  const doc = new Uint8Array(W * H)
  // ragged edges: threshold against coarse noise
  const cell = 3
  const gw = Math.ceil(W / cell) + 1
  const grid = Float32Array.from({ length: gw * (Math.ceil(H / cell) + 1) }, () => rnd())
  for (let y = 0; y < H; y++) {
    for (let xx = 0; xx < W; xx++) doc[y * W + xx] = a[y * W + xx] > 0.3 + grid[((y / cell) | 0) * gw + ((xx / cell) | 0)] * 0.4 ? 1 : 0
  }
  const S = (xx: number, y: number) => soft[Math.min(H - 1, Math.max(0, y | 0)) * W + Math.min(W - 1, Math.max(0, xx | 0))]
  const A = (xx: number, y: number) => a[Math.min(H - 1, Math.max(0, y | 0)) * W + Math.min(W - 1, Math.max(0, xx | 0))]
  // bristle streaks: dry hairlines combed through about a tenth of the paint
  let area = 0
  for (let i = 0; i < W * H; i++) if (a[i] > 0.95 && soft[i] > 0.7) area++
  const count = Math.round((area * 0.13) / 10)
  for (let s = 0, tries = 0; s < count && tries < 20000; tries++) {
    let qx = rnd() * W
    let qy = rnd() * H
    if (A(qx, qy) < 0.9) continue
    s++
    let dx = 0
    let dy = -1
    const len = 4 + rnd() * 14
    const offs = [(rnd() - 0.5) * 7]
    for (let t = 0; t < len; t += 1) {
      const gx = S(qx + 2, qy) - S(qx - 2, qy)
      const gy = S(qx, qy + 2) - S(qx, qy - 2)
      let tx = -gy
      let ty = gx
      const tl = Math.hypot(tx, ty)
      if (tl < 1e-3) {
        tx = dx
        ty = dy
      } else {
        tx /= tl
        ty /= tl
      }
      if (tx * dx + ty * dy < 0) {
        tx = -tx
        ty = -ty
      }
      dx = tx * 0.6 + dx * 0.4
      dy = ty * 0.6 + dy * 0.4
      const dl = Math.hypot(dx, dy) || 1
      dx /= dl
      dy /= dl
      qx += dx
      qy += dy
      if (A(qx, qy) < 0.5) break
      for (const o of offs) {
        const bx = Math.round(qx - dy * o)
        const by = Math.round(qy + dx * o)
        // keep the edges solid: streaks only well inside the letter
        if (A(bx, by) > 0.95 && S(bx, by) > 0.7) doc[by * W + bx] = 0
      }
    }
  }
  // spray where the brush skipped
  for (let i = 0; i < W * H; i++) {
    const v = soft[i]
    if (!doc[i] && v > 0.04 && v < 0.35 && rnd() < 0.06 * (1 - v)) doc[i] = 1
  }
  return doc
}

import type { Piano } from './macPiano'
import { PATS, TOOL_SPR, type Raster, type Rect, type Spr, buildIcon, folderOutline, fromRows, glyph, inRect, outlined, tw, wrapPx } from './macRaster'

/**
 * The Classic's applications and desk accessories: paint, the piano, the guest
 * book, and the calculator, note pad, alarm clock and control panel.
 *
 * Each is an `App`: it draws itself into its window's content rectangle and
 * takes the pointer and the keyboard in content-local pixels. MacHero's window
 * manager owns the windows, the menus and the clock; an app only knows its
 * own content, plus what `AppCtx` hands it (the time, sounds, preferences, the
 * shared clipboard). Every control drawn here does something: there is no
 * greyed-out furniture anywhere on this desktop.
 */

// ── shared ────────────────────────────────────────────────────────────────
export type Bits = { w: number; h: number; d: Uint8Array }
export type Clip = { text: string | null; bits: Bits | null }
export type Prefs = {
  /** The desktop pattern, eight rows of eight bits. */
  pattern: number[]
  /** Speaker volume, 0 to 7. */
  volume: number
  /** How many times a chosen menu item blinks. */
  blinks: number
  /** Insertion point blink rate. */
  caret: 'slow' | 'fast'
}
export const DEFAULT_PREFS: Prefs = { pattern: [...PATS[2]], volume: 5, blinks: 2, caret: 'slow' }

export type Sound = 'beep' | 'chime' | 'tick' | 'solved'
export type EditOp = 'undo' | 'cut' | 'copy' | 'paste' | 'clear' | 'selectAll'
export type CursorName = 'arrow' | 'ibeam' | 'cross' | 'eraser' | 'hidden'

export interface AppCtx {
  /** Milliseconds of desktop time. */
  wall(): number
  sfx(s: Sound): void
  prefs: Prefs
  setPrefs(p: Partial<Prefs>): void
  clip: Clip
  /** The piano, once sound has been unlocked by a gesture. */
  piano(): Piano | null
  /** Redraw the desktop (for something that arrives later, like the network). */
  dirty(): void
}

export interface App {
  draw(R: Raster, c: Rect): void
  down?(x: number, y: number, dbl: boolean): void
  /** `held` is true while the button is down after a `down` in this app. */
  move?(x: number, y: number, held: boolean): void
  up?(x: number, y: number): void
  /** A key while this app's window is in front. True if it was taken. */
  key?(key: string): boolean
  keyUp?(key: string): boolean
  cursor?(x: number, y: number): CursorName | null
  /** Needs a redraw every frame (an animation, a blinking caret, held spray). */
  busy?(): boolean
  can?(op: EditOp): boolean
  edit?(op: EditOp): void
  /** Its window closed. */
  closed?(): void
  /** The text field being typed into, if any: a phone's keyboard is brought up for it. */
  textField?(): { value: string; max: number } | null
  /** The phone's keyboard replaced the field's text. */
  setText?(value: string): void
}

const store = {
  get<T>(k: string, fallback: T): T {
    try {
      const v = window.localStorage.getItem(k)
      return v === null ? fallback : (JSON.parse(v) as T)
    } catch {
      return fallback
    }
  },
  set(k: string, v: unknown) {
    try {
      window.localStorage.setItem(k, JSON.stringify(v))
    } catch {
      /* private mode: it just will not remember */
    }
  },
}
export const loadPrefs = (): Prefs => {
  const p = store.get<Partial<Prefs>>('yh:mac-prefs', {})
  return {
    pattern: Array.isArray(p.pattern) && p.pattern.length === 8 ? p.pattern.map((n) => n & 0xff) : [...DEFAULT_PREFS.pattern],
    volume: typeof p.volume === 'number' ? Math.max(0, Math.min(7, Math.round(p.volume))) : DEFAULT_PREFS.volume,
    blinks: typeof p.blinks === 'number' ? Math.max(1, Math.min(3, Math.round(p.blinks))) : DEFAULT_PREFS.blinks,
    caret: p.caret === 'fast' ? 'fast' : 'slow',
  }
}
export const savePrefs = (p: Prefs) => store.set('yh:mac-prefs', p)

/** Whether the system font can draw a character (anything else is not typed at all). */
const typeable = (ch: string) => ch === ' ' || ch === '\n' || glyph(ch) !== glyph('\u0000') || ch === '?'

/** A push button: rounded corners, centred label, inverted while held. */
export function button(R: Raster, r: Rect, label: string, held = false, bold = false) {
  R.rect(r.x + 1, r.y + 1, r.w - 2, r.h - 2, held ? 1 : 0)
  R.rect(r.x + 2, r.y, r.w - 4, 1, 1)
  R.rect(r.x + 2, r.y + r.h - 1, r.w - 4, 1, 1)
  R.rect(r.x, r.y + 2, 1, r.h - 4, 1)
  R.rect(r.x + r.w - 1, r.y + 2, 1, r.h - 4, 1)
  R.px(r.x + 1, r.y + 1, 1)
  R.px(r.x + r.w - 2, r.y + 1, 1)
  R.px(r.x + 1, r.y + r.h - 2, 1)
  R.px(r.x + r.w - 2, r.y + r.h - 2, 1)
  R.text(label, r.x + Math.round((r.w - tw(label, bold)) / 2), r.y + Math.floor((r.h - 9) / 2), held ? 0 : 1, bold)
}
/** A round radio button, filled when chosen. */
function radio(R: Raster, x: number, y: number, on: boolean) {
  const ring = ['..###..', '.#...#.', '#.....#', '#.....#', '#.....#', '.#...#.', '..###..']
  ring.forEach((row, j) => [...row].forEach((ch, i) => ch === '#' && R.px(x + i, y + j, 1)))
  if (on) R.rect(x + 2, y + 2, 3, 3, 1)
}

export const ARROW_L = fromRows(['...#', '..##', '.###', '####', '.###', '..##', '...#'])
export const ARROW_R = fromRows(['#...', '##..', '###.', '####', '###.', '##..', '#...'])
/** An arrow in a small square button. */
function arrowBtn(R: Raster, r: Rect, s: Spr, held: boolean) {
  R.rect(r.x, r.y, r.w, r.h, held ? 1 : 0)
  R.frame(r.x, r.y, r.w, r.h)
  R.spr(s, r.x + Math.floor((r.w - s.w) / 2), r.y + Math.floor((r.h - s.h) / 2), held)
}

// ── sprites the desktop needs ─────────────────────────────────────────────
export const IBEAM = outlined(['##.##', '..#..', '..#..', '..#..', '..#..', '..#..', '..#..', '..#..', '..#..', '..#..', '##.##'])
const SELECT_SPR = fromRows(['#.#.#.#.#.#.', '...........#', '#...........', '...........#', '#...........', '...........#', '#...........', '.#.#.#.#.#.#'])

/** A paper dart, nose to the left, for the screensaver. White body, ink edge. */
export const PLANE = buildIcon(26, 13, (p) => {
  p.line(0, 6, 25, 0)
  p.line(0, 6, 25, 12)
  p.line(25, 0, 20, 6)
  p.line(20, 6, 25, 12)
  p.line(0, 6, 20, 6)
  p.line(3, 6, 25, 3)
})
/** The alarm clock, small, for the menu bar while it rings. */
export const BELL = fromRows(['#.....#', '.#####.', '#.....#', '#..#..#', '#..##.#', '#.....#', '.#####.', '#.....#'])

export const MORE_ICONS = {
  guests: () =>
    buildIcon(32, 32, (p) => {
      // an open book, its pages lined
      p.line(1, 7, 15, 9)
      p.line(15, 9, 15, 28)
      p.line(15, 28, 1, 26)
      p.line(1, 26, 1, 7)
      p.line(16, 9, 30, 7)
      p.line(30, 7, 30, 26)
      p.line(30, 26, 16, 28)
      p.line(16, 28, 16, 9)
      for (let k = 0; k < 4; k++) {
        p.line(4, 12 + k * 3, 12, 13 + k * 3)
        p.line(19, 13 + k * 3, 27, 12 + k * 3)
      }
      p.line(1, 27, 15, 30)
      p.line(16, 30, 30, 27)
    }),
  piano: () =>
    buildIcon(32, 32, (p) => {
      p.rect(1, 9, 30, 16)
      for (let x = 5; x < 31; x += 4) p.line(x, 9, x, 24)
      for (const x of [4, 8, 16, 20, 24]) p.fill(x, 9, 3, 9)
      p.line(1, 7, 30, 7)
      p.line(2, 6, 29, 6)
    }),
  disk: () =>
    buildIcon(32, 32, (p) => {
      p.line(3, 3, 26, 3)
      p.line(26, 3, 29, 6)
      p.line(29, 6, 29, 29)
      p.line(29, 29, 3, 29)
      p.line(3, 29, 3, 3)
      p.rect(9, 3, 14, 10)
      p.fill(17, 5, 3, 6)
      p.rect(7, 16, 18, 13)
      p.line(9, 20, 22, 20)
      p.line(9, 23, 22, 23)
    }),
  trashFull: () =>
    buildIcon(32, 32, (p) => {
      p.rect(12, 1, 8, 4)
      p.line(4, 6, 27, 3)
      p.line(4, 9, 27, 6)
      p.line(4, 6, 4, 9)
      p.line(27, 3, 27, 6)
      p.line(6, 9, 9, 30)
      p.line(26, 8, 23, 30)
      p.line(9, 30, 23, 30)
      for (const x of [12, 16, 20]) p.line(x, 12, x, 27)
      // a crumpled sheet poking out under the lid
      p.line(20, 9, 23, 2)
      p.line(23, 2, 28, 4)
      p.line(28, 4, 25, 8)
    }),
}
/** Small icons for the desktop's list view. */
export const MINI = {
  doc: fromRows(['#####...', '#ooo##..', '#ooo#o#.', '#ooo####', '#oooooo#', '#oooooo#', '#oooooo#', '#oooooo#', '#oooooo#', '########']),
  folder: fromRows(['.###......', '#ooo#.....', '##########', '#oooooooo#', '#oooooooo#', '#oooooooo#', '#oooooooo#', '##########']),
  app: fromRows(['....#....', '...#o#...', '..#ooo#..', '.#ooooo#.', '#ooo#ooo#', '.#ooooo#.', '..#ooo#..', '...#o#...', '....#....']),
  trash: fromRows(['..####..', '########', '.#oooo#.', '.#o#o##.', '.#o#o##.', '.#o#o##.', '.#oooo#.', '.######.']),
  disk: fromRows(['#######.', '#o###o##', '#o###o##', '#oooooo#', '#o####o#', '#o#oo#o#', '#o####o#', '########']),
}

// ── paint ─────────────────────────────────────────────────────────────────
export const PCX = 48
export const PCY = 4
export const DW = 384
export const DH = 236
type PaintTool = 'select' | keyof typeof TOOL_SPR
const PTOOLS: PaintTool[] = ['select', 'pencil', 'brush', 'spray', 'eraser']
const BRUSH: [number, number][] = []
for (let y = -3; y <= 3; y++) for (let x = -3; x <= 3; x++) if (x * x + y * y <= 10) BRUSH.push([x, y])
const PAL = (i: number): Rect => ({ x: 4 + (i % 2) * 21, y: 4 + Math.floor(i / 2) * 20, w: 20, h: 19 })
const PATR = (i: number): Rect => ({ x: PCX + i * 24, y: PCY + DH + 9, w: 22, h: 17 })
const PAT_IN_HAND: Rect = { x: 4, y: 68, w: 41, h: 26 }

/**
 * Paint, one bit, with the period's tools: the marquee (drag out a selection,
 * drag it to move the pixels, cut, copy and paste it), pencil, brush, spray
 * and eraser, and a patterned ink chosen from the strip below the page.
 */
export class Paint implements App {
  doc: Uint8Array = new Uint8Array(DW * DH)
  private undoDoc: Uint8Array | null = null
  tool: PaintTool = 'brush'
  private pat = 0
  private stroke: { x: number; y: number; ink: number } | null = null
  /** The selection; `bits` while it floats (lifted off the page, or pasted). */
  private sel: { x: number; y: number; w: number; h: number; bits: Bits | null } | null = null
  private marquee: { x0: number; y0: number } | null = null
  private moving: { dx: number; dy: number } | null = null
  constructor(private ctx: AppCtx) {}

  private snapshot() {
    this.undoDoc = this.doc.slice()
  }
  private patBit = (x: number, y: number) => (PATS[this.pat][y & 7] >> (7 - (x & 7))) & 1
  private setPx(x: number, y: number, v: number) {
    if (x >= 0 && y >= 0 && x < DW && y < DH) this.doc[y * DW + x] = v
  }
  private stamp(x: number, y: number) {
    const s = this.stroke
    if (!s) return
    if (this.tool === 'pencil') this.setPx(x, y, s.ink)
    else if (this.tool === 'brush') for (const [ox, oy] of BRUSH) this.setPx(x + ox, y + oy, this.patBit(x + ox, y + oy))
    else if (this.tool === 'eraser') for (let j = -6; j < 6; j++) for (let i = -6; i < 6; i++) this.setPx(x + i, y + j, 0)
  }
  private spray(x: number, y: number) {
    for (let k = 0; k < 9; k++) {
      const a = Math.random() * Math.PI * 2
      const r = Math.sqrt(Math.random()) * 9
      const px = Math.round(x + Math.cos(a) * r)
      const py = Math.round(y + Math.sin(a) * r)
      this.setPx(px, py, this.patBit(px, py))
    }
  }
  private lift() {
    const s = this.sel
    if (!s || s.bits) return
    const d = new Uint8Array(s.w * s.h)
    for (let j = 0; j < s.h; j++)
      for (let i = 0; i < s.w; i++) {
        d[j * s.w + i] = this.doc[(s.y + j) * DW + s.x + i]
        this.doc[(s.y + j) * DW + s.x + i] = 0
      }
    s.bits = { w: s.w, h: s.h, d }
  }
  /** Set the floating pixels down where they are. */
  drop() {
    const s = this.sel
    if (s?.bits) {
      // opaque, as the marquee always was: its white covers what it lands on
      for (let j = 0; j < s.h; j++) for (let i = 0; i < s.w; i++) this.setPx(s.x + i, s.y + j, s.bits.d[j * s.w + i])
    }
    this.sel = null
  }
  private copySel(): Bits | null {
    const s = this.sel
    if (!s) return null
    if (s.bits) return { w: s.w, h: s.h, d: s.bits.d.slice() }
    const d = new Uint8Array(s.w * s.h)
    for (let j = 0; j < s.h; j++) for (let i = 0; i < s.w; i++) d[j * s.w + i] = this.doc[(s.y + j) * DW + s.x + i]
    return { w: s.w, h: s.h, d }
  }
  private clearSel() {
    const s = this.sel
    if (!s) return
    if (!s.bits) for (let j = 0; j < s.h; j++) this.doc.fill(0, (s.y + j) * DW + s.x, (s.y + j) * DW + s.x + s.w)
    this.sel = null
  }

  draw(R: Raster, c: Rect) {
    PTOOLS.forEach((t, i) => {
      const r = PAL(i)
      R.frame(c.x + r.x, c.y + r.y, r.w, r.h)
      const on = this.tool === t
      if (on) R.rect(c.x + r.x + 1, c.y + r.y + 1, r.w - 2, r.h - 2, 1)
      const s = t === 'select' ? SELECT_SPR : TOOL_SPR[t]
      R.spr(s, c.x + r.x + Math.floor((r.w - s.w) / 2), c.y + r.y + Math.floor((r.h - s.h) / 2), on)
    })
    R.frame(c.x + PAT_IN_HAND.x, c.y + PAT_IN_HAND.y, PAT_IN_HAND.w, PAT_IN_HAND.h)
    R.pat(c.x + PAT_IN_HAND.x + 2, c.y + PAT_IN_HAND.y + 2, PAT_IN_HAND.w - 4, PAT_IN_HAND.h - 4, PATS[this.pat])
    R.frame(c.x + PCX - 1, c.y + PCY - 1, DW + 2, DH + 2)
    R.bits(this.doc, DW, DH, c.x + PCX, c.y + PCY)
    const s = this.sel
    if (s) {
      const ox = c.x + PCX
      const oy = c.y + PCY
      if (s.bits)
        for (let j = 0; j < s.h; j++)
          for (let i = 0; i < s.w; i++) {
            const x = s.x + i
            const y = s.y + j
            if (x >= 0 && y >= 0 && x < DW && y < DH) R.px(ox + x, oy + y, s.bits.d[j * s.w + i])
          }
      // marching ants: the dash steps along four times a second
      const ph = Math.floor(this.ctx.wall() / 250) & 1
      R.clip({ x: ox, y: oy, w: DW, h: DH })
      const X = ox + s.x
      const Y = oy + s.y
      for (let i = 0; i < s.w; i++) {
        if (((i + ph) & 1) === 0) {
          R.px(X + i, Y, 2)
          R.px(X + i, Y + s.h - 1, 2)
        }
      }
      for (let j = 1; j < s.h - 1; j++) {
        if (((j + ph) & 1) === 0) {
          R.px(X, Y + j, 2)
          R.px(X + s.w - 1, Y + j, 2)
        }
      }
      R.clip({ x: c.x, y: c.y, w: c.w, h: c.h })
    }
    PATS.forEach((p, i) => {
      const r = PATR(i)
      R.frame(c.x + r.x, c.y + r.y, r.w, r.h)
      R.pat(c.x + r.x + 1, c.y + r.y + 1, r.w - 2, r.h - 2, p)
      if (i === this.pat) R.frame(c.x + r.x - 2, c.y + r.y - 2, r.w + 4, r.h + 4)
    })
  }
  down(x: number, y: number) {
    const ti = PTOOLS.findIndex((_, i) => inRect(PAL(i), x, y))
    const pi = PATS.findIndex((_, i) => inRect(PATR(i), x, y))
    if (ti >= 0) {
      if (PTOOLS[ti] !== 'select') this.drop()
      this.tool = PTOOLS[ti]
      return
    }
    if (pi >= 0) {
      this.pat = pi
      return
    }
    const dx = x - PCX
    const dy = y - PCY
    if (dx < 0 || dy < 0 || dx >= DW || dy >= DH) return
    if (this.tool === 'select') {
      const s = this.sel
      if (s && inRect(s, dx, dy)) {
        if (!s.bits) {
          this.snapshot()
          this.lift()
        }
        this.moving = { dx: dx - s.x, dy: dy - s.y }
      } else {
        this.drop()
        this.marquee = { x0: dx, y0: dy }
        this.sel = { x: dx, y: dy, w: 1, h: 1, bits: null }
      }
      return
    }
    this.drop()
    this.snapshot()
    // the pencil draws white when it starts on black, as it always did
    this.stroke = { x: dx, y: dy, ink: this.doc[dy * DW + dx] ? 0 : 1 }
    if (this.tool === 'spray') this.spray(dx, dy)
    else this.stamp(dx, dy)
  }
  move(x: number, y: number, held: boolean) {
    if (!held) return
    const dx = Math.round(x - PCX)
    const dy = Math.round(y - PCY)
    if (this.marquee && this.sel) {
      const cx = Math.max(0, Math.min(DW - 1, dx))
      const cy = Math.max(0, Math.min(DH - 1, dy))
      const m = this.marquee
      this.sel.x = Math.min(m.x0, cx)
      this.sel.y = Math.min(m.y0, cy)
      this.sel.w = Math.abs(cx - m.x0) + 1
      this.sel.h = Math.abs(cy - m.y0) + 1
      return
    }
    if (this.moving && this.sel) {
      this.sel.x = dx - this.moving.dx
      this.sel.y = dy - this.moving.dy
      return
    }
    const s = this.stroke
    if (!s) return
    if (this.tool === 'spray') this.spray(dx, dy)
    else {
      const n = Math.max(Math.abs(dx - s.x), Math.abs(dy - s.y), 1)
      for (let i = 1; i <= n; i++) this.stamp(Math.round(s.x + ((dx - s.x) * i) / n), Math.round(s.y + ((dy - s.y) * i) / n))
    }
    s.x = dx
    s.y = dy
  }
  up() {
    // a click with no drag selects nothing
    if (this.marquee && this.sel && this.sel.w < 3 && this.sel.h < 3) this.sel = null
    this.marquee = null
    this.moving = null
    this.stroke = null
  }
  busy() {
    return !!this.sel || (!!this.stroke && this.tool === 'spray')
  }
  /** Each frame while the spray can is held. */
  tick() {
    if (this.stroke && this.tool === 'spray') this.spray(this.stroke.x, this.stroke.y)
  }
  cursor(x: number, y: number): CursorName | null {
    const dx = x - PCX
    const dy = y - PCY
    const over = dx >= 0 && dy >= 0 && dx < DW && dy < DH
    if (!over && !this.stroke && !this.marquee && !this.moving) return null
    if (this.tool === 'select') return this.sel && inRect(this.sel, dx, dy) ? 'arrow' : 'cross'
    return this.tool === 'eraser' ? 'eraser' : 'cross'
  }
  can(op: EditOp) {
    if (op === 'undo') return !!this.undoDoc
    if (op === 'cut' || op === 'copy') return !!this.sel
    if (op === 'paste') return !!this.ctx.clip.bits
    return true // clear (the selection, or the page) and select all
  }
  edit(op: EditOp) {
    if (op === 'undo' && this.undoDoc) {
      this.sel = null
      const t = this.doc
      this.doc = this.undoDoc
      this.undoDoc = t
    } else if (op === 'copy' || op === 'cut') {
      const b = this.copySel()
      if (b) this.ctx.clip.bits = b
      if (op === 'cut') {
        this.snapshot()
        this.clearSel()
      }
    } else if (op === 'paste' && this.ctx.clip.bits) {
      this.drop()
      this.snapshot()
      const b = this.ctx.clip.bits
      this.tool = 'select'
      this.sel = { x: Math.max(0, Math.round((DW - b.w) / 2)), y: Math.max(0, Math.round((DH - b.h) / 2)), w: b.w, h: b.h, bits: { w: b.w, h: b.h, d: b.d.slice() } }
    } else if (op === 'clear') {
      this.snapshot()
      if (this.sel) this.clearSel()
      else this.doc.fill(0)
    } else if (op === 'selectAll') {
      this.drop()
      this.tool = 'select'
      this.sel = { x: 0, y: 0, w: DW, h: DH, bits: null }
    }
  }
  closed() {
    this.drop()
  }
}

// ── the piano ─────────────────────────────────────────────────────────────
const WK = 20 // white key width
const WH = 64
const BKW = 12
const BKH = 40
const KX = 8
const KY = 20
const WHITES = 15 // two octaves and the top C
const WHITE_STEPS = [0, 2, 4, 5, 7, 9, 11]
/** Letters on the home row play the white keys, the row above the black ones, as on any software piano. */
const KEYMAP: Record<string, number> = { a: 0, w: 1, s: 2, e: 3, d: 4, f: 5, t: 6, g: 7, y: 8, h: 9, u: 10, j: 11, k: 12, o: 13, l: 14, p: 15, ';': 16, "'": 17 }
export const PIANO_SIZE = { w: KX * 2 + WHITES * WK + 1, h: KY + WH + 22 }

export class PianoApp implements App {
  private octave = 0 // 0 starts at middle C
  private mouseNote = -1
  private keysDown = new Map<string, number>()
  private sounding = new Map<number, number>() // midi -> how many hands hold it
  private held: 'down' | 'up' | null = null
  constructor(private ctx: AppCtx) {}
  private base = () => 60 + 12 * this.octave
  private on(m: number) {
    this.sounding.set(m, (this.sounding.get(m) ?? 0) + 1)
    this.ctx.piano()?.noteOn(m, 0.72)
  }
  private off(m: number) {
    const n = (this.sounding.get(m) ?? 0) - 1
    if (n > 0) this.sounding.set(m, n)
    else {
      this.sounding.delete(m)
      this.ctx.piano()?.noteOff(m)
    }
  }
  private whiteRect = (i: number): Rect => ({ x: KX + i * WK, y: KY, w: WK + 1, h: WH })
  private blackRect = (i: number): Rect => ({ x: KX + (i + 1) * WK - BKW / 2, y: KY, w: BKW, h: BKH })
  /** The note under a content-local point, black keys first. */
  private noteAt(x: number, y: number) {
    for (let i = 0; i < WHITES - 1; i++) {
      const step = WHITE_STEPS[i % 7]
      if (step === 4 || step === 11) continue // no black key after E or B
      if (inRect(this.blackRect(i), x, y)) return this.base() + Math.floor(i / 7) * 12 + step + 1
    }
    for (let i = 0; i < WHITES; i++) if (inRect(this.whiteRect(i), x, y)) return this.base() + Math.floor(i / 7) * 12 + WHITE_STEPS[i % 7]
    return -1
  }
  private octBtn = (k: 'down' | 'up'): Rect => ({ x: PIANO_SIZE.w - (k === 'down' ? 46 : 26), y: 3, w: 15, h: 13 })
  draw(R: Raster, c: Rect) {
    R.text('type a w s e d f t g y h u j k to play', c.x + KX, c.y + 5)
    const lo = this.base()
    const name = `c${4 + this.octave}`
    R.text(name, c.x + this.octBtn('down').x - 6 - tw(name), c.y + 5)
    arrowBtn(R, offset(this.octBtn('down'), c), ARROW_L, this.held === 'down')
    arrowBtn(R, offset(this.octBtn('up'), c), ARROW_R, this.held === 'up')
    for (let i = 0; i < WHITES; i++) {
      const r = offset(this.whiteRect(i), c)
      const m = lo + Math.floor(i / 7) * 12 + WHITE_STEPS[i % 7]
      // a white key held down goes grey, so it never runs into the black keys beside it
      if (this.sounding.has(m)) R.pat(r.x, r.y, r.w, r.h, PATS[2])
      else R.rect(r.x, r.y, r.w, r.h, 0)
      R.frame(r.x, r.y, r.w, r.h)
    }
    for (let i = 0; i < WHITES - 1; i++) {
      const step = WHITE_STEPS[i % 7]
      if (step === 4 || step === 11) continue
      const r = offset(this.blackRect(i), c)
      const m = lo + Math.floor(i / 7) * 12 + step + 1
      R.rect(r.x, r.y, r.w, r.h, 1)
      if (this.sounding.has(m)) R.rect(r.x + 2, r.y + 1, r.w - 4, r.h - 3, 0)
    }
    R.text('z x shift the octave', c.x + KX, c.y + KY + WH + 6)
  }
  down(x: number, y: number) {
    for (const k of ['down', 'up'] as const)
      if (inRect(this.octBtn(k), x, y)) {
        this.held = k
        return
      }
    const m = this.noteAt(x, y)
    if (m < 0) return
    this.mouseNote = m
    this.on(m)
  }
  move(x: number, y: number, held: boolean) {
    if (!held || this.mouseNote < 0) return
    // a glissando: drag along the keys
    const m = this.noteAt(x, y)
    if (m === this.mouseNote) return
    this.off(this.mouseNote)
    this.mouseNote = m
    if (m >= 0) this.on(m)
  }
  up(x: number, y: number) {
    if (this.held) {
      if (inRect(this.octBtn(this.held), x, y)) this.shift(this.held === 'up' ? 1 : -1)
      this.held = null
    }
    if (this.mouseNote >= 0) this.off(this.mouseNote)
    this.mouseNote = -1
  }
  private shift(d: number) {
    this.allOff()
    this.octave = Math.max(-2, Math.min(1, this.octave + d))
  }
  key(key: string) {
    const k = key.toLowerCase()
    if (k === 'z' || k === 'x') {
      this.shift(k === 'x' ? 1 : -1)
      return true
    }
    if (!(k in KEYMAP)) return false
    if (this.keysDown.has(k)) return true // a held key repeats; the string is already sounding
    const m = this.base() + KEYMAP[k]
    this.keysDown.set(k, m)
    this.on(m)
    return true
  }
  keyUp(key: string) {
    const k = key.toLowerCase()
    const m = this.keysDown.get(k)
    if (m === undefined) return false
    this.keysDown.delete(k)
    this.off(m)
    return true
  }
  private allOff() {
    for (const m of this.sounding.keys()) this.ctx.piano()?.noteOff(m)
    this.sounding.clear()
    this.keysDown.clear()
    this.mouseNote = -1
  }
  closed() {
    this.allOff()
  }
}
const offset = (r: Rect, c: Rect): Rect => ({ x: c.x + r.x, y: c.y + r.y, w: r.w, h: r.h })

// ── the guest book ────────────────────────────────────────────────────────
type GNote = { id: string; name: string; note: string; at: number }
export const GUEST_SIZE = { w: 300, h: 216 }
const G = {
  list: { x: 8, y: 6, w: 284, h: 110 },
  older: { x: 8, y: 119, w: 15, h: 13 },
  newer: { x: 27, y: 119, w: 15, h: 13 },
  name: { x: 44, y: 142, w: 130, h: 15 },
  note: { x: 44, y: 161, w: 248, h: 27 },
  sign: { x: 240, y: 194, w: 52, h: 17 },
}
const G_NAME_MAX = 24
const G_NOTE_MAX = 140
const ago = (ms: number) => {
  const m = Math.floor(ms / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  return d < 30 ? `${d}d ago` : `${Math.floor(d / 30)}mo ago`
}
/** What the system font can draw; anything else in a stored note shows as nothing. */
const drawable = (s: string) => [...s].filter((ch) => typeable(ch) && ch !== '\n').join('')

/**
 * The guest book: leave your name and a line, and it stays on the wall for
 * everyone who opens the machine after you. The wall lives on the server
 * (/api/guestbook), which also does the moderation; this only checks what it
 * can say instantly (an empty field, a note too long) and shows the server's
 * reason when a note does not go up.
 */
export class GuestBook implements App {
  private notes: GNote[] = []
  private state: 'loading' | 'ready' | 'offline' = 'loading'
  private page = 0
  private pages: number[][] = []
  private field: 'name' | 'note' | null = 'name'
  private name = ''
  private note = ''
  private status = ''
  private sending = false
  private held: Rect | null = null
  private shownPhase = -1
  private loadedAt = -1e9
  private phase = () => Math.floor(this.ctx.wall() / (this.ctx.prefs.caret === 'fast' ? 280 : 560))
  constructor(private ctx: AppCtx) {}

  /** Fetch the wall (on open, and again if it has been a while). */
  load() {
    if (this.ctx.wall() - this.loadedAt < 20_000 && this.state === 'ready') return
    this.loadedAt = this.ctx.wall()
    fetch('/api/guestbook', { cache: 'no-store' })
      .then((r) => r.json())
      .then((j: { notes?: GNote[] }) => {
        this.notes = Array.isArray(j.notes) ? j.notes : []
        this.state = 'ready'
        this.paginate()
        this.ctx.dirty()
      })
      .catch(() => {
        this.state = 'offline'
        this.ctx.dirty()
      })
  }
  private lines = (n: GNote) => wrapPx(drawable(n.note), G.list.w - 8)
  /** Lay the notes into pages that fit the list. */
  private paginate() {
    this.pages = []
    let cur: number[] = []
    let used = 0
    this.notes.forEach((n, i) => {
      const h = 12 + this.lines(n).length * 11 + 5
      if (cur.length && used + h > G.list.h) {
        this.pages.push(cur)
        cur = []
        used = 0
      }
      cur.push(i)
      used += h
    })
    if (cur.length) this.pages.push(cur)
    this.page = Math.min(this.page, Math.max(0, this.pages.length - 1))
  }
  private submit() {
    if (this.sending) return
    const name = this.name.trim()
    const note = this.note.trim()
    if (!name) {
      this.status = 'add your name'
      this.field = 'name'
      return
    }
    if (!note) {
      this.status = 'write a note first'
      this.field = 'note'
      return
    }
    this.sending = true
    this.status = 'signing…'
    fetch('/api/guestbook', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, note, website: '' }) })
      .then(async (r) => {
        const j = (await r.json().catch(() => ({}))) as { note?: GNote; error?: string }
        if (r.ok && j.note) {
          this.notes.unshift(j.note)
          this.note = ''
          this.page = 0
          this.paginate()
          this.status = 'thanks, it is up'
          this.ctx.sfx('chime')
        } else {
          this.status = j.error ?? 'that one could not go up'
          this.ctx.sfx('beep')
        }
      })
      .catch(() => {
        this.status = 'could not reach the guest book'
      })
      .finally(() => {
        this.sending = false
        this.ctx.dirty()
      })
  }
  private box(R: Raster, c: Rect, r: Rect, text: string, on: boolean, multi: boolean) {
    R.rect(c.x + r.x, c.y + r.y, r.w, r.h, 0)
    R.frame(c.x + r.x, c.y + r.y, r.w, r.h)
    const w = r.w - 8
    let rows = multi ? wrapPx(text, w) : [text]
    if (!rows.length) rows = ['']
    if (multi && rows.length > 2) rows = rows.slice(-2)
    // a single line that runs long shows its end, where the typing is
    if (!multi && tw(rows[0]) > w) {
      let t = rows[0]
      while (t && tw(t) > w) t = t.slice(1)
      rows = [t]
    }
    rows.forEach((row, i) => R.text(row, c.x + r.x + 4, c.y + r.y + 3 + i * 11))
    if (on && this.shownPhase % 2 === 0) {
      const last = rows[rows.length - 1]
      R.rect(c.x + r.x + 4 + tw(last) + 1, c.y + r.y + 2 + (rows.length - 1) * 11, 1, 11, 1)
    }
  }
  draw(R: Raster, c: Rect) {
    this.shownPhase = this.phase()
    const L = G.list
    if (this.state !== 'ready' || !this.notes.length) {
      const t = this.state === 'loading' ? 'opening the book…' : this.state === 'offline' ? 'the guest book is resting. try later.' : 'no one has signed yet. be the first.'
      R.text(t, c.x + L.x + Math.round((L.w - tw(t)) / 2), c.y + L.y + 48)
    } else {
      let y = c.y + L.y
      for (const i of this.pages[this.page] ?? []) {
        const n = this.notes[i]
        const name = drawable(n.name)
        R.text(name, c.x + L.x, y, 1, true)
        R.text(ago(Date.now() - n.at), c.x + L.x + tw(name, true) + 8, y)
        y += 12
        for (const l of this.lines(n)) {
          R.text(l, c.x + L.x + 8, y)
          y += 11
        }
        y += 5
      }
    }
    // the pager, only when there is more than a page (nothing here that cannot be clicked)
    const at = (r: Rect) => ({ x: c.x + r.x, y: c.y + r.y, w: r.w, h: r.h })
    if (this.pages.length > 1) {
      if (this.page < this.pages.length - 1) arrowBtn(R, at(G.older), ARROW_L, this.held === G.older)
      if (this.page > 0) arrowBtn(R, at(G.newer), ARROW_R, this.held === G.newer)
      R.text(`page ${this.page + 1} of ${this.pages.length}`, c.x + G.newer.x + 22, c.y + G.older.y + 2)
    }
    const count = this.state === 'ready' ? `${this.notes.length} note${this.notes.length === 1 ? '' : 's'}` : ''
    R.text(count, c.x + L.x + L.w - tw(count), c.y + G.older.y + 2)
    for (let x = c.x + 8; x < c.x + GUEST_SIZE.w - 8; x += 2) R.px(x, c.y + 137, 1)
    R.text('name', c.x + 10, c.y + G.name.y + 3, 1, true)
    this.box(R, c, G.name, this.name, this.field === 'name', false)
    R.text('note', c.x + 10, c.y + G.note.y + 3, 1, true)
    this.box(R, c, G.note, this.note, this.field === 'note', true)
    R.text(this.status || `${G_NOTE_MAX - this.note.length} letters left · keep it kind`, c.x + 10, c.y + G.sign.y + 4)
    button(R, at(G.sign), this.sending ? '…' : 'sign', this.held === G.sign, true)
  }
  down(x: number, y: number) {
    if (inRect(G.name, x, y)) this.field = 'name'
    else if (inRect(G.note, x, y)) this.field = 'note'
    else if (inRect(G.sign, x, y)) this.held = G.sign
    else if (this.pages.length > 1 && this.page < this.pages.length - 1 && inRect(G.older, x, y)) this.held = G.older
    else if (this.pages.length > 1 && this.page > 0 && inRect(G.newer, x, y)) this.held = G.newer
  }
  move(x: number, y: number, held: boolean) {
    if (held && this.held && !inRect(this.held, x, y)) this.held = null
  }
  up(x: number, y: number) {
    const r = this.held
    this.held = null
    if (!r || !inRect(r, x, y)) return
    if (r === G.sign) this.submit()
    else this.page = Math.max(0, Math.min(this.pages.length - 1, this.page + (r === G.older ? 1 : -1)))
  }
  private put(s: string) {
    if (this.field === 'name') this.name = s.slice(0, G_NAME_MAX)
    else if (this.field === 'note') this.note = s.slice(0, G_NOTE_MAX)
    if (!this.sending) this.status = ''
  }
  key(key: string) {
    if (key === 'Tab') {
      this.field = this.field === 'name' ? 'note' : 'name'
      return true
    }
    if (key === 'Enter') {
      if (this.field === 'name') this.field = 'note'
      else this.submit()
      return true
    }
    if (!this.field) return false
    const cur = this.field === 'name' ? this.name : this.note
    if (key === 'Backspace') this.put(cur.slice(0, -1))
    else if (key.length === 1 && typeable(key)) this.put(cur + key)
    else return false
    return true
  }
  cursor(x: number, y: number): CursorName | null {
    return inRect(G.name, x, y) || inRect(G.note, x, y) ? 'ibeam' : null
  }
  busy() {
    return !!this.field && this.phase() !== this.shownPhase
  }
  textField() {
    if (!this.field) return null
    return { value: this.field === 'name' ? this.name : this.note, max: this.field === 'name' ? G_NAME_MAX : G_NOTE_MAX }
  }
  setText(value: string) {
    this.put(drawable(value))
  }
  can(op: EditOp) {
    const cur = this.field === 'name' ? this.name : this.field === 'note' ? this.note : ''
    if (op === 'paste') return !!this.field && !!this.ctx.clip.text
    if (op === 'copy' || op === 'cut' || op === 'clear') return !!cur
    return false
  }
  edit(op: EditOp) {
    const cur = this.field === 'name' ? this.name : this.field === 'note' ? this.note : ''
    if (op === 'copy' || op === 'cut') this.ctx.clip.text = cur
    if (op === 'cut' || op === 'clear') this.put('')
    if (op === 'paste' && this.ctx.clip.text) this.put(cur + drawable(this.ctx.clip.text))
  }
}

// ── calculator ────────────────────────────────────────────────────────────
const CK = 26 // key size
const CG = 4
const CX0 = 8
const CY0 = 34
const CALC_KEYS: { k: string; c: number; r: number; w?: number; h?: number }[] = [
  { k: 'C', c: 0, r: 0 },
  { k: 'E', c: 1, r: 0 },
  { k: '=', c: 2, r: 0 },
  { k: '*', c: 3, r: 0 },
  { k: '7', c: 0, r: 1 },
  { k: '8', c: 1, r: 1 },
  { k: '9', c: 2, r: 1 },
  { k: '/', c: 3, r: 1 },
  { k: '4', c: 0, r: 2 },
  { k: '5', c: 1, r: 2 },
  { k: '6', c: 2, r: 2 },
  { k: '-', c: 3, r: 2 },
  { k: '1', c: 0, r: 3 },
  { k: '2', c: 1, r: 3 },
  { k: '3', c: 2, r: 3 },
  { k: '+', c: 3, r: 3, h: 2 },
  { k: '0', c: 0, r: 4, w: 2 },
  { k: '.', c: 2, r: 4 },
]
const calcRect = (q: (typeof CALC_KEYS)[number]): Rect => ({
  x: CX0 + q.c * (CK + CG),
  y: CY0 + q.r * (CK + CG - 4),
  w: (q.w ?? 1) * CK + ((q.w ?? 1) - 1) * CG,
  h: (q.h ?? 1) * (CK - 4) + ((q.h ?? 1) - 1) * CG,
})
export const CALC_SIZE = { w: CX0 * 2 + 4 * CK + 3 * CG, h: CY0 + 5 * (CK + CG - 4) + 4 }

/** The four-function calculator, immediate execution, the keys clickable and typeable. */
export class Calculator implements App {
  private entry = '0'
  private acc: number | null = null
  private op: string | null = null
  private fresh = true
  private held: string | null = null
  private flash: { k: string; at: number } | null = null
  constructor(private ctx: AppCtx) {}
  private fmt(n: number) {
    if (!Number.isFinite(n)) return 'error'
    let s = String(Number(n.toPrecision(10)))
    if (s.length > 12) s = n.toExponential(5)
    return s
  }
  private apply(a: number, op: string, b: number) {
    return op === '+' ? a + b : op === '-' ? a - b : op === '*' ? a * b : b === 0 ? NaN : a / b
  }
  press(k: string) {
    this.flash = { k, at: this.ctx.wall() }
    if (this.entry === 'error' && k !== 'C') return
    if (/^[0-9]$/.test(k)) {
      if (this.fresh) this.entry = k
      else if (this.entry === '0') this.entry = k
      else if (this.entry.replace(/[-.]/g, '').length < 12) this.entry += k
      this.fresh = false
    } else if (k === '.') {
      if (this.fresh) this.entry = '0.'
      else if (!this.entry.includes('.')) this.entry += '.'
      this.fresh = false
    } else if ('+-*/'.includes(k)) {
      const v = Number(this.entry)
      if (this.acc === null || this.op === null) this.acc = v
      else if (!this.fresh) this.acc = this.apply(this.acc, this.op, v)
      this.entry = this.fmt(this.acc)
      this.op = k
      this.fresh = true
    } else if (k === '=') {
      if (this.op !== null && this.acc !== null) this.entry = this.fmt(this.apply(this.acc, this.op, Number(this.entry)))
      this.acc = null
      this.op = null
      this.fresh = true
    } else if (k === 'C') {
      this.entry = '0'
      this.acc = null
      this.op = null
      this.fresh = true
    } else if (k === 'E') {
      this.entry = '0'
      this.fresh = false
    } else if (k === 'back' && !this.fresh) this.entry = this.entry.length > 1 ? this.entry.slice(0, -1) : '0'
  }
  draw(R: Raster, c: Rect) {
    R.frame(c.x + CX0, c.y + 8, CALC_SIZE.w - 2 * CX0, 20)
    const s = this.entry
    R.text(s, c.x + CALC_SIZE.w - CX0 - 6 - tw(s, true), c.y + 13, 1, true)
    const lit = this.flash && this.ctx.wall() - this.flash.at < 110 ? this.flash.k : null
    for (const q of CALC_KEYS) {
      const r = calcRect(q)
      const label = q.k === '*' ? '×' : q.k
      button(R, { x: c.x + r.x, y: c.y + r.y, w: r.w, h: r.h }, label, this.held === q.k || lit === q.k)
    }
  }
  down(x: number, y: number) {
    const q = CALC_KEYS.find((q) => inRect(calcRect(q), x, y))
    this.held = q?.k ?? null
  }
  move(x: number, y: number, held: boolean) {
    if (!held || !this.held) return
    const q = CALC_KEYS.find((q) => q.k === this.held)
    if (q && !inRect(calcRect(q), x, y)) this.held = null
  }
  up(x: number, y: number) {
    const k = this.held
    this.held = null
    const q = CALC_KEYS.find((q) => q.k === k)
    if (q && inRect(calcRect(q), x, y)) this.press(q.k)
  }
  key(key: string) {
    const map: Record<string, string> = { Enter: '=', '=': '=', x: '*', X: '*', '*': '*', '+': '+', '-': '-', '/': '/', '.': '.', c: 'C', C: 'C', e: 'E', E: 'E', Backspace: 'back', Delete: 'C' }
    const k = /^[0-9]$/.test(key) ? key : map[key]
    if (!k) return false
    this.press(k)
    return true
  }
  busy() {
    return !!this.flash && this.ctx.wall() - this.flash.at < 160
  }
  can(op: EditOp) {
    return op === 'copy' || (op === 'paste' && !!this.ctx.clip.text && Number.isFinite(Number(this.ctx.clip.text.trim())))
  }
  edit(op: EditOp) {
    if (op === 'copy') this.ctx.clip.text = this.entry
    else if (op === 'paste' && this.ctx.clip.text) {
      const n = Number(this.ctx.clip.text.trim())
      if (Number.isFinite(n)) {
        this.entry = this.fmt(n)
        this.fresh = false
      }
    }
  }
}

// ── note pad ──────────────────────────────────────────────────────────────
const NP_PAGES = 8
const NP_X = 8
const NP_Y = 6
const NP_LH = 12
const NP_W = 220
const NP_LINES = 10
export const NOTES_SIZE = { w: NP_W, h: NP_Y + NP_LINES * NP_LH + 26 }
const NP_TEXT_W = NP_W - 2 * NP_X
const NP_MAX = 900
type Line = { a: number; b: number; xs: number[] }

/** Greedy word wrap that keeps every character's x, for the caret, selection and hit tests. */
function layout(t: string, maxW: number): Line[] {
  const lines: Line[] = []
  let i = 0
  for (;;) {
    let j = t.indexOf('\n', i)
    if (j < 0) j = t.length
    let a = i
    if (a === j) lines.push({ a, b: j, xs: [0] })
    while (a < j) {
      let x = 0
      let k = a
      let space = -1
      const xs = [0]
      while (k < j) {
        const w = glyph(t[k]).w + 1
        if (x + w - 1 > maxW && k > a) break
        x += w
        xs.push(x)
        if (t[k] === ' ') space = k
        k++
      }
      if (k < j && space >= a) {
        k = space + 1
        xs.length = k - a + 1
      }
      lines.push({ a, b: k, xs })
      a = k
    }
    if (j >= t.length) break
    i = j + 1
  }
  return lines
}

/**
 * The note pad: eight pages that remember what was typed on them (in this
 * browser), turned by the dog-ear at the bottom corner. Click to place the
 * insertion point, drag to select; typing, cut, copy, paste, clear and undo
 * all work on the page.
 */
export class NotePad implements App {
  private pages: string[]
  private page = 0
  private caret = 0
  private anchor = 0
  private undoState: { page: number; text: string; caret: number } | null = null
  private lastType = -1e9
  private dragging = false
  private shownPhase = -1
  private phase = () => Math.floor(this.ctx.wall() / (this.ctx.prefs.caret === 'fast' ? 280 : 560))
  constructor(private ctx: AppCtx) {
    const saved = store.get<string[]>('yh:mac-notes', [])
    this.pages = Array.from({ length: NP_PAGES }, (_, i) => (typeof saved[i] === 'string' ? saved[i] : ''))
    if (!saved.length) this.pages[0] = 'a note pad that remembers. type anything, it stays here for next time.\n\n'
    this.caret = this.anchor = this.pages[0].length
  }
  private get text() {
    return this.pages[this.page]
  }
  private save() {
    store.set('yh:mac-notes', this.pages)
  }
  private selRange(): [number, number] {
    return [Math.min(this.caret, this.anchor), Math.max(this.caret, this.anchor)]
  }
  private hasSel() {
    return this.caret !== this.anchor
  }
  private remember(force = false) {
    const now = this.ctx.wall()
    // one undo step per burst of typing, not per letter
    if (force || now - this.lastType > 900) this.undoState = { page: this.page, text: this.text, caret: this.caret }
    this.lastType = force ? -1e9 : now
  }
  /** Replace the selection with `s`, if the page still fits. */
  private replace(s: string, force = false) {
    const [a, b] = this.selRange()
    const next = this.text.slice(0, a) + s + this.text.slice(b)
    if (next.length > NP_MAX || layout(next, NP_TEXT_W).length > NP_LINES) {
      this.ctx.sfx('beep')
      return
    }
    this.remember(force)
    this.pages[this.page] = next
    this.caret = this.anchor = a + s.length
    this.save()
  }
  private pos(p: number, lines: Line[]): [number, number] {
    let li = 0
    for (let i = 0; i < lines.length; i++) if (p >= lines[i].a && p <= lines[i].b) li = i
    const L = lines[li]
    return [L.xs[Math.min(L.xs.length - 1, p - L.a)], li]
  }
  private hit(x: number, y: number): number {
    const lines = layout(this.text, NP_TEXT_W)
    const li = Math.max(0, Math.min(lines.length - 1, Math.floor((y - NP_Y) / NP_LH)))
    const L = lines[li]
    const lx = x - NP_X
    let best = 0
    for (let i = 0; i < L.xs.length; i++) if (Math.abs(L.xs[i] - lx) < Math.abs(L.xs[best] - lx)) best = i
    return L.a + best
  }
  private dogEar = (): Rect => ({ x: 0, y: NOTES_SIZE.h - 18, w: 18, h: 18 })
  draw(R: Raster, c: Rect) {
    const lines = layout(this.text, NP_TEXT_W)
    const [sa, sb] = this.selRange()
    lines.forEach((L, i) => {
      const y = c.y + NP_Y + i * NP_LH
      R.text(this.text.slice(L.a, L.b), c.x + NP_X, y)
      if (sa === sb) return
      const a = Math.max(sa, L.a)
      const b = Math.min(sb, L.b)
      const nl = sb > L.b && sa <= L.b // the selection runs on past this line's end
      if (a > b || (a === b && !nl)) return
      const x0 = L.xs[a - L.a]
      const x1 = nl ? NP_TEXT_W + 2 : L.xs[b - L.a]
      R.rect(c.x + NP_X + x0 - 1, y - 1, x1 - x0 + 1, NP_LH, 2)
    })
    // the insertion point
    this.shownPhase = this.phase()
    if (!this.hasSel() && this.shownPhase % 2 === 0) {
      const [x, li] = this.pos(this.caret, lines)
      R.rect(c.x + NP_X + x - 1, c.y + NP_Y + li * NP_LH - 1, 1, 11, 1)
    }
    // the dog-ear, and the page number
    const d = this.dogEar()
    const dx = c.x + d.x
    const dy = c.y + d.y
    R.rect(dx, dy, d.w, d.h, 0)
    R.line(dx, dy, dx + d.w - 1, dy + d.h - 1)
    R.line(dx, dy, dx + d.w - 1, dy)
    R.line(dx + d.w - 1, dy, dx + d.w - 1, dy + d.h - 1)
    for (let j = 1; j < d.h - 1; j++) for (let i = 0; i < j; i++) if ((i + j) & 1) R.px(dx + d.w - 1 - i, dy + j, 1)
    const n = String(this.page + 1)
    R.text(n, c.x + Math.round((NP_W - tw(n)) / 2), c.y + NOTES_SIZE.h - 14)
  }
  down(x: number, y: number, dbl: boolean) {
    const d = this.dogEar()
    if (inRect(d, x, y)) {
      // the lower half of the corner turns forward, the upper half back
      const fwd = y - d.y > x - d.x
      this.page = (this.page + (fwd ? 1 : NP_PAGES - 1)) % NP_PAGES
      this.caret = this.anchor = this.text.length
      return
    }
    const p = this.hit(x, y)
    if (dbl) {
      // a double click takes the word
      const t = this.text
      let a = p
      let b = p
      while (a > 0 && /\S/.test(t[a - 1])) a--
      while (b < t.length && /\S/.test(t[b])) b++
      this.anchor = a
      this.caret = b
      return
    }
    this.caret = this.anchor = p
    this.dragging = true
  }
  move(x: number, y: number, held: boolean) {
    if (held && this.dragging) this.caret = this.hit(x, y)
  }
  up() {
    this.dragging = false
  }
  key(key: string) {
    const t = this.text
    if (key === 'Backspace') {
      if (!this.hasSel()) {
        if (this.caret === 0) return true
        this.anchor = this.caret - 1
      }
      this.replace('')
    } else if (key === 'Enter') this.replace('\n')
    else if (key === 'ArrowLeft' || key === 'ArrowRight') {
      const [a, b] = this.selRange()
      if (this.hasSel()) this.caret = key === 'ArrowLeft' ? a : b
      else this.caret = Math.max(0, Math.min(t.length, this.caret + (key === 'ArrowLeft' ? -1 : 1)))
      this.anchor = this.caret
    } else if (key === 'ArrowUp' || key === 'ArrowDown') {
      const lines = layout(t, NP_TEXT_W)
      const [x, li] = this.pos(this.caret, lines)
      const to = li + (key === 'ArrowUp' ? -1 : 1)
      if (to < 0) this.caret = 0
      else if (to >= lines.length) this.caret = t.length
      else this.caret = this.hit(NP_X + x, NP_Y + to * NP_LH + 2)
      this.anchor = this.caret
    } else if (key.length === 1 && typeable(key)) this.replace(key)
    else return false
    return true
  }
  cursor(x: number, y: number): CursorName | null {
    return inRect(this.dogEar(), x, y) ? null : 'ibeam'
  }
  busy() {
    return this.phase() !== this.shownPhase // only when the insertion point blinks
  }
  can(op: EditOp) {
    if (op === 'undo') return !!this.undoState
    if (op === 'cut' || op === 'copy' || op === 'clear') return this.hasSel()
    if (op === 'paste') return !!this.ctx.clip.text
    return true
  }
  edit(op: EditOp) {
    const [a, b] = this.selRange()
    if (op === 'undo' && this.undoState) {
      const u = this.undoState
      const redo = { page: u.page, text: this.pages[u.page], caret: this.caret }
      this.pages[u.page] = u.text
      this.page = u.page
      this.caret = this.anchor = Math.min(u.caret, u.text.length)
      this.undoState = redo
      this.save()
    } else if (op === 'copy' || op === 'cut') {
      const s = this.text.slice(a, b)
      this.ctx.clip.text = s
      try {
        void navigator.clipboard?.writeText(s)
      } catch {
        /* the system clipboard is a bonus */
      }
      if (op === 'cut') this.replace('', true)
    } else if (op === 'paste' && this.ctx.clip.text) this.replace([...this.ctx.clip.text].filter(typeable).join(''), true)
    else if (op === 'clear') this.replace('', true)
    else if (op === 'selectAll') {
      this.anchor = 0
      this.caret = this.text.length
    }
  }
}

// ── alarm clock ───────────────────────────────────────────────────────────
export const ALARM_SIZE = { w: 196, h: 62 }
type AlarmSet = { h: number; m: number; on: boolean }
const AL = {
  hDown: { x: 44, y: 34, w: 11, h: 13 },
  hUp: { x: 74, y: 34, w: 11, h: 13 },
  mDown: { x: 92, y: 34, w: 11, h: 13 },
  mUp: { x: 122, y: 34, w: 11, h: 13 },
  toggle: { x: 152, y: 32, w: 36, h: 17 },
}
const clock12 = (h: number) => `${h % 12 === 0 ? 12 : h % 12}`
const pad2 = (n: number) => (n < 10 ? `0${n}` : `${n}`)

/**
 * The alarm clock: the time where you are, to the second, and an alarm you
 * set with the arrows and switch on. When it goes off the menu bar's star
 * trades places with a bell and the machine chimes, until you look.
 */
export class AlarmClock implements App {
  set: AlarmSet
  ringing = false
  private firedKey = ''
  private held: Rect | null = null
  private lastChime = -1e9
  private chimes = 0
  constructor(private ctx: AppCtx) {
    const s = store.get<Partial<AlarmSet>>('yh:mac-alarm', {})
    this.set = { h: typeof s.h === 'number' ? s.h % 24 : 7, m: typeof s.m === 'number' ? s.m % 60 : 30, on: !!s.on }
  }
  private save() {
    store.set('yh:mac-alarm', this.set)
  }
  /** Every second or so: does the alarm go off? */
  tick(now: Date) {
    const key = `${now.toDateString()} ${now.getHours()}:${now.getMinutes()}`
    if (this.set.on && now.getHours() === this.set.h && now.getMinutes() === this.set.m && this.firedKey !== key) {
      this.firedKey = key
      this.ringing = true
      this.chimes = 0
      this.lastChime = -1e9
    }
    if (this.ringing && this.chimes < 4 && this.ctx.wall() - this.lastChime > 5000) {
      this.lastChime = this.ctx.wall()
      this.chimes++
      this.ctx.sfx('chime')
    }
  }
  /** Looked at: the ringing stops. */
  hush() {
    this.ringing = false
  }
  draw(R: Raster, c: Rect) {
    const now = new Date()
    const t = `${clock12(now.getHours())}:${pad2(now.getMinutes())}:${pad2(now.getSeconds())} ${now.getHours() < 12 ? 'am' : 'pm'}`
    R.text(t, c.x + 10, c.y + 9, 1, true)
    const d = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).toLowerCase()
    R.text(d, c.x + ALARM_SIZE.w - 10 - tw(d), c.y + 9)
    for (let x = c.x + 8; x < c.x + ALARM_SIZE.w - 8; x += 2) R.px(x, c.y + 25, 1)
    R.text('alarm', c.x + 10, c.y + 36)
    const at = (r: Rect) => ({ x: c.x + r.x, y: c.y + r.y, w: r.w, h: r.h })
    arrowBtn(R, at(AL.hDown), ARROW_L, this.held === AL.hDown)
    const hh = clock12(this.set.h)
    R.text(hh, c.x + 65 - Math.round(tw(hh) / 2), c.y + 36)
    arrowBtn(R, at(AL.hUp), ARROW_R, this.held === AL.hUp)
    arrowBtn(R, at(AL.mDown), ARROW_L, this.held === AL.mDown)
    R.text(pad2(this.set.m), c.x + 107, c.y + 36)
    arrowBtn(R, at(AL.mUp), ARROW_R, this.held === AL.mUp)
    R.text(this.set.h < 12 ? 'am' : 'pm', c.x + 135, c.y + 36)
    button(R, at(AL.toggle), this.set.on ? 'on' : 'off', this.held === AL.toggle || this.set.on, this.set.on)
    if (this.ringing) R.spr(BELL, c.x + ALARM_SIZE.w - 18, c.y + 36)
  }
  down(x: number, y: number) {
    this.hush()
    this.held = Object.values(AL).find((r) => inRect(r, x, y)) ?? null
  }
  move(x: number, y: number, held: boolean) {
    if (held && this.held && !inRect(this.held, x, y)) this.held = null
  }
  up(x: number, y: number) {
    const r = this.held
    this.held = null
    if (!r || !inRect(r, x, y)) return
    if (r === AL.hDown) this.set.h = (this.set.h + 23) % 24
    else if (r === AL.hUp) this.set.h = (this.set.h + 1) % 24
    else if (r === AL.mDown) this.set.m = (this.set.m + 55) % 60
    else if (r === AL.mUp) this.set.m = (this.set.m + 5) % 60
    else this.set.on = !this.set.on
    this.firedKey = ''
    this.save()
  }
}

// ── control panel ─────────────────────────────────────────────────────────
export const CONTROL_SIZE = { w: 260, h: 134 }
const CP = {
  fat: { x: 10, y: 22, w: 56, h: 56 },
  preview: { x: 74, y: 22, w: 36, h: 56 },
  prev: { x: 74, y: 82, w: 17, h: 13 },
  next: { x: 93, y: 82, w: 17, h: 13 },
  slider: { x: 136, y: 24, w: 112, h: 14 },
}
const blinkRadio = (i: number): Rect => ({ x: 136 + i * 30, y: 70, w: 26, h: 10 })
const caretRadio = (i: number): Rect => ({ x: 136 + i * 46, y: 110, w: 42, h: 10 })

/**
 * The control panel: the desktop pattern (edit it in fat bits, or step through
 * the presets), the speaker volume, how many times a chosen menu item blinks,
 * and how fast the insertion point does. Everything takes effect at once and
 * is remembered.
 */
export class ControlPanel implements App {
  private held: Rect | null = null
  private painting: number | null = null // the bit being laid while dragging in fat bits
  private sliding = false
  private shownPhase = -1
  private phase = () => Math.floor(this.ctx.wall() / (this.ctx.prefs.caret === 'fast' ? 280 : 560))
  constructor(private ctx: AppCtx) {}
  private bit = (x: number, y: number) => (this.ctx.prefs.pattern[y] >> (7 - x)) & 1
  private setBit(x: number, y: number, v: number) {
    const p = [...this.ctx.prefs.pattern]
    p[y] = v ? p[y] | (1 << (7 - x)) : p[y] & ~(1 << (7 - x))
    this.ctx.setPrefs({ pattern: p })
  }
  private volFrom(x: number) {
    return Math.max(0, Math.min(7, Math.round(((x - CP.slider.x) / CP.slider.w) * 7)))
  }
  draw(R: Raster, c: Rect) {
    const at = (r: Rect) => ({ x: c.x + r.x, y: c.y + r.y, w: r.w, h: r.h })
    R.text('desktop pattern', c.x + 10, c.y + 7)
    // fat bits
    const f = at(CP.fat)
    R.frame(f.x - 1, f.y - 1, f.w + 2, f.h + 2)
    for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) R.rect(f.x + x * 7, f.y + y * 7, 6, 6, this.bit(x, y))
    const pv = at(CP.preview)
    R.frame(pv.x - 1, pv.y - 1, pv.w + 2, pv.h + 2)
    R.pat(pv.x, pv.y, pv.w, pv.h, this.ctx.prefs.pattern)
    arrowBtn(R, at(CP.prev), ARROW_L, this.held === CP.prev)
    arrowBtn(R, at(CP.next), ARROW_R, this.held === CP.next)
    R.text('click the bits to draw', c.x + 10, c.y + 106)
    R.text('or step through the set', c.x + 10, c.y + 118)
    for (let y = c.y + 8; y < c.y + CONTROL_SIZE.h - 8; y += 2) R.px(c.x + 124, y, 1)
    // volume
    R.text('speaker volume', c.x + 136, c.y + 7)
    const s = at(CP.slider)
    R.rect(s.x, s.y + 6, s.w, 2, 1)
    for (let i = 0; i <= 7; i++) {
      const tx = s.x + Math.round((i / 7) * s.w)
      R.rect(tx, s.y + 10, 1, 3, 1)
      R.text(String(i), tx - 2, s.y + 15)
    }
    const kx = s.x + Math.round((this.ctx.prefs.volume / 7) * s.w)
    R.rect(kx - 3, s.y, 7, 9, 0)
    R.frame(kx - 3, s.y, 7, 9)
    R.rect(kx - 1, s.y + 2, 3, 5, 1)
    // menu blinking
    R.text('menu blinking', c.x + 136, c.y + 56)
    for (let i = 0; i < 3; i++) {
      const r = at(blinkRadio(i))
      radio(R, r.x, r.y + 1, this.ctx.prefs.blinks === i + 1)
      R.text(String(i + 1), r.x + 10, r.y)
    }
    // insertion point
    R.text('insertion point blinking', c.x + 136, c.y + 96)
    ;(['slow', 'fast'] as const).forEach((v, i) => {
      const r = at(caretRadio(i))
      radio(R, r.x, r.y + 1, this.ctx.prefs.caret === v)
      R.text(v, r.x + 10, r.y)
    })
    // the bar of the insertion point, blinking at the chosen rate, beside the radios
    this.shownPhase = this.phase()
    if (this.shownPhase % 2 === 0) R.rect(c.x + 236, c.y + 109, 1, 11, 1)
  }
  down(x: number, y: number) {
    if (inRect(CP.fat, x, y)) {
      const bx = Math.min(7, Math.floor((x - CP.fat.x) / 7))
      const by = Math.min(7, Math.floor((y - CP.fat.y) / 7))
      this.painting = this.bit(bx, by) ? 0 : 1
      this.setBit(bx, by, this.painting)
      return
    }
    if (inRect({ x: CP.slider.x - 6, y: CP.slider.y - 4, w: CP.slider.w + 12, h: 22 }, x, y)) {
      this.sliding = true
      this.ctx.setPrefs({ volume: this.volFrom(x) })
      return
    }
    for (let i = 0; i < 3; i++)
      if (inRect(blinkRadio(i), x, y)) {
        this.ctx.setPrefs({ blinks: i + 1 })
        return
      }
    ;(['slow', 'fast'] as const).forEach((v, i) => {
      if (inRect(caretRadio(i), x, y)) this.ctx.setPrefs({ caret: v })
    })
    for (const r of [CP.prev, CP.next]) if (inRect(r, x, y)) this.held = r
  }
  move(x: number, y: number, held: boolean) {
    if (!held) return
    if (this.painting !== null && inRect(CP.fat, x, y)) {
      this.setBit(Math.min(7, Math.floor((x - CP.fat.x) / 7)), Math.min(7, Math.floor((y - CP.fat.y) / 7)), this.painting)
    } else if (this.sliding) this.ctx.setPrefs({ volume: this.volFrom(x) })
    else if (this.held && !inRect(this.held, x, y)) this.held = null
  }
  up(x: number, y: number) {
    if (this.sliding) this.ctx.sfx('beep') // hear what it is set to
    this.sliding = false
    this.painting = null
    const r = this.held
    this.held = null
    if (r && inRect(r, x, y)) {
      // step from wherever the current pattern sits in the set (a drawn one starts at the top)
      const cur = PATS.findIndex((p) => p.every((v, i) => v === this.ctx.prefs.pattern[i]))
      const n = PATS.length
      const i = cur < 0 ? (r === CP.next ? 0 : n - 1) : (cur + (r === CP.next ? 1 : n - 1)) % n
      this.ctx.setPrefs({ pattern: [...PATS[i]] })
    }
  }
  busy() {
    return this.phase() !== this.shownPhase // the sample insertion point blinks
  }
}

/** The folder sprite, re-exported for MacHero's list view and windows. */
export const FOLDER_ICON = () => buildIcon(32, 32, folderOutline)

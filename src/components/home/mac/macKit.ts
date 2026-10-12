import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'

import { fillet, lift, mixRing, rrRing, smooth, stitch, type P2 } from './studioKit'

/**
 * The Classic's workshop: the compact all-in-one's case, lofted the way the
 * CRT's is (crtKit), plus its one-button mouse and the floppy that lives in
 * its slot. MacHero assembles the machine from these and keeps everything
 * that moves. The keyboard is crtKit's own: a fifteen-unit, five-row board is
 * already the compact layout this machine shipped with.
 *
 * Proportions follow the 1984 case: about 1 wide, 1.4 tall and 1.1 deep, the
 * tube high in the front with a deep sculpted bezel sloping down onto curved
 * glass, the floppy slot under it right of centre, the front piece and the rear
 * housing meeting at a parting line a fifth of the way back.
 */

// ── the case (scene units: the case is 1 wide; z = 0 is the face) ─────────
export const CASE_W = 1.0
export const CASE_H = 1.38
export const CASE_D = 1.1
export const FOOT_H = 0.03
export const HOOD_H = CASE_H - FOOT_H // the front piece, which stands on the foot
export const HOOD_CY = FOOT_H + HOOD_H / 2
export const HOOD_D = 0.21 // how far back the front piece runs before the parting line
const FACE_R = 0.07 // the outline's corner radius
const ROLL = 0.042 // the roll from the sides onto the face
export const OPEN_W = 0.8
export const OPEN_H = 0.62
const OPEN_R = 0.066
export const OPEN_CY = 0.99 // body y of the tube opening's centre
const LIP = 0.012
export const GLASS_W = 0.74
export const GLASS_H = 0.555
export const GLASS_Z = -0.125
export const GLASS_R = 1.8
export const TILT = -0.07 // the tube leans back a little, toward the eye
const SURR_W = GLASS_W - 0.022 // where the bezel's slope meets the glass
const SURR_H = GLASS_H - 0.022
const SURR_R = 0.03
export const SLOT_W = 0.38 // the floppy slot: a 3½" disk's width, a little more
export const SLOT_H = 0.034
export const SLOT_X = 0.125
export const SLOT_Y = 0.445
export const REAR_W = CASE_W - 0.012
export const REAR_H = HOOD_H - 0.01
export const REAR_D = CASE_D - HOOD_D + 0.02 // reaching a little way inside the front piece
export const REAR_TX = 0.06 // the rear housing narrows toward the back...
export const REAR_TY = 0.045 // ...and drops a little
export const REAR_Z = -(HOOD_D - 0.02) - REAR_D / 2 // its centre
export const REAR_CY = HOOD_CY - 0.004

/** The tube's bulge over its flat rim, in the glass's own plane. */
export const bulge = (x: number, y: number) =>
  Math.sqrt(Math.max(0, GLASS_R * GLASS_R - x * x - y * y)) - Math.sqrt(GLASS_R * GLASS_R - (GLASS_W / 2) ** 2 - (GLASS_H / 2) ** 2)

/** Glass space to the tube group's space (the tube group sits at the opening's centre on the face). */
export const glassPose = () =>
  new THREE.Matrix4().compose(new THREE.Vector3(0, 0, GLASS_Z), new THREE.Quaternion().setFromEuler(new THREE.Euler(TILT, 0, 0)), new THREE.Vector3(1, 1, 1))

/**
 * The front piece in one surface, back to front: a turn-in where it meets the
 * rear housing (the parting line), the sides, a generous roll onto the face,
 * the flat face, a lip rolling into the tube opening, and the deep sculpted
 * slope whose inner edge lies ON the tilted, bulged glass, then tucks under it
 * so no seam shows. Centred on its own middle (HOOD_CY). `aSpill` runs 0 on
 * the face to 1 at the glass, for the phosphor's light on the slope.
 */
export function hoodGeometry(): THREE.BufferGeometry {
  const C = 16
  const NX = 24
  const NY = 34
  const outer = (i: number) => rrRing(CASE_W - 2 * i, HOOD_H - 2 * i, Math.max(0.006, FACE_R - i), 0, C, NX, NY)
  const rings: number[][] = []
  const spill: number[] = []
  const add = (r: number[], s: number) => {
    rings.push(r)
    spill.push(s)
  }
  for (const [i, z] of fillet(
    [
      [0.022, -HOOD_D, 0],
      [0, -HOOD_D + 0.006, 0.005],
      [0, 0, ROLL],
      [ROLL + 0.012, 0, 0],
    ],
    12,
  ))
    add(lift(outer(i), z), 0)
  // the flat face, blending from the outline to the opening's lip
  const oy = OPEN_CY - HOOD_CY
  const open = (e: number) => rrRing(OPEN_W + 2 * e, OPEN_H + 2 * e, OPEN_R + e, oy, C, NX, NY)
  const face0 = outer(ROLL + 0.012)
  const face1 = open(LIP)
  for (const s of [0.25, 0.5, 0.75, 1]) add(lift(mixRing(face0, face1, s), 0), 0)
  // the lip rolls back into the opening...
  const PHI = 1.05
  for (let k = 1; k <= 9; k++) {
    const f = (k / 9) * PHI
    add(lift(open(LIP * (1 - Math.sin(f))), -LIP * (1 - Math.cos(f))), 0)
  }
  // ...and slopes down onto the glass, a touch concave, its inner edge on the bulge
  const zL = -LIP * (1 - Math.cos(PHI))
  const L = open(LIP * (1 - Math.sin(PHI)))
  const pose = glassPose()
  const v = new THREE.Vector3()
  const onGlass = (ring: P2[], sink: number) =>
    ring.map(([x, y]) => {
      v.set(x, y, bulge(x, y) - sink).applyMatrix4(pose)
      return [v.x, v.y + oy, v.z] as [number, number, number]
    })
  const B = onGlass(rrRing(SURR_W, SURR_H, SURR_R, 0, C, NX, NY), 0.0015)
  for (const s of [0.15, 0.3, 0.45, 0.6, 0.75, 0.88, 1]) {
    const e = 1 - (1 - s) ** 1.25
    const r: number[] = []
    L.forEach(([x, y], j) => r.push(x + (B[j][0] - x) * s, y + (B[j][1] - y) * s, zL + (B[j][2] - zL) * e))
    add(r, s)
  }
  // tucked under the glass
  add(onGlass(rrRing(SURR_W - 0.012, SURR_H - 0.012, SURR_R - 0.006, 0, C, NX, NY), 0.006).flat(), 1)
  const g = stitch(rings)
  const n = rings[0].length / 3
  const a = new Float32Array(rings.length * n)
  spill.forEach((s, k) => a.fill(s, k * n, (k + 1) * n))
  g.setAttribute('aSpill', new THREE.BufferAttribute(a, 1))
  return g
}

/** The rear housing, narrowing and dropping toward the back (centred on its own middle). */
export function rearGeometry(): THREE.BufferGeometry {
  const g = new RoundedBoxGeometry(REAR_W, REAR_H, REAR_D, 7, 0.075)
  const p = g.attributes.position
  const yb = -REAR_H / 2
  for (let i = 0; i < p.count; i++) {
    const t = (REAR_D / 2 - p.getZ(i)) / REAR_D
    p.setX(i, p.getX(i) * (1 - REAR_TX * t))
    p.setY(i, yb + (p.getY(i) - yb) * (1 - REAR_TY * t))
  }
  return smooth(g)
}

/** A point on the rear housing's top at body depth z, and the way the top faces there. */
export function rearTop(z: number, x = 0) {
  const t = (REAR_D / 2 - (z - REAR_Z)) / REAR_D
  const y = REAR_CY - REAR_H / 2 + REAR_H * (1 - REAR_TY * t)
  return { pos: new THREE.Vector3(x, y, z), n: new THREE.Vector3(0, 1, -(REAR_TY * REAR_H) / REAR_D).normalize() }
}

// ── the one-button mouse ──────────────────────────────────────────────────
export const MS_W = 0.2
export const MS_L = 0.34
export const MS_H = 0.082
const MS_R = 0.034
const MS_DROP = 0.014 // the button end sits lower than the palm end
/** The top's height above the desk at (x, along), `along` running -1 at the palm to 1 at the button end. */
export const mouseTop = (x: number, along: number) => MS_H - MS_DROP * (along * 0.5 + 0.5) - 0.006 * (x / (MS_W / 2)) ** 2

/**
 * The body: a soap-bar brick, upright sides rolling over onto a top that is
 * crowned across and falls toward the button end. Lofted in the desk plane
 * (+z toward the user, so the button end is -z).
 */
export function mouseBodyGeometry(): THREE.BufferGeometry {
  const C = 10
  const NX = 8
  const NY = 12
  const ring = (i: number) => rrRing(MS_W - 2 * i, MS_L - 2 * i, Math.max(0.004, MS_R - i), 0, C, NX, NY)
  const along = (y: number) => y / (MS_L / 2)
  const rings: number[][] = []
  // the underside, then the walls up to the roll, as fractions of the local top
  for (const s of [0, 0.5, 0.85]) rings.push(lift(rrRing((MS_W - 0.012) * s, (MS_L - 0.012) * s, (MS_R - 0.006) * s, 0, C, NX, NY), 0.002, true))
  for (const [i, f] of fillet(
    [
      [0.006, 0.02, 0],
      [0, 0.12, 0.05],
      [0, 0.66, 0.16],
      [0.03, 1, 0],
    ],
    9,
  ))
    rings.push(lift(ring(i), (x, y) => f * mouseTop(x, along(y)), true))
  for (const s of [0.8, 0.6, 0.4, 0.2, 0])
    rings.push(lift(rrRing((MS_W - 0.06) * s, (MS_L - 0.06) * s, (MS_R - 0.03) * s, 0, C, NX, NY), (x, y) => mouseTop(x, along(y)), true))
  return stitch(rings)
}

/** The one button: the front third of the top, nearly the full width. */
export const BTN_L = MS_L * 0.34
export const BTN_Z = -MS_L / 2 + BTN_L / 2 + 0.024

/**
 * The button as a crowned cap that follows the body's top, standing a hair
 * proud of it; with `gap`, the same shape grown and sunk a little, for the dark
 * seam that shows round it. Mouse-local, like the body.
 */
export function mouseButtonGeometry(gap = 0): THREE.BufferGeometry {
  const C = 8
  const NX = 10
  const NY = 4
  const bw = MS_W - 0.034 + 2 * gap
  const bl = BTN_L + 2 * gap
  const r = 0.012 + gap
  const cy = -BTN_Z // ring +y runs toward -z when lifted flat
  const lift0 = gap ? 0.0006 : 0.0016
  const top = (x: number, y: number) => mouseTop(x, y / (MS_L / 2)) + lift0
  const ring = (i: number) => rrRing(bw - 2 * i, bl - 2 * i, Math.max(0.002, r - i), cy, C, NX, NY)
  const rings: number[][] = []
  for (const [i, dh] of fillet(
    [
      [0, -0.012, 0],
      [0, -0.0016, 0.0013],
      [0.0034, 0, 0],
    ],
    6,
  ))
    rings.push(lift(ring(i), (x, y) => top(x, y) + dh, true))
  for (const s of [0.8, 0.55, 0.3, 0])
    rings.push(lift(rrRing((bw - 0.0068) * s, (bl - 0.0068) * s, Math.max(0.001, r - 0.0034) * s, cy, C, NX, NY), (x, y) => top(x, y), true))
  return stitch(rings)
}

// ── the floppy ────────────────────────────────────────────────────────────
// a 3½" disk at this scale: 9 × 9.4 × 0.33 cm against a 24.6 cm case
export const DISK_W = 0.362
export const DISK_L = 0.378
export const DISK_T = 0.0134

import * as THREE from 'three'
import { GTAOPass } from 'three/examples/jsm/postprocessing/GTAOPass.js'
import { FullScreenQuad } from 'three/examples/jsm/postprocessing/Pass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

/**
 * The studio kit: everything that makes an object on the homepage look shot
 * rather than rendered, shared by whatever sits in the hero (the Classic Mac
 * today; it was written for the CRT that came before it).
 *
 * Plastic parts are lofts of rounded rectangles: every ring has the same
 * points in the same order (corner arcs plus subdivided straight edges), so a
 * profile drawn as a filleted polyline in (inset, depth) becomes one smooth
 * surface with no seams to shade wrong. The compact keyboard (case, sculpted
 * caps, the rows' heights and angles) is built the same way.
 *
 * Fine detail that geometry would make expensive is shaded instead: the
 * plastics carry an "orange peel" of analytic gradient noise that tilts the
 * normal (and the clearcoat's), faded out once a bump is smaller than a pixel;
 * vents, slots and recesses are decals that ray-march a pocket behind the
 * surface, so they read as cut from any angle.
 *
 * Then the light: a softbox studio as a PMREM environment, and a post chain
 * (multisampled half-float target, ground-truth AO, restrained bloom, and a
 * NaN scrub for Metal) that the frame goes through on its way to the canvas.
 */

// ── keyboard ──────────────────────────────────────────────────────────────
export const U = 0.066 // one key unit
export const KB_W = 1.1
export const KB_D = 0.45
export const KB_TILT = 0.05
export const KB_BOT = 0.012
export const KB_TOP = 0.052
export const KB_FLOOR = 0.044
export const WELL_Z = 0.012
export const WELL_W = 15 * U + 0.016
export const WELL_D = 5 * U + 0.016
export const CAP_H = 0.03
export const CAP_Y = KB_FLOOR + 0.0055 + CAP_H / 2 // skirts just clear of the plate
export const TRAVEL = 0.012
/** Sculpted rows, number row first: the tops tilt toward the typist at the back and away at the front. */
export const ROW_TILT = [0.15, 0.075, 0.0, -0.055, -0.085]
export const ROW_LIFT = [0.0042, 0.0022, 0.0, 0.0008, 0.0014]

// ── lofting ───────────────────────────────────────────────────────────────
export type P2 = [number, number]

/**
 * A rounded rectangle as a closed ring, counter-clockwise from the top right:
 * corner arcs of `segC` steps and straight edges cut into `nx` (top, bottom)
 * and `ny` (sides) spans. Same counts, same point order, so any two rings can
 * be stitched or blended.
 */
export function rrRing(w: number, h: number, r: number, cy = 0, segC = 10, nx = 1, ny = 1): P2[] {
  r = Math.max(0, Math.min(r, w / 2 - 1e-6, h / 2 - 1e-6))
  const hw = Math.max(0, w / 2 - r)
  const hh = Math.max(0, h / 2 - r)
  const cs: P2[] = [
    [hw, hh],
    [-hw, hh],
    [-hw, -hh],
    [hw, -hh],
  ]
  const out: P2[] = []
  for (let k = 0; k < 4; k++) {
    const a0 = (k * Math.PI) / 2
    for (let i = 0; i <= segC; i++) {
      const a = a0 + (i / segC) * (Math.PI / 2)
      out.push([cs[k][0] + r * Math.cos(a), cy + cs[k][1] + r * Math.sin(a)])
    }
    const n = k % 2 === 0 ? nx : ny
    const [ax, ay] = out[out.length - 1]
    const nk = cs[(k + 1) % 4]
    const na = ((k + 1) * Math.PI) / 2
    const bx = nk[0] + r * Math.cos(na)
    const by = cy + nk[1] + r * Math.sin(na)
    for (let i = 1; i < n; i++) out.push([ax + ((bx - ax) * i) / n, ay + ((by - ay) * i) / n])
  }
  return out
}

export const mixRing = (a: P2[], b: P2[], s: number): P2[] => a.map(([x, y], i) => [x + (b[i][0] - x) * s, y + (b[i][1] - y) * s])

/** A ring placed in 3D: in the xy plane at depth `h` (or, `up`, flat in xz at height `h`, its +y toward the back). */
export function lift(ring: P2[], h: number | ((x: number, y: number, i: number) => number), up = false): number[] {
  const out: number[] = []
  ring.forEach(([x, y], i) => {
    const v = typeof h === 'number' ? h : h(x, y, i)
    if (up) out.push(x, v, -y)
    else out.push(x, y, v)
  })
  return out
}

/** Stitch rings (equal counts) into one indexed, smooth-shaded surface; it faces the side the rings advance toward. */
export function stitch(rings: number[][]): THREE.BufferGeometry {
  const n = rings[0].length / 3
  const pos = new Float32Array(rings.length * n * 3)
  rings.forEach((r, k) => pos.set(r, k * n * 3))
  const idx: number[] = []
  for (let k = 0; k < rings.length - 1; k++)
    for (let i = 0; i < n; i++) {
      const a = k * n + i
      const b = k * n + ((i + 1) % n)
      idx.push(a, b, a + n, b, b + n, a + n)
    }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  g.setIndex(idx)
  g.computeVertexNormals()
  return g
}

/** A polyline of [u, v, radius] with its corners rounded off (quadratic arcs between the tangent points). */
export function fillet(pts: [number, number, number][], steps = 6): P2[] {
  const out: P2[] = []
  const push = (u: number, v: number) => {
    const l = out[out.length - 1]
    if (!l || Math.hypot(l[0] - u, l[1] - v) > 1e-7) out.push([u, v])
  }
  pts.forEach(([u, v, r], i) => {
    if (i === 0 || i === pts.length - 1 || r <= 0) return push(u, v)
    const [u0, v0] = pts[i - 1]
    const [u1, v1] = pts[i + 1]
    const l0 = Math.hypot(u - u0, v - v0)
    const l1 = Math.hypot(u1 - u, v1 - v)
    const cos = -((u - u0) * (u1 - u) + (v - v0) * (v1 - v)) / (l0 * l1)
    const ang = Math.acos(Math.max(-1, Math.min(1, cos)))
    if (ang > Math.PI - 0.01) return push(u, v)
    const t = Math.min(r / Math.tan(ang / 2), l0 * 0.5, l1 * 0.5)
    const ax = u - ((u - u0) / l0) * t
    const ay = v - ((v - v0) / l0) * t
    const bx = u + ((u1 - u) / l1) * t
    const by = v + ((v1 - v) / l1) * t
    for (let s = 0; s <= steps; s++) {
      const f = s / steps
      push((1 - f) * (1 - f) * ax + 2 * f * (1 - f) * u + f * f * bx, (1 - f) * (1 - f) * ay + 2 * f * (1 - f) * v + f * f * by)
    }
  })
  return out
}

/** Weld coincident vertices and recompute normals, so bevels shade smooth instead of faceted. */
export function smooth(g: THREE.BufferGeometry): THREE.BufferGeometry {
  g.deleteAttribute('normal')
  g.deleteAttribute('uv')
  const m = mergeVertices(g, 1e-5)
  m.computeVertexNormals()
  g.dispose()
  return m
}

/** Orient a flat (xy, facing +z) part onto a surface, its +y as close to `up` as the surface allows. */
export function placeOn(o: THREE.Object3D, pos: THREE.Vector3, n: THREE.Vector3, up = new THREE.Vector3(0, 1, 0), lift = 0.0006) {
  const z = n.clone().normalize()
  const x = new THREE.Vector3().crossVectors(up, z).normalize()
  const y = new THREE.Vector3().crossVectors(z, x)
  o.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, y, z))
  o.position.copy(pos).addScaledVector(z, lift)
  return o
}

/**
 * A keycap of `w` units, centred on its middle: walls drafted in toward a
 * rounded top edge, and a dish (spherical on a 1u cap, a long trough on the
 * wide ones) pressed into the top.
 */
export function keycapGeometry(w: number): THREE.BufferGeometry {
  const bw = w * U - 0.0105
  const bd = U - 0.0105
  const TAPER = 0.0064
  const y0 = -CAP_H / 2
  const y1 = CAP_H / 2
  const C = 6
  const NX = Math.max(2, Math.round(w * 4))
  const NY = 4
  const rAt = (i: number) => 0.0028 + (0.0068 - 0.0028) * Math.min(1, i / TAPER)
  const ring = (i: number) => rrRing(bw - 2 * i, bd - 2 * i, rAt(i), 0, C, NX, NY)
  const rings: number[][] = []
  for (const [i, y] of fillet(
    [
      [0, y0, 0],
      [0.0004, y0 + 0.006, 0.004],
      [TAPER, y1, 0.0026],
      [TAPER + 0.0032, y1, 0],
    ],
    7,
  ))
    rings.push(lift(ring(i), y, true))
  const tw = bw - 2 * (TAPER + 0.0032)
  const td = bd - 2 * (TAPER + 0.0032)
  const D = 0.0017
  const ex = 2 + Math.max(0, w - 1) * 3 // the wide caps dish into a trough
  const dish = (x: number, y: number) => {
    const ax = Math.min(1, Math.abs(x) / (tw / 2))
    const ay = Math.min(1, Math.abs(y) / (td / 2))
    return y1 - D * (1 - ax ** ex) * (1 - ay * ay)
  }
  for (const s of [0.86, 0.7, 0.54, 0.38, 0.23, 0.1, 0]) rings.push(lift(rrRing(tw * s, td * s, rAt(TAPER) * s, 0, C, NX, NY), dish, true))
  return stitch(rings)
}

/** The keyboard case: underside, walls with a small step and a chamfer, the deck, and a well rolled down to the plate. */
export function caseGeometry(): THREE.BufferGeometry {
  const C = 10
  const NX = 30
  const NY = 10
  const outer = (i: number) => rrRing(KB_W - 2 * i, KB_D - 2 * i, Math.max(0.006, 0.032 - i * 0.6), 0, C, NX, NY)
  const well = (e: number) => rrRing(WELL_W + 2 * e, WELL_D + 2 * e, Math.max(0.002, 0.006 + e), -WELL_Z, C, NX, NY)
  const rings: number[][] = []
  for (const s of [0, 0.35, 0.7, 0.9]) rings.push(lift(rrRing((KB_W - 0.016) * s, (KB_D - 0.016) * s, 0.026 * s, 0, C, NX, NY), KB_BOT, true))
  for (const [i, y] of fillet(
    [
      [0.008, KB_BOT, 0],
      [0, KB_BOT + 0.004, 0.003],
      [0, 0.03, 0.0012],
      [0.0042, 0.0302, 0.0008],
      [0.0056, 0.0345, 0.0012],
      [0.013, KB_TOP, 0.005],
      [0.022, KB_TOP, 0],
    ],
    7,
  ))
    rings.push(lift(outer(i), y, true))
  const LIP = 0.003
  for (const s of [0.33, 0.66]) rings.push(lift(mixRing(outer(0.022), well(LIP), s), KB_TOP, true))
  for (const [e, y] of fillet(
    [
      [LIP, KB_TOP, 0],
      [0, KB_TOP, LIP],
      [0, KB_FLOOR, 0.0015],
      [-0.004, KB_FLOOR, 0],
    ],
    6,
  ))
    rings.push(lift(well(e), y, true))
  return stitch(rings)
}

// ── textures ──────────────────────────────────────────────────────────────
/** A soft blurred rounded rectangle on a canvas (drawn off-canvas with the shadow offset back: ctx.filter is not in every Safari). */
function blurRect(c: HTMLCanvasElement, pw: number, ph: number, r: number, blur: number, color: string) {
  const x = c.getContext('2d')!
  x.shadowColor = color
  x.shadowBlur = blur
  x.shadowOffsetX = 4000
  x.fillStyle = color
  x.beginPath()
  x.roundRect((c.width - pw) / 2 - 4000, (c.height - ph) / 2, pw, ph, r)
  x.fill()
}

/** A soft blurred rounded rectangle, for baked contact shadows. */
export function shadowTexture(w: number, h: number, r: number, blur: number): THREE.CanvasTexture {
  const S = 256
  const c = document.createElement('canvas')
  c.width = S
  c.height = Math.round((S * h) / w)
  const k = S / w
  blurRect(c, (w - 2 * blur * 1.2) * k, (h - 2 * blur * 1.2) * k, r * k, blur * k, '#000')
  return new THREE.CanvasTexture(c)
}

// ── the studio ────────────────────────────────────────────────────────────
/**
 * A product photographer's studio as a PMREM environment: a grey room that
 * darkens toward the ceiling (a pale desk bounces light from below), and
 * feathered softboxes (a big key high on the left, a fill strip, a rim strip
 * behind on the right, a long overhead strip) whose highlights roll across
 * the curved bevels instead of clipping.
 */
export function studioEnvironment(renderer: THREE.WebGLRenderer): THREE.Texture {
  const scene = new THREE.Scene()
  const room = new THREE.SphereGeometry(14, 48, 24)
  const p = room.attributes.position
  const col = new Float32Array(p.count * 3)
  for (let i = 0; i < p.count; i++) {
    const y = p.getY(i) / 14
    const z = p.getZ(i) / 14
    // the photographer's side is flagged off dark, so the tube reflects a dim
    // room and the softboxes rather than a grey wall
    const front = Math.min(1, Math.max(0, (z - 0.05) / 0.75))
    const v = (y < 0 ? 0.44 + 0.12 * -y : 0.44 - 0.26 * y) * (1 - 0.62 * front * front * (3 - 2 * front))
    col.set([v, v * 0.985, v * 0.96], i * 3)
  }
  room.setAttribute('color', new THREE.BufferAttribute(col, 3))
  const roomMat = new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide })
  scene.add(new THREE.Mesh(room, roomMat))
  const c = document.createElement('canvas')
  c.width = c.height = 128
  const cx = c.getContext('2d')!
  cx.fillStyle = '#000'
  cx.fillRect(0, 0, 128, 128)
  blurRect(c, 92, 92, 14, 16, '#fff')
  const soft = new THREE.CanvasTexture(c)
  soft.colorSpace = THREE.NoColorSpace
  const plane = new THREE.PlaneGeometry(1, 1)
  const mats: THREE.Material[] = []
  const card = (w: number, h: number, x: number, y: number, z: number, k: number, tint = 0xffffff) => {
    const m = new THREE.MeshBasicMaterial({ map: soft, color: new THREE.Color(tint).multiplyScalar(k) })
    mats.push(m)
    const mesh = new THREE.Mesh(plane, m)
    mesh.scale.set(w, h, 1)
    mesh.position.set(x, y, z)
    mesh.lookAt(0, 0.3, 0)
    scene.add(mesh)
  }
  card(3.8, 2.8, -4.6, 4.6, 4.2, 13) // key, high on the left: the same side as the shadow-casting sun
  card(6.0, 2.2, 0.6, 5.6, 5.2, 2.6) // a broad diffuser high over the camera: a soft band across the top of the glass
  card(1.6, 4.4, 5.8, 1.6, 3.0, 2.4, 0xf3f6ff) // fill strip on the right
  card(1.2, 5.2, 3.8, 3.0, -5.6, 7.5, 0xf6f8ff) // rim strip behind on the right
  card(5.4, 1.3, 0.3, 7.6, -0.6, 3.2) // overhead strip
  card(3.0, 3.0, -6.6, 0.6, -1.2, 1.2, 0xfff6ea) // a warm bounce card low on the left
  const pmrem = new THREE.PMREMGenerator(renderer)
  const tex = pmrem.fromScene(scene, 0.015, 0.1, 100, { size: 512 }).texture
  pmrem.dispose()
  room.dispose()
  roomMat.dispose()
  plane.dispose()
  soft.dispose()
  mats.forEach((m) => m.dispose())
  return tex
}

// ── surface finish ────────────────────────────────────────────────────────
const PEEL_PARS = /* glsl */ `
uniform mat4 modelMatrix;
uniform float uPeelF, uPeelK, uPeelR;
varying vec3 vPeel;
vec3 peelHash(vec3 p) {
  p = fract(p * vec3(0.1031, 0.1030, 0.0973));
  p += dot(p, p.yxz + 33.33);
  return -1.0 + 2.0 * fract((p.xxy + p.yxx) * p.zyx);
}
// gradient noise and its analytic derivative: (value, d/dx, d/dy, d/dz)
vec4 peelNoise(vec3 x) {
  vec3 i = floor(x);
  vec3 f = fract(x);
  vec3 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  vec3 du = 30.0 * f * f * (f * (f - 2.0) + 1.0);
  vec3 ga = peelHash(i);
  vec3 gb = peelHash(i + vec3(1.0, 0.0, 0.0));
  vec3 gc = peelHash(i + vec3(0.0, 1.0, 0.0));
  vec3 gd = peelHash(i + vec3(1.0, 1.0, 0.0));
  vec3 ge = peelHash(i + vec3(0.0, 0.0, 1.0));
  vec3 gf = peelHash(i + vec3(1.0, 0.0, 1.0));
  vec3 gg = peelHash(i + vec3(0.0, 1.0, 1.0));
  vec3 gh = peelHash(i + vec3(1.0, 1.0, 1.0));
  float va = dot(ga, f);
  float vb = dot(gb, f - vec3(1.0, 0.0, 0.0));
  float vc = dot(gc, f - vec3(0.0, 1.0, 0.0));
  float vd = dot(gd, f - vec3(1.0, 1.0, 0.0));
  float ve = dot(ge, f - vec3(0.0, 0.0, 1.0));
  float vf = dot(gf, f - vec3(1.0, 0.0, 1.0));
  float vg = dot(gg, f - vec3(0.0, 1.0, 1.0));
  float vh = dot(gh, f - vec3(1.0, 1.0, 1.0));
  float v = va + u.x * (vb - va) + u.y * (vc - va) + u.z * (ve - va) + u.x * u.y * (va - vb - vc + vd) + u.y * u.z * (va - vc - ve + vg) + u.z * u.x * (va - vb - ve + vf) + (-va + vb + vc - vd + ve - vf - vg + vh) * u.x * u.y * u.z;
  vec3 g = ga + u.x * (gb - ga) + u.y * (gc - ga) + u.z * (ge - ga) + u.x * u.y * (ga - gb - gc + gd) + u.y * u.z * (ga - gc - ge + gg) + u.z * u.x * (ga - gb - ge + gf) + (-ga + gb + gc - gd + ge - gf - gg + gh) * u.x * u.y * u.z
    + du * (vec3(vb - va, vc - va, ve - va) + u.yzx * vec3(va - vb - vc + vd, va - vc - ve + vg, va - vb - ve + vf) + u.zxy * vec3(va - vb - ve + vf, va - vb - vc + vd, va - vc - ve + vg) + u.yzx * u.zxy * (-va + vb + vc - vd + ve - vf - vg + vh));
  return vec4(v, g);
}
vec3 peelG = vec3(0.0);
`

const PEEL_ROUGH = /* glsl */ `
{
  // bumps smaller than a pixel would only sparkle: fade them, and rough the surface up instead
  float pf = length(fwidth(vPeel)) * uPeelF;
  float k1 = 1.0 - smoothstep(0.2, 0.55, pf);
  float k2 = 1.0 - smoothstep(0.2, 0.55, pf * 2.3);
  vec4 n1 = k1 > 0.0 ? peelNoise(vPeel * uPeelF) : vec4(0.0);
  vec4 n2 = k2 > 0.0 ? peelNoise(vPeel * uPeelF * 2.3 + 7.1) : vec4(0.0);
  roughnessFactor = clamp(roughnessFactor * (1.0 + uPeelR * (n1.x * k1 + 0.5 * n2.x * k2)) + 0.05 * (1.0 - k1), 0.03, 1.0);
  peelG = mat3(viewMatrix) * (mat3(modelMatrix) * ((n1.yzw * k1 + 0.6 * n2.yzw * k2) * uPeelK));
}
`

export type Peel = { f: number; k: number; r: number }

/**
 * Inject the orange peel into a standard/physical material's shader source:
 * `f` bumps per unit, `k` how far they tilt the normal, `r` how much they vary
 * the roughness. Call from onBeforeCompile; `uniforms` stays live.
 */
export function injectPeel(sh: THREE.WebGLProgramParametersWithUniforms, peel: { uPeelF: { value: number }; uPeelK: { value: number }; uPeelR: { value: number } }) {
  Object.assign(sh.uniforms, peel)
  sh.vertexShader = sh.vertexShader
    .replace('#include <common>', '#include <common>\nvarying vec3 vPeel;')
    .replace(
      '#include <begin_vertex>',
      '#include <begin_vertex>\n#ifdef USE_INSTANCING\nvPeel = (instanceMatrix * vec4(position, 1.0)).xyz;\n#else\nvPeel = position;\n#endif',
    )
  sh.fragmentShader = sh.fragmentShader
    .replace('#include <common>', `#include <common>\n${PEEL_PARS}`)
    .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>\n${PEEL_ROUGH}`)
    .replace('#include <normal_fragment_maps>', '#include <normal_fragment_maps>\nnormal = normalize(normal - (peelG - dot(peelG, normal) * normal));')
    .replace(
      '#include <clearcoat_normal_fragment_maps>',
      '#include <clearcoat_normal_fragment_maps>\n#ifdef USE_CLEARCOAT\nclearcoatNormal = normalize(clearcoatNormal - (peelG - dot(peelG, clearcoatNormal) * clearcoatNormal));\n#endif',
    )
}

export const peelUniforms = (p: Peel) => ({ uPeelF: { value: p.f }, uPeelK: { value: p.k }, uPeelR: { value: p.r } })

/** A plastic with the peel already wired in. `key` keeps differently-patched programs apart in three's cache. */
export function peeled<M extends THREE.MeshStandardMaterial>(m: M, p: Peel, key: string): M {
  const u = peelUniforms(p)
  m.onBeforeCompile = (sh) => injectPeel(sh, u)
  m.customProgramCacheKey = () => `peel-${key}`
  return m
}

/**
 * A grid of holes cut into a flat face, as a decal laid just over it. Each
 * pixel inside a hole marches the view ray into a pocket `depth` deep: if it
 * meets a wall first, the wall shades by its angle to the light (from `light`,
 * in the decal's plane) and darkens with depth; otherwise it lands on a
 * near-black floor. Outside the holes the decal is transparent.
 */
export type Holes = {
  round: boolean
  pitch: [number, number]
  count: [number, number]
  size: [number, number] // radius (round), or half extents (slots)
  depth: number
  corner?: number
  mask?: number // keep only holes whose centre lies within this radius
  light?: [number, number]
  floor?: number
  /** 0 leaves the floor see-through: only the walls draw, for a shallow recess in a lit face. */
  floorAlpha?: number
}
export function holeMaterial(h: Holes): THREE.MeshLambertMaterial {
  const m = new THREE.MeshLambertMaterial({ transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 })
  const u = {
    uHPitch: { value: new THREE.Vector2(...h.pitch) },
    uHCount: { value: new THREE.Vector2(...h.count) },
    uHSize: { value: new THREE.Vector2(...h.size) },
    uHDepth: { value: h.depth },
    uHRound: { value: h.round ? 1 : 0 },
    uHCorner: { value: h.corner ?? 0 },
    uHMask: { value: h.mask ?? 0 },
    uHLight: { value: new THREE.Vector2(...(h.light ?? [0, 1])).normalize() },
    uHFloor: { value: h.floor ?? 0.025 },
    uHFloorA: { value: h.floorAlpha ?? 1 },
  }
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, u)
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec2 vHP;\nvarying vec3 vHV;')
      .replace(
        '#include <begin_vertex>',
        '#include <begin_vertex>\nvHP = position.xy;\nvHV = (inverse(modelMatrix) * vec4(cameraPosition, 1.0)).xyz - position;',
      )
    sh.fragmentShader = sh.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
uniform vec2 uHPitch, uHCount, uHSize, uHLight;
uniform float uHDepth, uHRound, uHCorner, uHMask, uHFloor, uHFloorA;
varying vec2 vHP;
varying vec3 vHV;`,
      )
      .replace(
        '#include <color_fragment>',
        /* glsl */ `#include <color_fragment>
{
  vec2 id = clamp(floor(vHP / uHPitch + 0.5 * uHCount), vec2(0.0), uHCount - 1.0);
  vec2 q = vHP - (id - 0.5 * (uHCount - 1.0)) * uHPitch;
  vec3 V = normalize(vHV);
  vec2 d = -V.xy / max(V.z, 0.08); // sideways drift per unit of depth
  float sd;
  float s;
  vec2 wn;
  if (uHRound > 0.5) {
    sd = length(q) - uHSize.x;
    float a = dot(d, d);
    float b = dot(q, d);
    float c = dot(q, q) - uHSize.x * uHSize.x;
    s = a > 1e-8 ? (-b + sqrt(max(b * b - a * c, 0.0))) / a : 1e3;
    vec2 hp = q + d * s;
    wn = -hp / max(length(hp), 1e-6);
  } else {
    vec2 e = abs(q) - uHSize + uHCorner;
    sd = length(max(e, 0.0)) + min(max(e.x, e.y), 0.0) - uHCorner;
    vec2 sg = vec2(d.x >= 0.0 ? 1.0 : -1.0, d.y >= 0.0 ? 1.0 : -1.0);
    vec2 t2 = vec2(abs(d.x) > 1e-6 ? (sg.x * uHSize.x - q.x) / d.x : 1e3, abs(d.y) > 1e-6 ? (sg.y * uHSize.y - q.y) / d.y : 1e3);
    s = min(t2.x, t2.y);
    wn = t2.x < t2.y ? vec2(-sg.x, 0.0) : vec2(0.0, -sg.y);
  }
  if (uHMask > 0.0 && length(vHP - q) > uHMask) sd = 1.0;
  float fw = max(fwidth(sd), 1e-6);
  float inHole = 1.0 - smoothstep(-fw, fw, sd);
  float shade = uHFloor;
  if (s >= uHDepth) diffuseColor.a *= uHFloorA;
  if (s < uHDepth) {
    float dep = s / uHDepth;
    shade = (0.3 + 0.7 * max(dot(wn, uHLight), 0.0)) * mix(0.62, 0.07, pow(max(dep, 0.0), 0.7));
  }
  diffuseColor.rgb *= shade;
  diffuseColor.a *= inHole;
}`,
      )
  }
  m.customProgramCacheKey = () => 'holes'
  return m
}

// ── post ──────────────────────────────────────────────────────────────────
const SCRUB = /* glsl */ `
// Inf/NaN from any shader upstream (Metal returns NaN for pow() of a negative
// base where software renderers don't): test the bits, since fast-math can
// fold isnan() away. Bloom blurs one bad pixel across the whole frame, so the
// scene is scrubbed before it reaches bloom and again before it reaches the canvas.
bool badf(float x) { return (floatBitsToUint(x) & 0x7f800000u) == 0x7f800000u; }
vec4 scrub(vec4 v) { return (badf(v.x) || badf(v.y) || badf(v.z) || badf(v.w)) ? vec4(0.0) : clamp(v, 0.0, 64.0); }
`

const FINAL_FS = /* glsl */ `
${SCRUB}
uniform sampler2D tScene;
uniform sampler2D tAO;
uniform sampler2D tBloom;
uniform float uAO;
uniform float uFloor;
varying vec2 vUv;
void main() {
  vec4 c = scrub(texture2D(tScene, vUv));
  float ao = clamp(scrub(texture2D(tAO, vUv)).r, 0.0, 1.0);
  // emitted light is not occluded: the lit phosphor and the LEDs pass through
  float lum = dot(c.rgb, vec3(0.2126, 0.7152, 0.0722)) / max(c.a, 1e-3);
  float k = mix(1.0, ao, uAO * (1.0 - smoothstep(0.8, 1.8, lum)));
  c.rgb *= k;
  // over the see-through desk, occlusion has to darken the page underneath
  c.a += (1.0 - c.a) * (1.0 - k) * uFloor;
  vec3 b = scrub(texture2D(tBloom, vUv)).rgb;
  c.rgb += b;
  c.a = max(c.a, min(1.0, max(b.r, max(b.g, b.b))));
  gl_FragColor = c;
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`

const VS = 'varying vec2 vUv;\nvoid main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }'

export type Post = {
  setSize(w: number, h: number, dpr: number): void
  render(): void
  dispose(): void
  bloom: UnrealBloomPass
  mix: { uAO: { value: number }; uFloor: { value: number } }
  aoOn: boolean
}

/**
 * The frame: the scene into a multisampled half-float target (transparent
 * where there is no computer, so the name shows through); ground-truth AO at
 * half or full resolution; a restrained bloom (high threshold, so only the
 * phosphor and the LEDs glow) built from a half-size copy; then one pass to
 * the canvas that applies the AO (a multiply on the computer, black coverage
 * on the see-through desk), adds the bloom, and tone maps. Everything at full
 * resolution is touched as few times as possible: at DPR 2 the frame is
 * memory-bound, not shader-bound.
 */
export function createPost(renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.Camera, samples: number): Post {
  const rtScene = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples })
  const rtHalf = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, depthBuffer: false })
  const gtao = new GTAOPass(scene, camera, 1, 1)
  gtao.output = GTAOPass.OUTPUT.Off
  gtao.updateGtaoMaterial({ radius: 0.07, distanceExponent: 1.4, thickness: 0.6, distanceFallOff: 1, scale: 1.15, samples: 12 })
  gtao.updatePdMaterial({ lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 6, rings: 2, samples: 12 })
  const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.3, 0.42, 1.05)
  const black = new THREE.DataTexture(new Uint8Array([0, 0, 0, 0]), 1, 1)
  const white = new THREE.DataTexture(new Uint8Array([255, 255, 255, 255]), 1, 1)
  black.needsUpdate = white.needsUpdate = true
  const copyMat = new THREE.ShaderMaterial({
    uniforms: { tDiffuse: { value: rtScene.texture as THREE.Texture } },
    vertexShader: VS,
    fragmentShader: `${SCRUB}\nuniform sampler2D tDiffuse;\nvarying vec2 vUv;\nvoid main() { gl_FragColor = scrub(texture2D(tDiffuse, vUv)); }`,
    depthTest: false,
    depthWrite: false,
    blending: THREE.NoBlending,
  })
  const finalU = {
    tScene: { value: rtScene.texture as THREE.Texture },
    tAO: { value: white as THREE.Texture },
    tBloom: { value: black as THREE.Texture },
    uAO: { value: 1 },
    uFloor: { value: 0.6 },
  }
  const finalMat = new THREE.ShaderMaterial({ uniforms: finalU, vertexShader: VS, fragmentShader: FINAL_FS, depthTest: false, depthWrite: false, blending: THREE.NoBlending })
  const copyQuad = new FullScreenQuad(copyMat)
  const finalQuad = new FullScreenQuad(finalMat)
  const post: Post = {
    bloom,
    mix: finalU,
    aoOn: true,
    setSize(w, h, dpr) {
      const W = Math.max(1, Math.round(w * dpr))
      const H = Math.max(1, Math.round(h * dpr))
      const half = dpr > 1.5 && W * H > 1.2e6
      rtScene.setSize(W, H)
      rtHalf.setSize(Math.ceil(W / 2), Math.ceil(H / 2))
      gtao.setSize(half ? Math.round(W / 2) : W, half ? Math.round(H / 2) : H)
      bloom.setSize(half ? Math.round(W / 2) : W, half ? Math.round(H / 2) : H)
    },
    render() {
      renderer.setRenderTarget(rtScene)
      renderer.clear()
      renderer.render(scene, camera)
      if (post.aoOn) gtao.render(renderer, rtHalf, rtScene, 0, false)
      finalU.tAO.value = post.aoOn ? gtao.gtaoMap : white
      if (bloom.strength > 0) {
        renderer.setRenderTarget(rtHalf)
        copyQuad.render(renderer)
        bloom.render(renderer, rtScene, rtHalf, 0, false)
        finalU.tBloom.value = bloom.renderTargetsHorizontal[0].texture
      } else finalU.tBloom.value = black
      renderer.setRenderTarget(null)
      finalQuad.render(renderer)
    },
    dispose() {
      rtScene.dispose()
      rtHalf.dispose()
      gtao.dispose()
      bloom.dispose()
      copyQuad.dispose()
      finalQuad.dispose()
      copyMat.dispose()
      finalMat.dispose()
      black.dispose()
      white.dispose()
    },
  }
  return post
}

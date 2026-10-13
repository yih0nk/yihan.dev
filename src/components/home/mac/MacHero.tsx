'use client'

import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'

import { projects } from '@/lib/projects'
import { EMAIL, GITHUB_URL, INSTAGRAM_URL, LINKEDIN_URL, X_URL } from '@/lib/site'
import { useThemeColors } from '@/lib/useThemeColors'
import { COLORS } from '@/styles/tokens'
import { REEL_SETTLED } from '@/components/home/reelEvent'
import {
  CAP_Y,
  type Holes,
  KB_BOT,
  KB_D,
  KB_FLOOR,
  KB_TILT,
  KB_W,
  ROW_LIFT,
  ROW_TILT,
  TRAVEL,
  U,
  WELL_D,
  WELL_W,
  WELL_Z,
  caseGeometry,
  createPost,
  holeMaterial,
  injectPeel,
  keycapGeometry,
  peelUniforms,
  peeled,
  placeOn,
  shadowTexture,
  studioEnvironment,
} from './studioKit'
import {
  CASE_D,
  CASE_H,
  CASE_W,
  DISK_L,
  DISK_T,
  DISK_W,
  FOOT_H,
  GLASS_H,
  GLASS_W,
  HOOD_CY,
  MS_H,
  MS_L,
  MS_W,
  OPEN_CY,
  OPEN_H,
  OPEN_W,
  REAR_CY,
  REAR_Z,
  SLOT_H,
  SLOT_W,
  SLOT_X,
  SLOT_Y,
  bulge,
  glassPose,
  hoodGeometry,
  mouseBodyGeometry,
  mouseButtonGeometry,
  rearGeometry,
  rearTop,
} from './macKit'
import {
  ARROW,
  brushName,
  CROSS,
  ERASER_CUR,
  fitPx,
  font,
  glyph,
  ICON_SPR,
  type BaseIconId,
  inRect,
  MINI_DOC,
  PAT_GREY,
  Raster,
  type Rect,
  serifSpr,
  SH,
  type Spr,
  STAR,
  SW,
  tw,
  wrapPx,
} from './macRaster'
import {
  ALARM_SIZE,
  AlarmClock,
  type App,
  type AppCtx,
  BELL,
  CALC_SIZE,
  CONTROL_SIZE,
  Calculator,
  type Clip,
  ControlPanel,
  type CursorName,
  DH,
  DW,
  type EditOp,
  IBEAM,
  MINI,
  MORE_ICONS,
  NOTES_SIZE,
  NotePad,
  PIANO_SIZE,
  PLANE,
  GUEST_SIZE,
  GuestBook,
  Paint,
  PianoApp,
  type Sound,
  loadPrefs,
  savePrefs,
} from './macApps'
import { type Piano, createPiano } from './macPiano'
import { heroLayout } from './NameLayer'
import { META, NAME, TAGLINE, THINGS, hexToRgb, loadFace } from './shared'

/**
 * 08 — Classic. A compact all-in-one in the spirit of the mid-eighties
 * machines, shot like a product photograph, running a one-bit desktop you can
 * actually use. A homage, not a replica: the badge says YH, and the type is
 * either drawn here or rasterised from the site's own faces.
 *
 * The machine is built from two workshops. macKit lofts the case the way
 * crtKit lofts the CRT's: the front piece is one surface that rolls from the
 * sides onto the face, into the tube opening and down a deep sculpted slope
 * onto the tilted, bulged glass; the rear housing narrows toward the back. The
 * floppy slot and its recess, the eject pinhole, the ridges across the lower
 * front, the carry handle and the vents are decals that ray-march a pocket
 * behind the surface. The keyboard is crtKit's sculpted compact board; the
 * mouse is a lofted one-button brick. Everything is lit in crtKit's softbox
 * studio, with soft (VSM) shadows redrawn only when something moves, and goes
 * through its post chain: MSAA, ground-truth AO in every seam, a bloom kept to
 * a whisper (none at all over a white page), and the NaN scrub Metal needs.
 *
 * The screen is a real 512×342 one-bit framebuffer drawn by macRaster: a
 * hand-drawn 10px bitmap font, display type thresholded from Instrument Serif,
 * flood-filled icons and 8×8 patterns. It is pixel-doubled into a canvas and
 * becomes the glass's emissive term: barrel, scanlines sized to the on-screen
 * pixel height, vignette, and a power-on that opens the raster from a dot to a
 * line, steady (no flicker, no rolling band).
 *
 * Pointer to screen: the ray is intersected with the bulged glass in its own
 * space, and the shader's barrel mapping, run forward from that glass uv, gives
 * the logical pixel under the pointer, so the one-bit cursor sits exactly under
 * the hidden real one. The mouse on the desk follows that cursor, and its
 * button goes down with every click. The first click on the glass leans the
 * camera in: two solved poses (the product shot, and the tube nearly square
 * on) with a lens shift, and the camera springs between them.
 *
 * The desktop is a window manager over the apps in macApps (paint, the piano,
 * the guest book, and the calculator, note pad, alarm clock and control
 * panel): it owns the windows, the menus (an item that cannot apply is left
 * out, never greyed), the trash, the list view, the floppy that waits half out
 * of the slot and mounts when pushed in, File ▸ print, and the paper-plane
 * screensaver.
 */

// ── screen ────────────────────────────────────────────────────────────────
const MENU_H = 20
const TB = 18 // window title bar; its bottom rule sits at y + TB
const BARREL = 0.03
// the lit raster inside the glass, at the framebuffer's own aspect
const IMG_W = GLASS_W * 0.93
const IMG_H = (IMG_W * SH) / SW

// ── on the desk: the keyboard (crtKit's) and the mouse (macKit's) ─────────
const KB_X = -0.06
const KB_Z = 0.6
const MS_X = 0.84
const MS_Z = 0.6
const MS_YAW = -0.12
type KeyDef = { code: string; label: string; ch?: string; w: number; mod?: boolean; accent?: boolean }
const kd = (code: string, label: string, ch?: string, w = 1, mod = false, accent = false): KeyDef => ({ code, label, ch, w, mod, accent })
const letters = (s: string) => [...s].map((c) => kd(`Key${c.toUpperCase()}`, c.toUpperCase(), c))
// the compact layout: no function row, no arrows, no keypad
const LAYOUT: KeyDef[][] = [
  [kd('Backquote', '`', '`'), ...[...'1234567890'].map((d) => kd(`Digit${d}`, d, d)), kd('Minus', '-', '-'), kd('Equal', '=', '='), kd('Backspace', 'delete', undefined, 2, true)],
  [kd('Tab', 'tab', undefined, 1.5, true), ...letters('qwertyuiop'), kd('BracketLeft', '[', '['), kd('BracketRight', ']', ']'), kd('Backslash', '\\', '\\', 1.5)],
  [kd('CapsLock', 'caps', undefined, 1.75, true), ...letters('asdfghjkl'), kd('Semicolon', ';', ';'), kd('Quote', "'", "'"), kd('Enter', 'return', undefined, 2.25, true, true)],
  [kd('ShiftLeft', 'shift', undefined, 2.25, true), ...letters('zxcvbnm'), kd('Comma', ',', ','), kd('Period', '.', '.'), kd('Slash', '/', '/'), kd('ShiftRight', 'shift', undefined, 2.75, true)],
  [kd('AltLeft', 'option', undefined, 1.5, true), kd('MetaLeft', 'cmd', undefined, 1.5, true), kd('Space', '', ' ', 9), kd('NumpadEnter', 'enter', undefined, 1.5, true), kd('AltRight', 'option', undefined, 1.5, true)],
]


/**
 * Platinum in the light (a cool warm-grey, not the cream it was: next to a
 * white page and white polaroids the cream read yellow), graphite in the dark.
 * The keyboard is a shade off the case, as it always was: another tool,
 * another batch.
 */
const LOOK = {
  light: {
    plastic: '#d8d6cf',
    kbPlastic: '#d2cfc7',
    base: '#c6c3ba',
    well: '#8c8a84',
    slot: '#1b1a19',
    keyAlpha: '#e4e2dc',
    keyMod: '#cfccc4',
    ink: '#55534e',
    glass: '#1b1e1f',
    badge: '#2a2b2e',
    ground: 0.1,
    contact: 0.42,
    env: 0.85,
    key: 1.4,
    rim: 0.9,
    soft: 9,
    gain: 0.92,
    spill: 0.04,
    // none: bloom is additive light, and over a white page the transparent
    // canvas composites it as a wide grey smudge round the machine
    bloom: 0,
    exposure: 1,
    aoFloor: 0.6,
  },
  dark: {
    plastic: '#303135',
    kbPlastic: '#2c2d31',
    base: '#26272a',
    well: '#111214',
    slot: '#0a0b0c',
    keyAlpha: '#3b3d42',
    keyMod: '#2d2f33',
    ink: '#c4c7cd',
    glass: '#111315',
    badge: '#1a1b1e',
    ground: 0.45,
    contact: 0.75,
    env: 0.55,
    key: 1.3,
    rim: 2.2,
    soft: 7,
    // the phosphor sits just over the bloom threshold: a whisper of glow, not a halo
    gain: 0.76,
    spill: 0.1,
    bloom: 0.08,
    exposure: 1,
    aoFloor: 0.9,
  },
}
// ── geometry helpers ──────────────────────────────────────────────────────
/** A tube whose path can change every frame without reallocating (the cords). */
function makeCord(n: number, radius: number, radial: number, mat: THREE.Material) {
  const verts = (n + 1) * (radial + 1)
  const pos = new Float32Array(verts * 3)
  const nrm = new Float32Array(verts * 3)
  const idx: number[] = []
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < radial; j++) {
      const a = i * (radial + 1) + j
      const b = (i + 1) * (radial + 1) + j
      // wound so the faces point out (the other way, the far wall's inside showed, black)
      idx.push(a, a + 1, b, b, a + 1, b + 1)
    }
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  g.setAttribute('normal', new THREE.BufferAttribute(nrm, 3))
  g.setIndex(idx)
  const mesh = new THREE.Mesh(g, mat)
  // a soft (VSM) map cannot resolve a 3 mm tube: it would shadow itself black
  mesh.castShadow = true
  mesh.frustumCulled = false
  const T = new THREE.Vector3()
  const N = new THREE.Vector3(0, 1, 0)
  const B = new THREE.Vector3()
  const tmp = new THREE.Vector3()
  const update = (pts: THREE.Vector3[]) => {
    // parallel transport: carry the previous normal along, so the tube never twists
    N.set(0, 1, 0)
    for (let i = 0; i <= n; i++) {
      const a = pts[Math.max(0, i - 1)]
      const b = pts[Math.min(n, i + 1)]
      T.subVectors(b, a).normalize()
      N.sub(tmp.copy(T).multiplyScalar(N.dot(T)))
      if (N.lengthSq() < 1e-8) N.set(1, 0, 0).sub(tmp.copy(T).multiplyScalar(T.x))
      N.normalize()
      B.crossVectors(T, N)
      const c = pts[i]
      for (let j = 0; j <= radial; j++) {
        const th = (j / radial) * Math.PI * 2
        const cs = Math.cos(th)
        const sn = Math.sin(th)
        const nx = N.x * cs + B.x * sn
        const ny = N.y * cs + B.y * sn
        const nz = N.z * cs + B.z * sn
        const o = (i * (radial + 1) + j) * 3
        nrm[o] = nx
        nrm[o + 1] = ny
        nrm[o + 2] = nz
        pos[o] = c.x + nx * radius
        pos[o + 1] = c.y + ny * radius
        pos[o + 2] = c.z + nz * radius
      }
    }
    g.attributes.position.needsUpdate = true
    g.attributes.normal.needsUpdate = true
  }
  return { mesh, update }
}

// ── the desktop's furniture ───────────────────────────────────────────────
type IconId = BaseIconId | 'piano' | 'guests' | 'disk'
type WinKind = IconId | 'project' | 'calc' | 'notes' | 'alarm' | 'control'
/** A window around an app's content. */
const around = (s: { w: number; h: number }) => ({ w: s.w + 2, h: s.h + TB + 2 })
const SPEC: Record<WinKind, Rect & { title: string }> = {
  about: { title: 'about', x: 22, y: 32, w: 292, h: 196 },
  projects: { title: 'projects', x: 44, y: 54, w: 392, h: 150 },
  guests: { title: 'guest book', x: 40, y: 30, ...around(GUEST_SIZE) },
  paint: { title: 'paint', x: 12, y: 26, w: 442, h: 296 },
  piano: { title: 'piano', x: 28, y: 150, ...around(PIANO_SIZE) },
  contact: { title: 'contact', x: 92, y: 118, w: 300, h: 118 },
  trash: { title: 'trash', x: 168, y: 150, w: 220, h: 120 },
  disk: { title: 'yihan', x: 120, y: 64, w: 230, h: 110 },
  project: { title: '', x: 104, y: 70, w: 316, h: 182 },
  calc: { title: 'calculator', x: 250, y: 58, ...around(CALC_SIZE) },
  notes: { title: 'note pad', x: 150, y: 70, ...around(NOTES_SIZE) },
  alarm: { title: 'alarm clock', x: 168, y: 40, ...around(ALARM_SIZE) },
  control: { title: 'control panel', x: 90, y: 88, ...around(CONTROL_SIZE) },
}
const ICONS: { id: IconId; label: string; x: number; y: number }[] = [
  { id: 'about', label: 'about', x: 464, y: 28 },
  { id: 'projects', label: 'projects', x: 464, y: 74 },
  { id: 'paint', label: 'paint', x: 464, y: 120 },
  { id: 'contact', label: 'contact', x: 464, y: 166 },
  { id: 'piano', label: 'piano', x: 408, y: 28 },
  { id: 'guests', label: 'guest book', x: 408, y: 74 },
  { id: 'disk', label: 'yihan', x: 408, y: 120 },
  { id: 'trash', label: 'trash', x: 464, y: 290 },
]
const short = (u: string) => u.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')
const CONTACT_ROWS: [string, string, string][] = [
  ['email', EMAIL, `mailto:${EMAIL}`],
  ['github', short(GITHUB_URL), GITHUB_URL],
  ['linkedin', short(LINKEDIN_URL), LINKEDIN_URL],
  ['x', short(X_URL), X_URL],
  ['instagram', short(INSTAGRAM_URL), INSTAGRAM_URL],
]
/** What is on the floppy: the rest of the site. Opening one goes there. */
const DISK_FILES: { label: string; path: string }[] = [
  { label: 'resume', path: '/resume' },
  { label: 'projects', path: '/projects' },
  { label: 'blog', path: '/blog' },
  { label: 'play', path: '/play' },
]

type Win = { id: string; kind: WinKind; title: string; x: number; y: number; w: number; h: number; z: number; slug?: string }
type Link = Rect & { url: string; win: string }
/** A menu item. `show` hides it when it cannot apply: nothing on this desktop is ever greyed out. */
type Item = { label: string; act: () => void; show?: () => boolean; check?: () => boolean } | '-'
type Menu = { title: string; x: number; w: number; items: Item[]; hidden?: boolean }
type Step = { k: 'move'; to: () => [number, number] | null; ms?: number } | { k: 'wait'; ms: number } | { k: 'down' } | { k: 'up' }
type Plane = { x: number; y: number; v: number; ph: number }

/**
 * The machine itself: the 3D scene and everything on its screen. It fills the
 * hero's box; the page around it (Home) owns the box, the heading and the
 * painted name, so those are up before this chunk has even arrived.
 * `onLean` says when the camera has leaned in, so the name can step aside.
 */
export default function MacHero({ onLean }: { onLean?: (leaned: boolean) => void }) {
  const hostRef = useRef<HTMLDivElement>(null)
  const onLeanRef = useRef(onLean ?? (() => {}))
  onLeanRef.current = onLean ?? (() => {})
  const theme = useThemeColors()
  const themeRef = useRef(theme)
  themeRef.current = theme
  const applyThemeRef = useRef<() => void>(() => {})
  const [leaned, setLeaned] = useState(false)
  const [printout, setPrintout] = useState<{ url: string; x: number; y: number; w: number; at: number } | null>(null)
  const standBackRef = useRef<() => void>(() => {})

  useEffect(() => {
    applyThemeRef.current()
  }, [theme])

  useEffect(() => {
    onLeanRef.current(leaned)
  }, [leaned])

  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    let disposed = false

    // ── renderer, scene, light ──────────────────────────────────────────
    // the frame runs through crtKit's post chain, which multisamples its own
    // target, so the canvas itself needs no MSAA
    const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true, powerPreference: 'high-performance' })
    renderer.setPixelRatio(dpr)
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.NeutralToneMapping
    renderer.toneMappingExposure = 1
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.VSMShadowMap
    // the shadow map is redrawn only on frames where something that casts one moves
    renderer.shadowMap.autoUpdate = false
    renderer.shadowMap.needsUpdate = true
    renderer.setClearColor(0x000000, 0)
    const canvas = renderer.domElement
    canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;outline:none;opacity:0;transition:opacity 700ms ease'
    host.appendChild(canvas)

    const scene = new THREE.Scene()
    // a product photographer's studio (crtKit): softboxes whose highlights roll across the bevels
    const envTex = studioEnvironment(renderer)
    scene.environment = envTex

    const camera = new THREE.PerspectiveCamera(22, 1, 0.1, 40)
    // MSAA half-float target, ground-truth AO in every seam, a restrained
    // bloom (high threshold: only the phosphor), and the NaN scrub Metal needs
    const post = createPost(renderer, scene, camera, dpr > 1.5 ? 2 : 4)
    // with no GPU (a software rasteriser) AO costs more than the rest of the
    // frame together: leave it out there (?hq keeps it, to check the look headless)
    {
      const ctx = renderer.getContext()
      const info = ctx.getExtension('WEBGL_debug_renderer_info')
      const name = info ? String(ctx.getParameter(info.UNMASKED_RENDERER_WEBGL)) : ''
      post.aoOn = !/swiftshader|llvmpipe|software/i.test(name) || new URLSearchParams(window.location.search).has('hq')
    }
    // a phone's GPU is not a desktop's: no AO, and a smaller shadow map
    const light = window.matchMedia('(pointer: coarse)').matches
    if (light) post.aoOn = false

    // a close soft spot up and to the left gives the faces a real falloff; the
    // directional key casts the shadow, soft (VSM, blurred) and 2k; a cool rim
    // separates the back edges from the page
    const spot = new THREE.SpotLight(0xffffff, 10, 0, 0.62, 1, 2)
    spot.position.set(-1.35, 2.3, 2.0)
    spot.target.position.set(0.25, 0.45, -0.3)
    scene.add(spot, spot.target)
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.4)
    keyLight.position.set(-2.0, 5.4, 2.6)
    keyLight.castShadow = true
    keyLight.shadow.mapSize.set(light ? 1024 : 2048, light ? 1024 : 2048)
    keyLight.shadow.camera.left = -1.7
    keyLight.shadow.camera.right = 1.7
    keyLight.shadow.camera.top = 1.7
    keyLight.shadow.camera.bottom = -1.7
    keyLight.shadow.camera.near = 1
    keyLight.shadow.camera.far = 12
    keyLight.shadow.bias = -0.0002
    keyLight.shadow.normalBias = 0.004
    keyLight.shadow.radius = 9
    keyLight.shadow.blurSamples = 16
    scene.add(keyLight)
    const rim = new THREE.DirectionalLight(0xe8eeff, 0.8)
    rim.position.set(2.8, 2.4, -3.2)
    scene.add(rim)

    // ── materials ───────────────────────────────────────────────────────
    // textured ABS: an orange peel in the normal and the clearcoat (crtKit),
    // the keyboard a little rougher and differently peeled
    const PEEL = { f: 520, k: 0.028, r: 0.16 }
    const plastic = peeled(new THREE.MeshPhysicalMaterial({ roughness: 0.48, clearcoat: 0.14, clearcoatRoughness: 0.32 }), PEEL, 'peel')
    const kbPlastic = peeled(new THREE.MeshPhysicalMaterial({ roughness: 0.52, clearcoat: 0.1, clearcoatRoughness: 0.36 }), { f: 640, k: 0.026, r: 0.2 }, 'peel')
    const baseMat = peeled(new THREE.MeshStandardMaterial({ roughness: 0.58 }), PEEL, 'peel')
    const wellMat = new THREE.MeshStandardMaterial({ roughness: 0.85 })
    const slotMat = new THREE.MeshStandardMaterial({ roughness: 0.95 })
    const switchMat = new THREE.MeshStandardMaterial({ roughness: 0.45, color: '#2a2a2c' })
    const rubberMat = new THREE.MeshStandardMaterial({ roughness: 0.95, color: '#1c1c1e' })
    const badgeMat = new THREE.MeshStandardMaterial({ metalness: 0.2, roughness: 0.38 })
    // dry, matte caps: their grain only a roughness at this distance
    const keyMat = new THREE.MeshStandardMaterial({ roughness: 0.6, color: 0xffffff })
    const cordMat = new THREE.MeshStandardMaterial({ roughness: 0.55 })
    const groundMat = new THREE.ShadowMaterial({ opacity: 0.15 })

    // the tube, as the glass's emissive term
    const crt = {
      uScreen: { value: null as THREE.Texture | null },
      uPower: { value: 0 },
      uLines: { value: 220 },
      uBarrel: { value: BARREL },
      uGain: { value: 1 },
      uImg: { value: new THREE.Vector2(GLASS_W / IMG_W, GLASS_H / IMG_H) },
      uTex: { value: new THREE.Vector2(SW * 2, SH * 2) },
      uPhos: { value: new THREE.Color(0.93, 0.96, 1.0) },
      uGlow: { value: new THREE.Color(0.78, 0.86, 1.0) },
    }
    const glassMat = new THREE.MeshPhysicalMaterial({ roughness: 0.22, metalness: 0 })
    glassMat.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, crt)
      sh.vertexShader = sh.vertexShader
        .replace('#include <common>', '#include <common>\nvarying vec2 vCrtUv;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\nvCrtUv = uv;')
      sh.fragmentShader = sh.fragmentShader
        .replace(
          '#include <common>',
          /* glsl */ `#include <common>
uniform sampler2D uScreen;
uniform float uPower, uLines, uBarrel, uGain;
uniform vec2 uImg, uTex;
uniform vec3 uPhos, uGlow;
varying vec2 vCrtUv;
float sdRBox(vec2 p, vec2 b, float r) { vec2 q = abs(p) - b + r; return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r; }`,
        )
        .replace(
          '#include <emissivemap_fragment>',
          /* glsl */ `{
vec2 cc = (vCrtUv - 0.5) * uImg * 2.0;
cc *= 1.0 + uBarrel * dot(cc, cc);
// switch-on: the raster opens from a dot to a line to the full frame
float pw = clamp(uPower, 0.0, 1.0);
vec2 open = vec2(max(smoothstep(0.0, 0.35, pw), 0.004), max(smoothstep(0.25, 1.0, pw), 0.003));
vec2 sc = cc / open;
vec2 iuv = sc * 0.5 + 0.5;
float edge = sdRBox(sc, vec2(1.0), 0.04);
float inside = (1.0 - smoothstep(-0.006, 0.006, edge)) * step(0.0001, pw);
// sharp pixel edges when the tube is near; when it is far, the gradients are
// widened a little so the one-pixel dither averages to grey instead of moire
vec2 tp = iuv * uTex;
vec2 fw = max(fwidth(tp), vec2(1e-4));
vec2 sharp = (floor(tp) + 0.5 + clamp((fract(tp) - 0.5) / fw, -0.5, 0.5)) / uTex;
float L = textureGrad(uScreen, sharp, dFdx(iuv) * 1.5, dFdy(iuv) * 1.5).g;
float g1 = texture2D(uScreen, iuv, 2.0).g;
float g2 = texture2D(uScreen, iuv, 4.5).g;
// faint scanlines, filled in where the phosphor is driven hard
float scan = 0.5 + 0.5 * cos(iuv.y * uLines * 6.28318);
L *= mix(mix(0.78, 1.0, scan), 1.0, L * 0.35);
float vig = mix(0.68, 1.0, 1.0 - smoothstep(0.6, 1.8, length(cc * vec2(0.92, 1.0))));
float hot = 1.0 + (1.0 - smoothstep(0.6, 1.0, pw)) * 2.5;
vec3 crt = uPhos * L * 1.4 + uGlow * (g1 * 0.1 + g2 * 0.14);
// steady: no flicker and no rolling band. A screen you read from sits still
crt *= uGain * vig * hot;
crt += uPhos * 0.012 * hot;
crt *= inside;
// a little of the halo bleeds past the raster into the dark glass
crt += uGlow * g2 * 0.16 * (1.0 - inside) * (1.0 - smoothstep(0.0, 0.25, edge)) * step(0.0001, pw);
totalEmissiveRadiance = crt;
}`,
        )
    }

    // the front piece: the case plastic, plus the tube's own light spilling up its
    // slope (a real light in the recess would also put a hot spot on the glass)
    const spillU = { uSpill: { value: 0 } }
    const hoodPeel = peelUniforms(PEEL)
    const hoodMat = new THREE.MeshPhysicalMaterial({ roughness: 0.48, clearcoat: 0.14, clearcoatRoughness: 0.32 })
    hoodMat.onBeforeCompile = (sh) => {
      injectPeel(sh, hoodPeel)
      Object.assign(sh.uniforms, spillU)
      sh.vertexShader = sh.vertexShader
        .replace('#include <common>', '#include <common>\nattribute float aSpill;\nvarying float vSpill;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\nvSpill = aSpill;')
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', '#include <common>\nuniform float uSpill;\nvarying float vSpill;')
        .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance += vec3(0.86, 0.9, 1.0) * uSpill * vSpill * vSpill;')
    }
    hoodMat.customProgramCacheKey = () => 'mac-hood'
    const shadowCast = <M extends THREE.Mesh>(m: M): M => {
      m.castShadow = true
      m.receiveShadow = true
      return m
    }

    // ── the case ────────────────────────────────────────────────────────
    // `mac` pivots about the middle of the footprint (the swivel); `body` holds the parts
    const mac = new THREE.Group()
    mac.position.z = -CASE_D / 2
    scene.add(mac)
    const body = new THREE.Group()
    body.position.z = CASE_D / 2
    mac.add(body)

    // the front piece, one lofted surface (macKit): the roll, the face, the lip,
    // and the deep slope down onto the glass
    const hood = shadowCast(new THREE.Mesh(hoodGeometry(), hoodMat))
    hood.position.y = HOOD_CY
    body.add(hood)

    // the tube: tilted back a little, bulged
    const tube = new THREE.Group()
    tube.position.set(0, OPEN_CY, 0)
    body.add(tube)
    const glassGeo = new THREE.PlaneGeometry(GLASS_W, GLASS_H, 48, 36)
    {
      const p = glassGeo.attributes.position
      for (let i = 0; i < p.count; i++) p.setZ(i, bulge(p.getX(i), p.getY(i)))
      glassGeo.computeVertexNormals()
    }
    const glass = new THREE.Mesh(glassGeo, glassMat)
    glass.applyMatrix4(glassPose())
    glass.receiveShadow = true
    tube.add(glass)

    // the rear housing, narrowing and dropping toward the back; where it meets
    // the front piece is the parting line
    const rear = shadowCast(new THREE.Mesh(rearGeometry(), plastic))
    rear.position.set(0, REAR_CY, REAR_Z)
    body.add(rear)

    // the foot: a slab set in under the case, so the case stands on a shadow line
    const foot = shadowCast(new THREE.Mesh(new RoundedBoxGeometry(CASE_W - 0.1, FOOT_H + 0.012, CASE_D - 0.16, 3, 0.012), baseMat))
    foot.position.set(0, (FOOT_H + 0.012) / 2 - 0.004, -CASE_D / 2 - 0.01)
    body.add(foot)

    // cut into the case: the floppy's recess and slot, the eject pinhole, the
    // ridges across the lower front, the carry handle and the vents on top.
    // Each is a decal that ray-marches a pocket behind the surface (crtKit
    // holeMaterial), so it reads as cut from any angle with no geometry
    const cutMats: THREE.MeshLambertMaterial[] = []
    const cut = (h: Holes) => {
      const m = holeMaterial(h)
      cutMats.push(m)
      return m
    }
    const decal = (w: number, h: number, mat: THREE.Material, at: { pos: THREE.Vector3; n: THREE.Vector3 }, up?: THREE.Vector3, lift?: number) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat)
      placeOn(m, at.pos, at.n, up, lift)
      m.receiveShadow = true
      m.renderOrder = 2
      body.add(m)
      return m
    }
    const FRONT = new THREE.Vector3(0, 0, 1)
    const BACK = new THREE.Vector3(0, 0, -1)
    const onFace = (x: number, y: number) => ({ pos: new THREE.Vector3(x, y, 0), n: FRONT })
    // the recess the slot sits in (walls only: its floor is the lit face), then
    // the slot itself, dark all the way down, and the pinhole for a bent paperclip
    decal(SLOT_W + 0.08, 0.1, cut({ round: false, pitch: [1, 1], count: [1, 1], size: [SLOT_W / 2 + 0.026, 0.036], corner: 0.032, depth: 0.007, floorAlpha: 0, light: [-0.35, 1] }), onFace(SLOT_X, SLOT_Y), undefined, 0.0004)
    decal(SLOT_W + 0.02, SLOT_H + 0.02, cut({ round: false, pitch: [1, 1], count: [1, 1], size: [SLOT_W / 2, SLOT_H / 2], corner: SLOT_H / 2 - 0.002, depth: 0.06, floor: 0.02, light: [-0.35, 1] }), onFace(SLOT_X, SLOT_Y), undefined, 0.0008)
    decal(0.02, 0.02, cut({ round: true, pitch: [1, 1], count: [1, 1], size: [0.0042, 0], depth: 0.014 }), onFace(SLOT_X + SLOT_W / 2 + 0.05, SLOT_Y), undefined, 0.0004)
    // the ridges across the lower front
    decal(0.84, 0.08, cut({ round: false, pitch: [1, 0.019], count: [1, 3], size: [0.4, 0.0026], corner: 0.0026, depth: 0.006, floor: 0.35, light: [-0.35, 1] }), onFace(0, 0.115), undefined, 0.0004)
    // on top at the back: the carry handle, and two banks of vents ahead of it
    decal(0.6, 0.09, cut({ round: false, pitch: [1, 1], count: [1, 1], size: [0.27, 0.03], corner: 0.028, depth: 0.07, floor: 0.03, light: [-0.35, -1] }), rearTop(-CASE_D + 0.13), BACK)
    for (const sx of [-1, 1]) decal(0.26, 0.17, cut({ round: false, pitch: [0.028, 1], count: [8, 1], size: [0.0048, 0.07], corner: 0.0045, depth: 0.03, light: [-0.35, -1] }), rearTop(-CASE_D + 0.36, sx * 0.19), BACK)
    // the slot takes clicks (the disk lives there); invisible, but the ray finds it
    const slotHit = new THREE.Mesh(new THREE.PlaneGeometry(SLOT_W + 0.04, SLOT_H + 0.05), new THREE.MeshBasicMaterial({ visible: false }))
    slotHit.position.set(SLOT_X, SLOT_Y, 0.002)
    body.add(slotHit)

    // the floppy: it lives in the drive, out of sight, until it is ejected; the
    // shutter end goes in first, the label end is what sticks out
    const DISK_IN = -DISK_L / 2 - 0.02
    const DISK_OUT = -DISK_L / 2 + 0.135
    const diskMat = new THREE.MeshPhysicalMaterial({ color: '#232427', roughness: 0.42, clearcoat: 0.2, clearcoatRoughness: 0.4 })
    const shutterMat = new THREE.MeshStandardMaterial({ color: '#b9bdc3', metalness: 0.85, roughness: 0.32 })
    const labelCanvas = document.createElement('canvas')
    labelCanvas.width = 512
    labelCanvas.height = 256
    const labelTex = new THREE.CanvasTexture(labelCanvas)
    labelTex.colorSpace = THREE.SRGBColorSpace
    labelTex.anisotropy = 8
    const disk = new THREE.Group()
    disk.position.set(SLOT_X, SLOT_Y, DISK_IN)
    disk.visible = false
    body.add(disk)
    const diskShell = shadowCast(new THREE.Mesh(new RoundedBoxGeometry(DISK_W, DISK_T, DISK_L, 2, 0.004), diskMat))
    disk.add(diskShell)
    const shutter = new THREE.Mesh(new THREE.BoxGeometry(DISK_W * 0.5, DISK_T + 0.0016, DISK_L * 0.3), shutterMat)
    shutter.position.set(-DISK_W * 0.05, 0, -DISK_L / 2 + DISK_L * 0.15)
    disk.add(shutter)
    const diskLabel = new THREE.Mesh(new THREE.PlaneGeometry(DISK_W * 0.8, DISK_L * 0.36), new THREE.MeshStandardMaterial({ map: labelTex, roughness: 0.7 }))
    diskLabel.rotation.x = -Math.PI / 2
    diskLabel.position.set(0, DISK_T / 2 + 0.0004, DISK_L / 2 - DISK_L * 0.2)
    disk.add(diskLabel)
    const diskParts = new Set<THREE.Object3D>([diskShell, shutter, diskLabel])
    /** The label, written by hand in the site's face on a ruled sticker. */
    const drawDiskLabel = (face: string) => {
      const c = labelCanvas.getContext('2d')!
      c.fillStyle = '#f4f1e8'
      c.fillRect(0, 0, 512, 256)
      c.strokeStyle = 'rgba(40,50,90,0.25)'
      c.lineWidth = 2
      for (let y = 70; y < 256; y += 46) {
        c.beginPath()
        c.moveTo(24, y)
        c.lineTo(488, y)
        c.stroke()
      }
      c.fillStyle = '#1f2a5a'
      c.font = `400 120px ${face}`
      c.save()
      c.translate(44, 168)
      c.rotate(-0.04)
      c.fillText('yihan', 0, 0)
      c.restore()
      labelTex.needsUpdate = true
    }

    // the badge, where a maker's mark would sit
    const BADGE_X = -0.35
    const BADGE_Y = 0.2
    const badge = shadowCast(new THREE.Mesh(new RoundedBoxGeometry(0.07, 0.044, 0.006, 2, 0.004), badgeMat))
    badge.position.set(BADGE_X, BADGE_Y, 0.002)
    body.add(badge)
    const badgeCanvas = document.createElement('canvas')
    badgeCanvas.width = 224
    badgeCanvas.height = 140
    const badgeTex = new THREE.CanvasTexture(badgeCanvas)
    badgeTex.colorSpace = THREE.SRGBColorSpace
    badgeTex.anisotropy = 4
    const badgeInk = new THREE.Mesh(new THREE.PlaneGeometry(0.07, 0.044), new THREE.MeshStandardMaterial({ map: badgeTex, transparent: true, roughness: 0.35, metalness: 0 }))
    badgeInk.position.set(BADGE_X, BADGE_Y, 0.0052)
    body.add(badgeInk)

    // ── keyboard ────────────────────────────────────────────────────────
    // crtKit's: a stepped, chamfered case with a well for the plate, and
    // sculpted caps whose rows each sit at their own height and angle
    const kb = new THREE.Group()
    kb.position.set(KB_X, 0, KB_Z)
    kb.rotation.x = KB_TILT
    scene.add(kb)
    const slab = shadowCast(new THREE.Mesh(caseGeometry(), kbPlastic))
    kb.add(slab)
    const well = new THREE.Mesh(new THREE.PlaneGeometry(WELL_W - 0.004, WELL_D - 0.004), wellMat)
    well.rotation.x = -Math.PI / 2
    well.position.set(0, KB_FLOOR + 0.0002, WELL_Z)
    well.receiveShadow = true
    kb.add(well)
    // feet: flip-outs at the back to set the angle, rubber pads at the front
    for (const sx of [-0.46, 0.46]) {
      const back = shadowCast(new THREE.Mesh(new RoundedBoxGeometry(0.05, 0.024, 0.026, 2, 0.004), rubberMat))
      back.position.set(sx, KB_BOT - 0.0105, -KB_D / 2 + 0.03)
      kb.add(back)
      const pad = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.004, 18), rubberMat)
      pad.position.set(sx, KB_BOT - 0.0015, KB_D / 2 - 0.03)
      kb.add(pad)
    }

    const atlasCanvas = document.createElement('canvas')
    atlasCanvas.width = 1024
    atlasCanvas.height = 1024
    const atlasTex = new THREE.CanvasTexture(atlasCanvas)
    const labels: string[] = []
    const cellOf = (label: string) => {
      if (!label) return -1
      let i = labels.indexOf(label)
      if (i < 0) {
        labels.push(label)
        i = labels.length - 1
      }
      return i
    }
    const keyUniforms = {
      uAtlas: { value: atlasTex },
      uInk: { value: new THREE.Color('#57524a') },
      uInkAcc: { value: new THREE.Color('#ffffff') },
      uLegend: { value: 0.036 },
    }
    const keyPeel = peelUniforms({ f: 620, k: 0.04, r: 0.3 })
    keyMat.onBeforeCompile = (sh) => {
      injectPeel(sh, keyPeel)
      Object.assign(sh.uniforms, keyUniforms)
      sh.vertexShader = sh.vertexShader
        .replace('#include <common>', '#include <common>\nattribute vec2 aLeg;\nvarying vec3 vKP;\nvarying vec3 vKN;\nvarying vec2 vLeg;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\nvKP = position;\nvKN = normal;\nvLeg = aLeg;')
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', '#include <common>\nuniform sampler2D uAtlas;\nuniform vec3 uInk;\nuniform vec3 uInkAcc;\nuniform float uLegend;\nvarying vec3 vKP;\nvarying vec3 vKN;\nvarying vec2 vLeg;')
        .replace(
          '#include <color_fragment>',
          /* glsl */ `#include <color_fragment>
{
vec2 lu = vec2(vKP.x, -vKP.z) / uLegend + 0.5;
vec2 lc = clamp(lu, 0.0, 1.0);
float cx = mod(vLeg.x, 8.0);
float cy = floor(vLeg.x / 8.0);
float ink = texture2D(uAtlas, vec2((cx + lc.x) / 8.0, 1.0 - (cy + 1.0 - lc.y) / 8.0)).a;
float onTop = smoothstep(0.8, 0.97, vKN.y) * step(0.0, vLeg.x) * step(lu.x, 1.0) * step(0.0, lu.x) * step(lu.y, 1.0) * step(0.0, lu.y);
diffuseColor.rgb = mix(diffuseColor.rgb, mix(uInk, uInkAcc, vLeg.y), ink * onTop * 0.9);
}`,
        )
    }
    keyMat.customProgramCacheKey = () => 'mac-keycap'

    type Key = { def: KeyDef; mesh: THREE.InstancedMesh; idx: number; x: number; z: number; row: number; d: number; v: number; held: boolean; until: number }
    const keys: Key[] = []
    const keyMeshes: THREE.InstancedMesh[] = []
    {
      const groups = new Map<number, { def: KeyDef; x: number; z: number; row: number }[]>()
      LAYOUT.forEach((row, r) => {
        let x = -7.5 * U
        for (const def of row) {
          const list = groups.get(def.w) ?? []
          list.push({ def, x: x + (def.w * U) / 2, z: WELL_Z + (r - 2) * U, row: r })
          groups.set(def.w, list)
          x += def.w * U
        }
      })
      for (const [w, list] of groups) {
        const geo = keycapGeometry(w)
        const leg = new Float32Array(list.length * 2)
        list.forEach((k, i) => {
          leg[i * 2] = cellOf(k.def.label)
          leg[i * 2 + 1] = k.def.accent ? 1 : 0
        })
        geo.setAttribute('aLeg', new THREE.InstancedBufferAttribute(leg, 2))
        const mesh = new THREE.InstancedMesh(geo, keyMat, list.length)
        mesh.castShadow = true
        mesh.receiveShadow = true
        list.forEach((k, i) => {
          keys.push({ def: k.def, mesh, idx: i, x: k.x, z: k.z, row: k.row, d: 0, v: 0, held: false, until: 0 })
          mesh.setColorAt(i, new THREE.Color(1, 1, 1))
        })
        kb.add(mesh)
        keyMeshes.push(mesh)
      }
    }
    const mtx = new THREE.Matrix4()
    const tiltM = new THREE.Matrix4()
    const placeKey = (k: Key) => {
      mtx.makeTranslation(k.x, CAP_Y + ROW_LIFT[k.row] - k.d * TRAVEL, k.z).multiply(tiltM.makeRotationX(ROW_TILT[k.row]))
      k.mesh.setMatrixAt(k.idx, mtx)
      k.mesh.instanceMatrix.needsUpdate = true
    }
    keys.forEach(placeKey)
    const byCode = new Map(keys.map((k) => [k.def.code, k]))
    const byChar = new Map<string, Key>()
    for (const k of keys) if (k.def.ch) byChar.set(k.def.ch, k)
    // the switches under the caps: dark housings that show in the gaps
    {
      const sw = new THREE.InstancedMesh(new RoundedBoxGeometry(0.044, 0.0064, 0.044, 1, 0.0018), switchMat, keys.length)
      keys.forEach((k, i) => sw.setMatrixAt(i, mtx.makeTranslation(k.x, KB_FLOOR + 0.0032, k.z)))
      sw.receiveShadow = true
      kb.add(sw)
    }

    // ── mouse ───────────────────────────────────────────────────────────
    // the one-button mouse (macKit): a crowned brick, its button the front third
    // of the top with a dark seam round it
    const mouse = new THREE.Group()
    mouse.position.set(MS_X, 0, MS_Z)
    mouse.rotation.y = MS_YAW
    scene.add(mouse)
    const msBody = shadowCast(new THREE.Mesh(mouseBodyGeometry(), plastic))
    mouse.add(msBody)
    const msSeam = new THREE.Mesh(mouseButtonGeometry(0.0028), slotMat)
    msSeam.receiveShadow = true
    mouse.add(msSeam)
    const msBtn = shadowCast(new THREE.Mesh(mouseButtonGeometry(), plastic))
    mouse.add(msBtn)
    const BTN_Y = 0

    // ── cords ───────────────────────────────────────────────────────────
    const mouseCord = makeCord(90, 0.0034, 6, cordMat)
    scene.add(mouseCord.mesh)
    const COIL_TURNS = 30
    const COIL_N = COIL_TURNS * 12
    const kbCord = makeCord(COIL_N, 0.0024, 5, cordMat)
    scene.add(kbCord.mesh)
    const cv = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z)
    const v3 = new THREE.Vector3()
    const updateCords = () => {
      scene.updateMatrixWorld(true)
      // the mouse cord leaves the button end and runs back past the case to its rear
      const m0 = mouse.localToWorld(cv(0, 0.016, -MS_L / 2 - 0.004))
      const m1 = mouse.localToWorld(cv(0, 0.008, -MS_L / 2 - 0.09))
      const side0 = body.localToWorld(cv(0.6, 0.006, -0.22))
      const side1 = body.localToWorld(cv(0.56, 0.006, -0.72))
      const port = body.localToWorld(cv(0.4, 0.03, -CASE_D + 0.06))
      const path = new THREE.CatmullRomCurve3([m0, m1, cv(MS_X - 0.08, 0.006, 0.2), side0, side1, port], false, 'centripetal')
      const pts: THREE.Vector3[] = []
      for (let i = 0; i <= 90; i++) pts.push(path.getPointAt(i / 90))
      mouseCord.update(pts)
      // the keyboard's coiled cord, from its back edge to the front of the case
      const k0 = kb.localToWorld(cv(-0.36, 0.03, -KB_D / 2 + 0.01))
      const k1 = body.localToWorld(cv(-0.28, 0.012, 0.004))
      const mid = k0.clone().lerp(k1, 0.5)
      mid.y = 0.011
      mid.x -= 0.05
      const cpath = new THREE.CatmullRomCurve3([k0, cv(k0.x - 0.04, 0.011, k0.z - 0.06), mid, cv(k1.x - 0.02, 0.011, k1.z + 0.06), k1])
      const up = cv(0, 1, 0)
      const cp: THREE.Vector3[] = []
      for (let i = 0; i <= COIL_N; i++) {
        const u = i / COIL_N
        const c = cpath.getPointAt(u)
        const tan = cpath.getTangentAt(u)
        const nrm = up.clone().sub(tan.clone().multiplyScalar(up.dot(tan))).normalize()
        const bin = v3.crossVectors(tan, nrm).clone()
        const r = 0.0075 * Math.min(1, u / 0.07, (1 - u) / 0.07)
        const a = u * COIL_TURNS * Math.PI * 2
        cp.push(c.add(nrm.multiplyScalar(Math.cos(a) * r)).add(bin.multiplyScalar(Math.sin(a) * r)))
      }
      kbCord.update(cp)
    }

    // ── floor: a real cast shadow plus baked contact shadows ─────────────
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(9, 9), groundMat)
    ground.rotation.x = -Math.PI / 2
    ground.receiveShadow = true
    scene.add(ground)
    const contacts: { mesh: THREE.Mesh; k: number }[] = []
    const contact = (parent: THREE.Object3D, w: number, d: number, r: number, blur: number, x: number, z: number, k: number) => {
      const tex = shadowTexture(w, d, r, blur)
      const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, color: 0x000000, toneMapped: false })
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat)
      m.rotation.x = -Math.PI / 2
      m.position.set(x, 0.0006, z)
      m.renderOrder = 1
      parent.add(m)
      contacts.push({ mesh: m, k })
    }
    contact(body, 1.6, 1.7, 0.2, 0.24, 0.04, -CASE_D / 2, 0.55)
    contact(body, 1.08, 1.16, 0.05, 0.06, 0, -CASE_D / 2 - 0.01, 1)
    contact(scene, KB_W + 0.2, KB_D + 0.2, 0.08, 0.09, KB_X + 0.01, KB_Z + 0.01, 0.8)
    contact(mouse, MS_W + 0.1, MS_L + 0.1, 0.06, 0.05, 0, 0, 0.9)

    // ── the screen: a one-bit framebuffer, pixel-doubled into a canvas ────
    const R = new Raster()
    const out = new Uint8Array(SW * SH)
    const lc = document.createElement('canvas')
    lc.width = SW
    lc.height = SH
    const lctx = lc.getContext('2d')!
    const limg = lctx.createImageData(SW, SH)
    const l32 = new Uint32Array(limg.data.buffer)
    const sc = document.createElement('canvas')
    sc.width = SW * 2
    sc.height = SH * 2
    const sctx = sc.getContext('2d')!
    sctx.imageSmoothingEnabled = false
    const screenTex = new THREE.CanvasTexture(sc)
    screenTex.colorSpace = THREE.NoColorSpace
    screenTex.minFilter = THREE.LinearMipmapLinearFilter
    screenTex.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy())
    crt.uScreen.value = screenTex

    const ICON_DRAW: Record<IconId, () => Spr> = { ...ICON_SPR, guests: MORE_ICONS.guests, piano: MORE_ICONS.piano, disk: MORE_ICONS.disk }
    const icons = ICONS.map((ic) => ({ ...ic, spr: ICON_DRAW[ic.id](), home: [ic.x, ic.y] as [number, number] }))
    const trashFull = MORE_ICONS.trashFull()
    const MINI_OF: Record<IconId, Spr> = { about: MINI.doc, contact: MINI.doc, projects: MINI.folder, guests: MINI.doc, piano: MINI.app, paint: MINI.app, trash: MINI.trash, disk: MINI.disk }
    let display = 'serif'
    let nameSpr: Spr | null = null
    let welcomeSpr: Spr | null = null
    let yhSpr: Spr | null = null

    // ── state ───────────────────────────────────────────────────────────
    // drawing on demand: the frame is only rendered when something on screen changed
    let lastFrameSig = ''
    let renderAgain = true // asked for from outside the loop (a resize, the theme)
    let presented = false // the screen's texture changed this frame
    let rendered = 0
    let shown = false
    let wall = 0 // ms of wall time, clamped per frame
    let power: 'off' | 'on' = 'off'
    let bootAt = -1 // wall time the tube was switched on
    let offAt = -1
    let desktop = false
    let booted = false // the desktop has come up since the last power-on
    let settled = false // told the page (once) that the hero has landed
    const wins: Win[] = []
    let sel: IconId | null = null
    const cur = { x: 300, y: 196 }
    let curShown = false
    let fbDirty = true // the desktop needs redrawing
    let curDirty = true // only the cursor moved
    const links: Link[] = []
    type Zoom = { from: Rect; to: Rect; at: number; win: Win | null }
    const zooms: Zoom[] = []
    let deskView: 'icon' | 'name' = 'icon'
    const trashed = new Set<IconId>() // in the trash, and can come back out
    const gone = new Set<IconId>() // emptied, until the next restart
    let trashSel: IconId | null = null
    let diskSel = -1
    let mounted = false
    // the floppy, waiting half out of the slot to be pushed in: t runs 0 (all the
    // way in) to 1 (sticking out). A disk you can see is a disk you try
    const floppy = { state: 'out' as 'out' | 'in', t: 1, goal: 1 }
    let saver: { planes: Plane[] } | null = null
    let projSel = -1

    // ── the apps ────────────────────────────────────────────────────────
    const prefs = loadPrefs()
    const clip: Clip = { text: null, bits: null }
    let piano: Piano | null = null
    const appCtx: AppCtx = {
      wall: () => wall,
      sfx: (s) => sfx(s),
      prefs,
      setPrefs: (p) => {
        Object.assign(prefs, p)
        savePrefs(prefs)
        if (p.volume !== undefined) setVolume()
        fbDirty = true
      },
      clip,
      piano: () => piano,
      dirty: () => {
        fbDirty = true
      },
    }
    const paint = new Paint(appCtx)
    const guests = new GuestBook(appCtx)
    const pianoApp = new PianoApp(appCtx)
    const alarm = new AlarmClock(appCtx)
    const apps: Partial<Record<WinKind, App>> = {
      paint,
      guests,
      piano: pianoApp,
      calc: new Calculator(appCtx),
      notes: new NotePad(appCtx),
      alarm,
      control: new ControlPanel(appCtx),
    }

    // input
    type Drag =
      | { k: 'win'; win: Win; dx: number; dy: number }
      | { k: 'icon'; id: IconId; dx: number; dy: number; x0: number; y0: number }
      | { k: 'close'; win: Win }
      | { k: 'menu' }
      | { k: 'app'; win: Win }
      | { k: 'link' }
    let drag: Drag | null = null
    let closing: { win: Win; inside: boolean } | null = null
    let iconDrag: { x: number; y: number; w: number; h: number; moved: boolean } | null = null
    let lastDown = { t: -1e9, rt: -1e9, x: -99, y: -99 }
    let pressedLink: Link | null = null
    let linkInside = false

    // ── one-bit drawing ─────────────────────────────────────────────────
    const contentOf = (w: Win): Rect => ({ x: w.x + 1, y: w.y + TB + 1, w: w.w - 2, h: w.h - TB - 2 })
    const front = () => wins[wins.length - 1] as Win | undefined
    const frontApp = () => {
      const f = front()
      return f ? apps[f.kind] : undefined
    }
    const shownIcons = () => icons.filter((ic) => !trashed.has(ic.id) && !gone.has(ic.id) && (ic.id !== 'disk' || mounted))
    const labelOf = (id: IconId) => icons.find((q) => q.id === id)?.label ?? id
    // the list view: a column of rows down the right, by name
    const LIST_X = 380
    const listed = () => shownIcons().sort((a, b) => a.label.localeCompare(b.label))
    const iconRect = (ic: (typeof icons)[number]): Rect =>
      deskView === 'icon' ? { x: ic.x - 4, y: ic.y, w: 40, h: 46 } : { x: LIST_X, y: MENU_H + 6 + listed().indexOf(ic) * 16, w: SW - LIST_X - 6, h: 15 }

    const drawIcons = () => {
      if (deskView === 'name') {
        for (const ic of listed()) {
          const r = iconRect(ic)
          const on = sel === ic.id
          R.rect(r.x, r.y, r.w, r.h, on ? 1 : 0)
          const m = ic.id === 'trash' && trashed.size ? MINI.trash : MINI_OF[ic.id]
          R.spr(m, r.x + 3, r.y + Math.floor((r.h - m.h) / 2), on)
          R.text(ic.label + (ic.id === 'trash' && trashed.size ? ` (${trashed.size})` : ''), r.x + 17, r.y + 3, on ? 0 : 1)
        }
        return
      }
      for (const ic of shownIcons()) {
        const spr = ic.id === 'trash' && trashed.size ? trashFull : ic.spr
        const on = sel === ic.id
        const open = wins.some((w) => w.id === ic.id)
        if (open && !on) {
          // an open item's icon goes hollow, filled with grey
          for (let j = 0; j < 32; j++) {
            for (let i = 0; i < 32; i++) {
              const v = spr.d[j * 32 + i]
              if (v === 1) R.px(ic.x + i, ic.y + j, 1)
              else if (v === 2) R.px(ic.x + i, ic.y + j, (ic.x + i + ic.y + j) & 1)
            }
          }
        } else R.spr(spr, ic.x, ic.y, on)
        const w = tw(ic.label)
        const tx = Math.round(ic.x + 16 - w / 2)
        R.rect(tx - 2, ic.y + 34, w + 4, 11, on ? 1 : 0)
        R.text(ic.label, tx, ic.y + 34, on ? 0 : 1)
      }
    }

    const drawAbout = (c: Rect) => {
      let y = c.y + 10
      if (nameSpr) {
        R.spr(nameSpr, c.x + 16, y)
        y += nameSpr.h + 6
      }
      R.text(TAGLINE, c.x + 17, y)
      y += 18
      for (let x = c.x + 16; x < c.x + c.w - 16; x += 2) R.px(x, y, 1)
      y += 9
      const row = (label: string, lines: string[]) => {
        R.text(label, c.x + 66 - tw(label, true), y, 1, true)
        for (const l of lines) {
          R.text(l, c.x + 74, y)
          y += 12
        }
        y += 3
      }
      row('where', ['usc · los angeles'])
      row('also', wrapPx(`${THINGS.slice(1).join(', ')}.`, c.w - 90))
      row('site', ['yihan.dev'])
    }

    const drawProjects = (c: Rect) => {
      R.text('name', c.x + 26, c.y + 3, 1, true)
      R.text('about', c.x + 150, c.y + 3, 1, true)
      R.rect(c.x, c.y + 15, c.w, 1, 1)
      projects.forEach((p, i) => {
        const y = c.y + 19 + i * 17
        const on = projSel === i
        if (on) R.rect(c.x + 3, y - 1, c.w - 6, 16, 1)
        R.spr(MINI_DOC, c.x + 10, y + 2, on)
        R.text(fitPx(p.title, 116), c.x + 26, y + 3, on ? 0 : 1)
        R.text(fitPx(p.tagline, c.w - 160), c.x + 150, y + 3, on ? 0 : 1)
      })
    }

    const drawLink = (w: Win, text: string, url: string, x: number, y: number) => {
      const end = R.text(text, x, y)
      R.rect(x, y + 9, end - x - 1, 1, 1)
      const r: Link = { x: x - 2, y: y - 1, w: end - x + 3, h: 12, url, win: w.id }
      links.push(r)
      if (pressedLink && linkInside && pressedLink.url === url && pressedLink.win === w.id) R.rect(r.x, r.y, r.w, r.h, 2)
    }

    const drawProject = (w: Win, c: Rect) => {
      const p = projects.find((q) => q.slug === w.slug)
      if (!p) return
      let y = c.y + 10
      for (const l of wrapPx(p.tagline, c.w - 26)) {
        R.text(l, c.x + 13, y)
        y += 12
      }
      y += 8
      R.text('tags', c.x + 13, y, 1, true)
      for (const l of wrapPx(p.tags.slice(0, 6).join(' · '), c.w - 70)) {
        R.text(l, c.x + 50, y)
        y += 12
      }
      y += 6
      for (const l of p.links ?? []) {
        R.text(l.label.toLowerCase(), c.x + 13, y, 1, true)
        drawLink(w, `${fitPx(short(l.href), c.w - 84)} ↗`, l.href, c.x + 64, y)
        y += 14
      }
    }

    const drawContact = (w: Win, c: Rect) => {
      CONTACT_ROWS.forEach(([label, text, url], i) => {
        const y = c.y + 9 + i * 17
        R.text(label, c.x + 74 - tw(label, true), y, 1, true)
        drawLink(w, text, url, c.x + 84, y)
      })
    }

    /** A list of rows (the trash, the floppy), the chosen one inverted, and a line of help under it. */
    const drawRows = (c: Rect, rows: { spr: Spr; label: string }[], chosen: number, help: string) => {
      rows.forEach((r, i) => {
        const y = c.y + 5 + i * 16
        const on = chosen === i
        if (on) R.rect(c.x + 3, y - 1, c.w - 6, 15, 1)
        R.spr(r.spr, c.x + 9, y + Math.floor((13 - r.spr.h) / 2), on)
        R.text(r.label, c.x + 25, y + 2, on ? 0 : 1)
      })
      for (let x = c.x + 6; x < c.x + c.w - 6; x += 2) R.px(x, c.y + c.h - 18, 1)
      R.text(help, c.x + 9, c.y + c.h - 13)
    }
    const drawTrash = (c: Rect) => {
      const items = [...trashed]
      if (!items.length) {
        const t = 'the trash is empty.'
        R.text(t, c.x + Math.round((c.w - tw(t)) / 2), c.y + Math.round(c.h / 2) - 5)
        return
      }
      drawRows(
        c,
        items.map((id) => ({ spr: MINI_OF[id], label: labelOf(id) })),
        trashSel ? items.indexOf(trashSel) : -1,
        'double-click to put it back',
      )
    }
    const drawDisk = (c: Rect) =>
      drawRows(
        c,
        DISK_FILES.map((f) => ({ spr: MINI.doc, label: f.label })),
        diskSel,
        'double-click to open it on the site',
      )

    const drawWin = (w: Win, active: boolean) => {
      R.unclip()
      R.rect(w.x + 1, w.y + 1, w.w, w.h, 1)
      R.rect(w.x, w.y, w.w, w.h, 0)
      R.frame(w.x, w.y, w.w, w.h)
      R.rect(w.x, w.y + TB, w.w, 1, 1)
      const tl = tw(w.title, true)
      const tx = Math.round(w.x + (w.w - tl) / 2)
      if (active) {
        for (let k = 0; k < 6; k++) R.rect(w.x + 2, w.y + 4 + k * 2, w.w - 4, 1, 1)
        R.rect(w.x + 7, w.y + 3, 13, 13, 0)
        R.frame(w.x + 8, w.y + 4, 11, 11)
        if (closing && closing.win === w && closing.inside) {
          // the close box, held down: a little burst
          R.line(w.x + 10, w.y + 6, w.x + 16, w.y + 12)
          R.line(w.x + 16, w.y + 6, w.x + 10, w.y + 12)
          R.line(w.x + 13, w.y + 5, w.x + 13, w.y + 13)
          R.line(w.x + 9, w.y + 9, w.x + 17, w.y + 9)
        }
        R.rect(tx - 7, w.y + 2, tl + 14, TB - 3, 0)
      }
      R.text(w.title, tx, w.y + 4, 1, true)
      const c = contentOf(w)
      R.clip(c)
      const app = apps[w.kind]
      if (app) app.draw(R, c)
      else if (w.kind === 'about') drawAbout(c)
      else if (w.kind === 'projects') drawProjects(c)
      else if (w.kind === 'project') drawProject(w, c)
      else if (w.kind === 'contact') drawContact(w, c)
      else if (w.kind === 'disk') drawDisk(c)
      else drawTrash(c)
      R.unclip()
    }

    // ── the window manager ──────────────────────────────────────────────
    let zTop = 0
    /** Bring forward. A window whose zoom rects finish late lands at the depth it was opened at, not on top. */
    const raise = (w: Win, z = ++zTop) => {
      w.z = z
      if (!wins.includes(w)) wins.push(w)
      wins.sort((a, b) => a.z - b.z)
      fbDirty = true
    }
    const openWin = (kind: WinKind, slug?: string, from?: Rect) => {
      const id = slug ? `project:${slug}` : kind
      if (zooms.some((z) => z.win?.id === id)) return // already on its way
      if (kind === 'alarm') alarm.hush()
      if (kind === 'guests') guests.load()
      const ex = wins.find((w) => w.id === id)
      const s = SPEC[kind]
      const n = slug ? wins.filter((q) => q.kind === 'project').length : 0
      const w: Win = ex ?? {
        id,
        kind,
        title: slug ? (projects.find((p) => p.slug === slug)?.title ?? '') : s.title,
        x: s.x + n * 12,
        y: s.y + n * 12,
        w: s.w,
        h: s.h,
        z: 0,
        slug,
      }
      // zoom rects from where it was opened; the window lands when they arrive
      if (from && !reduced) {
        w.z = ++zTop
        zooms.push({ from, to: { x: w.x, y: w.y, w: w.w, h: w.h }, at: wall, win: ex ? null : w })
        if (ex) raise(ex)
      } else raise(w)
      fbDirty = true
    }
    const openIcon = (id: IconId) => {
      const ic = icons.find((q) => q.id === id)
      openWin(id, undefined, ic ? (deskView === 'icon' ? { x: ic.x, y: ic.y, w: 32, h: 32 } : iconRect(ic)) : undefined)
    }
    /** A desk accessory, zooming out of the star at the left of the menu bar. */
    const openDA = (kind: WinKind) => openWin(kind, undefined, { x: 6, y: 1, w: 16, h: MENU_H - 2 })
    const closeWin = (w: Win) => {
      const i = wins.indexOf(w)
      if (i < 0) return
      wins.splice(i, 1)
      apps[w.kind]?.closed?.()
      const ic = shownIcons().find((q) => q.id === w.kind)
      if (ic && !reduced) zooms.push({ from: { x: w.x, y: w.y, w: w.w, h: w.h }, to: deskView === 'icon' ? { x: ic.x, y: ic.y, w: 32, h: 32 } : iconRect(ic), at: wall, win: null })
      fbDirty = true
    }
    const closeFront = () => {
      const f = front()
      if (f) closeWin(f)
    }
    const cleanUp = () => {
      for (const ic of icons) [ic.x, ic.y] = ic.home
      fbDirty = true
    }
    const setView = (v: 'icon' | 'name') => {
      deskView = v
      fbDirty = true
    }

    // the trash, and the floppy
    const throwAway = (id: IconId) => {
      if (id === 'trash') return
      if (id === 'disk') {
        ejectDisk()
        return
      }
      trashed.add(id)
      for (const w of wins.slice()) if (w.kind === id || (id === 'projects' && w.kind === 'project')) closeWin(w)
      if (sel === id) sel = null
      sfx('tick')
      fbDirty = true
    }
    const putBack = (id: IconId) => {
      trashed.delete(id)
      trashSel = null
      const ic = icons.find((q) => q.id === id)
      if (ic) [ic.x, ic.y] = ic.home
      fbDirty = true
    }
    const emptyTrash = () => {
      for (const id of trashed) gone.add(id)
      trashed.clear()
      trashSel = null
      sfx('crunch')
      fbDirty = true
    }
    const ejectDisk = () => {
      if (!mounted) return
      mounted = false
      for (const w of wins.slice()) if (w.kind === 'disk') closeWin(w)
      if (sel === 'disk') sel = null
      diskSel = -1
      floppy.state = 'out'
      floppy.goal = 1
      sfx('eject')
      fbDirty = true
    }
    /** Push the sticking-out disk home; once the drive has read it, it is on the desktop. */
    const pushDisk = () => {
      floppy.state = 'in'
      floppy.goal = 0
      sfx('insert')
      window.setTimeout(() => {
        if (disposed || floppy.state !== 'in') return
        sfx('floppy')
        mounted = true
        sel = 'disk'
        fbDirty = true
      }, 650)
    }
    const openFile = (f: (typeof DISK_FILES)[number], from: Rect) => {
      if (!reduced) zooms.push({ from, to: { x: 0, y: MENU_H, w: SW, h: SH - MENU_H }, at: wall, win: null })
      window.setTimeout(() => !disposed && window.location.assign(f.path), reduced ? 0 : 300)
    }

    // ── power: boot, restart, shut down ─────────────────────────────────
    let audioUnlocked = false
    const boot = () => {
      power = 'on'
      bootAt = wall
      desktop = false
      booted = false
      wins.length = 0
      zooms.length = 0
      sel = null
      menuOpen = -1
      curShown = false
      saver = null
      // a fresh start: whatever was thrown away is back
      trashed.clear()
      gone.clear()
      for (const ic of icons) [ic.x, ic.y] = ic.home
      fbDirty = true
      if (audioUnlocked) sfx('floppy')
    }
    const shutDown = () => {
      menuOpen = -1
      offAt = wall
      power = 'off'
      for (const w of wins.slice()) apps[w.kind]?.closed?.()
      // the drive lets the disk go on the way down
      if (mounted) ejectDisk()
      fbDirty = true
    }
    const restart = () => {
      shutDown()
      window.setTimeout(() => !disposed && boot(), 700)
    }

    // ── menus ───────────────────────────────────────────────────────────
    const can = (op: EditOp) => !!frontApp()?.can?.(op)
    const edit = (op: EditOp) => {
      frontApp()?.edit?.(op)
      fbDirty = true
    }
    const menus: Menu[] = [
      {
        title: '*',
        x: 0,
        w: 0,
        items: [
          { label: 'about this desktop…', act: () => openIcon('about') },
          '-',
          { label: 'alarm clock', act: () => openDA('alarm') },
          { label: 'calculator', act: () => openDA('calc') },
          { label: 'control panel', act: () => openDA('control') },
          { label: 'guest book', act: () => openIcon('guests') },
          { label: 'note pad', act: () => openDA('notes') },
        ],
      },
      {
        title: NAME,
        x: 0,
        w: 0,
        items: [
          { label: `about ${NAME}`, act: () => openIcon('about') },
          { label: 'projects', act: () => openIcon('projects') },
          { label: 'contact', act: () => openIcon('contact') },
        ],
      },
      {
        title: 'file',
        x: 0,
        w: 0,
        items: [
          { label: 'open', act: () => sel && openIcon(sel), show: () => !!sel },
          { label: 'close window', act: () => closeFront(), show: () => wins.length > 0 },
          '-',
          { label: 'print', act: () => printFront(), show: () => wins.length > 0 },
          { label: 'put away', act: () => trashSel && putBack(trashSel), show: () => !!trashSel && front()?.kind === 'trash' },
          { label: 'eject disk', act: () => ejectDisk(), show: () => mounted },
        ],
      },
      {
        title: 'edit',
        x: 0,
        w: 0,
        items: [
          { label: 'undo', act: () => edit('undo'), show: () => can('undo') },
          '-',
          { label: 'cut', act: () => edit('cut'), show: () => can('cut') },
          { label: 'copy', act: () => edit('copy'), show: () => can('copy') },
          { label: 'paste', act: () => edit('paste'), show: () => can('paste') },
          { label: 'clear', act: () => edit('clear'), show: () => can('clear') },
          '-',
          { label: 'select all', act: () => edit('selectAll'), show: () => can('selectAll') },
        ],
      },
      {
        title: 'view',
        x: 0,
        w: 0,
        items: [
          { label: 'by icon', act: () => setView('icon'), check: () => deskView === 'icon' },
          { label: 'by name', act: () => setView('name'), check: () => deskView === 'name' },
          '-',
          { label: 'clean up', act: () => cleanUp(), show: () => deskView === 'icon' },
        ],
      },
      {
        title: 'special',
        x: 0,
        w: 0,
        items: [
          { label: 'empty trash', act: () => emptyTrash(), show: () => trashed.size > 0 },
          '-',
          { label: 'restart', act: () => restart() },
          { label: 'shut down', act: () => shutDown() },
        ],
      },
    ]
    /** What a menu drops down right now: anything that cannot apply is left out, and so are stray separators. */
    const itemsOf = (m: Menu): Item[] => {
      const list: Item[] = []
      for (const it of m.items) {
        if (it === '-') {
          if (list.length && list[list.length - 1] !== '-') list.push('-')
        } else if (!it.show || it.show()) list.push(it)
      }
      while (list.length && list[list.length - 1] === '-') list.pop()
      return list
    }
    /** Lay out the bar. A menu with nothing in it right now is not on the bar at all. */
    const layoutBar = () => {
      let x = 10
      for (const m of menus) {
        m.w = m.title === '*' ? STAR.w : tw(m.title, m.title === NAME)
        m.hidden = itemsOf(m).length === 0
        if (m.hidden) continue
        m.x = x
        x += m.w + 15
      }
    }
    const titleRect = (m: Menu): Rect => ({ x: m.x - 7, y: 0, w: m.w + 14, h: MENU_H })
    const barHit = (x: number, y: number) => (y < MENU_H ? menus.findIndex((q) => !q.hidden && inRect(titleRect(q), x, y)) : -1)
    const itemH = (it: Item) => (it === '-' ? 8 : 16)
    const dropRect = (m: Menu): Rect => {
      const list = itemsOf(m)
      const w = Math.max(...list.map((it) => (it === '-' ? 0 : tw(it.label)))) + 32
      const h = list.reduce((s, it) => s + itemH(it), 0) + 2
      return { x: m.x - 7, y: MENU_H - 1, w: Math.max(w, 110), h }
    }
    let menuOpen = -1
    let menuHot = -1
    let menuSticky = false
    let menuDownAt = 0
    let blink: { it: Item; i: number; at: number } | null = null
    const itemAt = (m: Menu, x: number, y: number) => {
      const r = dropRect(m)
      if (!inRect(r, x, y)) return -1
      const list = itemsOf(m)
      let yy = r.y + 1
      for (let i = 0; i < list.length; i++) {
        const h = itemH(list[i])
        if (y >= yy && y < yy + h) return list[i] === '-' ? -1 : i
        yy += h
      }
      return -1
    }
    const clockFmt = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Los_Angeles', hour: 'numeric', minute: '2-digit', hour12: true })
    const clockText = () => clockFmt.format(new Date()).toLowerCase().replace(/\s+/g, ' ')
    let clockShown = ''
    let clockCheck = 0
    const drawMenuBar = () => {
      R.rect(0, 0, SW, MENU_H - 1, 0)
      R.rect(0, MENU_H - 1, SW, 1, 1)
      menus.forEach((m, i) => {
        if (m.hidden) return
        const hot = menuOpen === i
        if (hot) R.rect(m.x - 7, 1, m.w + 14, MENU_H - 2, 1)
        // while the alarm rings, the star trades places with a bell
        if (m.title === '*') R.spr(alarm.ringing && Math.floor(wall / 500) % 2 ? BELL : STAR, m.x, 5, hot)
        else R.text(m.title, m.x, 5, hot ? 0 : 1, m.title === NAME)
      })
      clockShown = clockText()
      R.text(clockShown, SW - 12 - tw(clockShown), 5)
    }
    const drawMenu = () => {
      if (menuOpen < 0) return
      const m = menus[menuOpen]
      const r = dropRect(m)
      R.rect(r.x + 1, r.y + 1, r.w, r.h, 1)
      R.rect(r.x, r.y, r.w, r.h, 0)
      R.frame(r.x, r.y, r.w, r.h)
      let y = r.y + 1
      itemsOf(m).forEach((it, i) => {
        const h = itemH(it)
        if (it === '-') {
          for (let x = r.x + 1; x < r.x + r.w - 1; x += 2) R.px(x, y + 3, 1)
        } else {
          // the chosen item blinks before it acts
          const off = blink && blink.it === it && Math.floor((wall - blink.at) / 60) % 2 === 1
          const hot = (menuHot === i || (blink && blink.it === it)) && !off
          if (hot) R.rect(r.x + 1, y, r.w - 2, h, 1)
          if (it.check?.()) R.text('·', r.x + 6, y + 3, hot ? 0 : 1, true)
          R.text(it.label, r.x + 14, y + 3, hot ? 0 : 1)
        }
        y += h
      })
    }

    /** The screen's own rounded corners, in black. */
    const corners = () => {
      ;[5, 3, 2, 1, 1].forEach((n, j) => {
        R.rect(0, j, n, 1, 1)
        R.rect(SW - n, j, n, 1, 1)
        R.rect(0, SH - 1 - j, n, 1, 1)
        R.rect(SW - n, SH - 1 - j, n, 1, 1)
      })
    }

    const drawZooms = () => {
      for (const z of zooms) {
        const p = Math.min(1, (wall - z.at) / 260)
        for (const lag of [0, 0.16, 0.32]) {
          const q = Math.max(0, p - lag)
          if (q <= 0 || (lag > 0 && p >= 1)) continue
          const e = 1 - Math.pow(1 - q, 2)
          R.dotted(z.from.x + (z.to.x - z.from.x) * e, z.from.y + (z.to.y - z.from.y) * e, z.from.w + (z.to.w - z.from.w) * e, z.from.h + (z.to.h - z.from.h) * e)
        }
      }
    }

    // ── the screensaver: paper planes, after a minute with nobody at the machine
    const startSaver = () => {
      const planes: Plane[] = []
      for (let i = 0; i < 7; i++) planes.push({ x: Math.random() * (SW + 160), y: -30 + Math.random() * SH * 0.8, v: 20 + Math.random() * 14, ph: Math.random() * 6.3 })
      saver = { planes }
      menuOpen = -1
      fbDirty = true
    }
    const stepSaver = (dt: number) => {
      if (!saver) return
      for (const p of saver.planes) {
        p.x -= p.v * dt
        p.y += p.v * 0.3 * dt
        if (p.x < -30 || p.y > SH + 16) {
          p.x = SW + 10 + Math.random() * 140
          p.y = -30 + Math.random() * SH * 0.6
        }
      }
    }
    /** Anyone back at the machine: the planes land. */
    const wake = () => {
      lastAct = wall
      if (!saver) return false
      saver = null
      fbDirty = true
      return true
    }

    const bootStage = () => (power === 'off' ? -1 : reduced ? 3 : wall - bootAt < 900 ? 0 : wall - bootAt < 1700 ? 1 : 2)

    const drawBase = () => {
      R.unclip()
      links.length = 0
      const st = bootStage()
      if (st < 0) {
        R.rect(0, 0, SW, SH, 1)
        return
      }
      if (st === 0) {
        R.pat(0, 0, SW, SH, PAT_GREY)
        if (wall - bootAt > 260) {
          // the boot icon: a monogram on a rounded tile
          const x = SW / 2 - 22
          const y = SH / 2 - 26
          R.rect(x + 1, y + 1, 42, 46, 0)
          R.rect(x + 2, y, 40, 1, 1)
          R.rect(x + 2, y + 47, 40, 1, 1)
          R.rect(x, y + 2, 1, 44, 1)
          R.rect(x + 43, y + 2, 1, 44, 1)
          R.px(x + 1, y + 1, 1)
          R.px(x + 42, y + 1, 1)
          R.px(x + 1, y + 46, 1)
          R.px(x + 42, y + 46, 1)
          R.rect(x + 44, y + 3, 1, 45, 1)
          R.rect(x + 3, y + 48, 41, 1, 1)
          if (yhSpr) R.spr(yhSpr, x + 22 - Math.round(yhSpr.w / 2), y + 24 - Math.round(yhSpr.h / 2))
        }
        corners()
        return
      }
      if (st === 1) {
        R.pat(0, 0, SW, SH, PAT_GREY)
        const w = Math.max(230, (welcomeSpr?.w ?? 160) + 56)
        const h = 62
        const x = Math.round((SW - w) / 2)
        const y = Math.round((SH - h) / 2)
        R.rect(x, y, w, h, 0)
        R.frame(x, y, w, h)
        R.frame(x + 3, y + 3, w - 6, h - 6)
        R.frame(x + 4, y + 4, w - 8, h - 8)
        if (welcomeSpr) R.spr(welcomeSpr, x + Math.round((w - welcomeSpr.w) / 2), y + Math.round((h - welcomeSpr.h) / 2) - 1)
        corners()
        return
      }
      if (saver) {
        // white darts on black: the tube all but dark, and calm
        R.rect(0, 0, SW, SH, 1)
        for (const p of saver.planes) R.spr(PLANE, Math.round(p.x), Math.round(p.y + Math.sin(wall / 900 + p.ph) * 2))
        corners()
        return
      }
      layoutBar()
      R.pat(0, MENU_H, SW, SH - MENU_H, prefs.pattern)
      drawIcons()
      const f = front()
      for (const w of wins) drawWin(w, w === f)
      if (iconDrag && iconDrag.moved) R.dotted(iconDrag.x, iconDrag.y, iconDrag.w, iconDrag.h)
      drawZooms()
      drawMenuBar()
      drawMenu()
      corners()
    }

    /** Which cursor, and where its hot spot is. */
    const CURSORS: Record<Exclude<CursorName, 'hidden'>, [Spr, number, number]> = {
      arrow: [ARROW, 1, 1],
      ibeam: [IBEAM, 3, 6],
      cross: [CROSS, 5, 5],
      eraser: [ERASER_CUR, 6, 6],
    }
    const cursorSpr = (): [Spr, number, number] | null => {
      if (!curShown || bootStage() < 2 || saver) return null
      const w = drag?.k === 'app' ? drag.win : front()
      const app = w ? apps[w.kind] : undefined
      if (w && app?.cursor && menuOpen < 0 && (!drag || drag.k === 'app')) {
        const c = contentOf(w)
        if (drag?.k === 'app' || inRect(c, cur.x, cur.y)) {
          const name = app.cursor(cur.x - c.x, cur.y - c.y)
          if (name === 'hidden') return null
          if (name) return CURSORS[name]
        }
      }
      return CURSORS.arrow
    }

    const present = () => {
      presented = true
      if (fbDirty) {
        drawBase()
        fbDirty = false
      }
      curDirty = false
      out.set(R.fb)
      const cs = cursorSpr()
      if (cs) {
        const [s, hx, hy] = cs
        const x0 = Math.round(cur.x) - hx
        const y0 = Math.round(cur.y) - hy
        for (let j = 0; j < s.h; j++) {
          const y = y0 + j
          if (y < 0 || y >= SH) continue
          for (let i = 0; i < s.w; i++) {
            const x = x0 + i
            const v = s.d[j * s.w + i]
            if (v && x >= 0 && x < SW) out[y * SW + x] = v === 1 ? 1 : 0
          }
        }
      }
      for (let i = 0; i < SW * SH; i++) l32[i] = out[i] ? 0xff000000 : 0xffffffff
      lctx.putImageData(limg, 0, 0)
      sctx.drawImage(lc, 0, 0, SW * 2, SH * 2)
      screenTex.needsUpdate = true
    }

    /**
     * File ▸ print: the front window as a one-bit printout, three dots to the
     * pixel on warm paper, fed out from under the tube. Click it to keep it.
     */
    const printFront = () => {
      const w = front()
      if (!w) return
      const saved = menuOpen
      menuOpen = -1
      drawBase()
      menuOpen = saved
      const k = 3
      const pad = 16
      const x0 = Math.max(0, w.x)
      const y0 = Math.max(0, w.y)
      const x1 = Math.min(SW, w.x + w.w + 1)
      const y1 = Math.min(SH, w.y + w.h + 1)
      const cw = x1 - x0 + pad * 2
      const ch = y1 - y0 + pad * 2 + 16
      const cv = document.createElement('canvas')
      cv.width = cw * k
      cv.height = ch * k
      const g = cv.getContext('2d')!
      g.fillStyle = '#fbfaf5'
      g.fillRect(0, 0, cv.width, cv.height)
      g.fillStyle = '#1e1d1b'
      for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) if (R.fb[y * SW + x]) g.fillRect((x - x0 + pad) * k, (y - y0 + pad) * k, k, k)
      // a footer in the system font, the way the driver stamped one
      let tx = pad
      const ty = y1 - y0 + pad + 6
      for (const chr of `printed from ${NAME}'s desktop`) {
        const gl = glyph(chr)
        for (let r = 0; r < 10; r++) for (let i = 0; i < gl.w; i++) if (gl.rows[r] & (1 << (gl.w - 1 - i))) g.fillRect((tx + i) * k, (ty + r) * k, k, k)
        tx += gl.w + 1
      }
      // where the tube's bottom edge is on the page, to feed the paper out of
      scene.updateMatrixWorld(true)
      const v = new THREE.Vector3(0, -GLASS_H / 2, bulge(0, -GLASS_H / 2)).applyMatrix4(glass.matrixWorld).project(camera)
      const W = view.W
      const H = view.H
      setPrintout({ url: cv.toDataURL('image/png'), x: ((v.x + 1) / 2) * W, y: ((1 - v.y) / 2) * H, w: Math.min(300, W * 0.62), at: Date.now() })
      sfx('print')
    }

    // ── pointer on the desktop (logical pixels) ──────────────────────────
    const activate = (m: number, i: number) => {
      const it = itemsOf(menus[m])[i]
      if (!it || it === '-') return
      blink = { it, i, at: wall }
      menuHot = -1
      fbDirty = true
    }
    const iconHit = (x: number, y: number) => shownIcons().find((q) => inRect(iconRect(q), x, y))
    const winAt = (x: number, y: number) => wins.slice().reverse().find((w) => inRect(w, x, y))

    /** Pointer down at a logical pixel. `slop` is the double-click distance (bigger for fingers). */
    const wmDown = (x: number, y: number, slop = 4) => {
      cur.x = x
      cur.y = y
      fbDirty = true
      if (wake()) return // the click that wakes it does nothing else
      if (bootStage() < 2 || blink) return
      // a double click is a gesture in real time; the ghost's is in wall time (either will do)
      const rt = performance.now()
      const dbl = (wall - lastDown.t < 450 || rt - lastDown.rt < 450) && Math.abs(x - lastDown.x) <= slop && Math.abs(y - lastDown.y) <= slop
      lastDown = { t: dbl ? -1e9 : wall, rt: dbl ? -1e9 : rt, x, y }
      layoutBar()
      // a menu pinned open takes the click
      if (menuOpen >= 0 && menuSticky) {
        const i = itemAt(menus[menuOpen], x, y)
        if (i >= 0) return activate(menuOpen, i)
        const m = barHit(x, y)
        menuSticky = false
        if (m >= 0 && m !== menuOpen) {
          menuOpen = m
          menuDownAt = wall
          drag = { k: 'menu' }
        } else menuOpen = -1
        return
      }
      if (y < MENU_H) {
        const m = barHit(x, y)
        if (m >= 0) {
          menuOpen = m
          menuHot = -1
          menuDownAt = wall
          drag = { k: 'menu' }
        }
        return
      }
      const w = winAt(x, y)
      if (w) {
        const wasFront = w === front()
        raise(w)
        if (y < w.y + TB) {
          if (wasFront && x >= w.x + 6 && x < w.x + 21 && y >= w.y + 2 && y < w.y + 17) {
            closing = { win: w, inside: true }
            drag = { k: 'close', win: w }
          } else drag = { k: 'win', win: w, dx: x - w.x, dy: y - w.y }
          return
        }
        if (!wasFront) return // the first click only brings a window forward
        const c = contentOf(w)
        const app = apps[w.kind]
        if (app) {
          if (w.kind === 'alarm') alarm.hush()
          app.down?.(x - c.x, y - c.y, dbl)
          drag = { k: 'app', win: w }
          return
        }
        if (w.kind === 'projects') {
          const r = Math.floor((y - c.y - 18) / 17)
          projSel = r >= 0 && r < projects.length ? r : -1
          if (dbl && projSel >= 0) openWin('project', projects[projSel].slug, { x: c.x + 3, y: c.y + 18 + projSel * 17, w: c.w - 6, h: 16 })
        } else if (w.kind === 'project' || w.kind === 'contact') {
          const l = links.find((q) => q.win === w.id && inRect(q, x, y))
          if (l) {
            pressedLink = l
            linkInside = true
            drag = { k: 'link' }
          }
        } else if (w.kind === 'trash') {
          const items = [...trashed]
          const i = Math.floor((y - c.y - 4) / 16)
          trashSel = items[i] ?? null
          if (dbl && trashSel) putBack(trashSel)
        } else if (w.kind === 'disk') {
          const i = Math.floor((y - c.y - 4) / 16)
          diskSel = i >= 0 && i < DISK_FILES.length ? i : -1
          if (dbl && diskSel >= 0) openFile(DISK_FILES[diskSel], { x: c.x + 3, y: c.y + 4 + diskSel * 16, w: c.w - 6, h: 15 })
        }
        return
      }
      // the desktop
      const ic = iconHit(x, y)
      if (ic) {
        sel = ic.id
        if (dbl) openIcon(ic.id)
        else {
          const r = iconRect(ic)
          drag = { k: 'icon', id: ic.id, dx: x - (deskView === 'icon' ? ic.x : r.x), dy: y - r.y, x0: x, y0: y }
          iconDrag = deskView === 'icon' ? { x: ic.x, y: ic.y, w: 32, h: 32, moved: false } : { x: r.x, y: r.y, w: r.w, h: r.h, moved: false }
        }
      } else sel = null
    }

    const wmMove = (x: number, y: number) => {
      cur.x = Math.max(0, Math.min(SW - 1, x))
      cur.y = Math.max(0, Math.min(SH - 1, y))
      x = cur.x
      y = cur.y
      curDirty = true
      if (menuOpen >= 0 && !blink) {
        const m = barHit(x, y)
        if (m >= 0 && (drag?.k === 'menu' || menuSticky)) menuOpen = m
        menuHot = itemAt(menus[menuOpen], x, y)
        fbDirty = true
      }
      if (!drag) return
      if (drag.k === 'win') {
        drag.win.x = Math.round(Math.max(-drag.win.w + 48, Math.min(SW - 48, x - drag.dx)))
        drag.win.y = Math.round(Math.max(MENU_H, Math.min(SH - 22, y - drag.dy)))
        fbDirty = true
      } else if (drag.k === 'close' && closing) {
        const w = drag.win
        closing.inside = x >= w.x + 6 && x < w.x + 21 && y >= w.y + 2 && y < w.y + 17
        fbDirty = true
      } else if (drag.k === 'icon' && iconDrag) {
        if (Math.abs(x - drag.x0) + Math.abs(y - drag.y0) > 3) iconDrag.moved = true
        iconDrag.x = Math.round(x - drag.dx)
        iconDrag.y = Math.round(y - drag.dy)
        fbDirty = true
      } else if (drag.k === 'app') {
        const c = contentOf(drag.win)
        apps[drag.win.kind]?.move?.(x - c.x, y - c.y, true)
        fbDirty = true
      } else if (drag.k === 'link' && pressedLink) {
        const inside = inRect(pressedLink, x, y)
        if (inside !== linkInside) {
          linkInside = inside
          fbDirty = true
        }
      }
    }

    const wmUp = (x: number, y: number) => {
      if (menuOpen >= 0 && !blink) {
        if (menuHot >= 0) activate(menuOpen, menuHot)
        // a quick click on a title pins its menu open
        else if (drag?.k === 'menu' && inRect(titleRect(menus[menuOpen]), x, y) && wall - menuDownAt < 400) menuSticky = true
        else if (!menuSticky) menuOpen = -1
      }
      if (drag?.k === 'close' && closing) {
        if (closing.inside) closeWin(drag.win)
        closing = null
      } else if (drag?.k === 'icon' && iconDrag) {
        const id = drag.id
        const ic = icons.find((q) => q.id === id)
        // let go over the trash: thrown away (the floppy, ejected)
        const bin = shownIcons().find((q) => q.id === 'trash')
        if (iconDrag.moved && id !== 'trash' && bin && inRect(iconRect(bin), x, y)) throwAway(id)
        else if (ic && iconDrag.moved && deskView === 'icon') {
          ic.x = Math.max(4, Math.min(SW - 36, iconDrag.x))
          ic.y = Math.max(MENU_H + 4, Math.min(SH - 48, iconDrag.y))
        }
        iconDrag = null
      } else if (drag?.k === 'app') {
        const c = contentOf(drag.win)
        apps[drag.win.kind]?.up?.(x - c.x, y - c.y)
      } else if (drag?.k === 'link' && pressedLink) {
        if (linkInside) window.open(pressedLink.url, '_blank', 'noopener,noreferrer')
        pressedLink = null
        linkInside = false
      }
      drag = null
      fbDirty = true
    }

    // the keyboard on the desktop: the front app first; otherwise type to
    // select an icon, return opens it
    let typed = ''
    let typedAt = 0
    const macKey = (key: string) => {
      if (wake()) return
      if (bootStage() < 2) return
      fbDirty = true
      if (frontApp()?.key?.(key)) return
      if (key === 'Enter') {
        if (sel) openIcon(sel)
      } else if (key === 'Escape' && !wins.length) {
        // nothing left to close: let go of the keyboard and stand back
        setFocus(false)
        lean(0)
      } else if (key === 'Escape' || key === 'Backspace') closeFront()
      else if (key === 'Tab' || key === 'ArrowDown' || key === 'ArrowUp') {
        const list = deskView === 'icon' ? shownIcons() : listed()
        const i = list.findIndex((q) => q.id === sel)
        const n = list.length
        if (n) sel = list[(i + (key === 'ArrowUp' ? -1 : 1) + n) % n].id
      } else if (/^[a-z]$/i.test(key)) {
        typed = wall - typedAt < 900 ? typed + key.toLowerCase() : key.toLowerCase()
        typedAt = wall
        const hit = shownIcons().find((q) => q.label.startsWith(typed))
        if (hit) sel = hit.id
      }
    }
    const macKeyUp = (key: string) => {
      if (frontApp()?.keyUp?.(key)) fbDirty = true
    }

    // ── sound: synthesised, started on the first gesture. The keyboard is
    // silent: clicks under every keystroke wore thin fast
    let actx: AudioContext | null = null
    let master: GainNode | null = null
    let noise: AudioBuffer | null = null
    /** The control panel's speaker volume, 0 to 7; 0 is silent. */
    const setVolume = () => {
      if (master) master.gain.value = 0.62 * (prefs.volume / 7)
    }
    const unlockAudio = () => {
      try {
        if (!actx) {
          const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
          if (!AC) return
          actx = new AC()
          master = actx.createGain()
          setVolume()
          master.connect(actx.destination)
          noise = actx.createBuffer(1, Math.round(actx.sampleRate * 0.5), actx.sampleRate)
          const ch = noise.getChannelData(0)
          for (let i = 0; i < ch.length; i++) ch[i] = Math.random() * 2 - 1
          piano = createPiano(actx, master)
        }
        if (actx.state === 'suspended') void actx.resume()
        audioUnlocked = true
      } catch {
        /* no sound, then */
      }
    }
    const burst = (at: number, dur: number, freq: number, q: number, gain: number, type: BiquadFilterType = 'bandpass') => {
      if (!actx || !master || !noise) return
      const src = actx.createBufferSource()
      src.buffer = noise
      const f = actx.createBiquadFilter()
      f.type = type
      f.frequency.value = freq
      f.Q.value = q
      const g = actx.createGain()
      g.gain.setValueAtTime(0, at)
      g.gain.linearRampToValueAtTime(gain, at + 0.0015)
      g.gain.exponentialRampToValueAtTime(0.0001, at + dur)
      src.connect(f).connect(g).connect(master)
      src.start(at, Math.random() * 0.3)
      src.stop(at + dur + 0.02)
    }
    const tone = (at: number, dur: number, f0: number, f1: number, gain: number, type: OscillatorType = 'sine') => {
      if (!actx || !master) return
      const o = actx.createOscillator()
      o.type = type
      o.frequency.setValueAtTime(f0, at)
      o.frequency.exponentialRampToValueAtTime(f1, at + dur)
      const g = actx.createGain()
      g.gain.setValueAtTime(0, at)
      g.gain.linearRampToValueAtTime(gain, at + 0.002)
      g.gain.exponentialRampToValueAtTime(0.0001, at + dur)
      o.connect(g).connect(master)
      o.start(at)
      o.stop(at + dur + 0.02)
    }
    /** A struck bell: a fundamental and two inharmonic partials, ringing down. */
    const bell = (at: number, f: number, gain: number) => {
      tone(at, 1.4, f, f, gain)
      tone(at, 0.9, f * 2.76, f * 2.76, gain * 0.3)
      tone(at, 0.5, f * 5.4, f * 5.4, gain * 0.12)
    }
    const sfx = (kind: 'click' | 'clickUp' | 'floppy' | 'eject' | 'insert' | 'crunch' | 'print' | Sound) => {
      if (!actx || !master || actx.state !== 'running') return
      const t = actx.currentTime + 0.002
      if (kind === 'click') {
        burst(t, 0.018, 4300, 3, 0.3)
        tone(t, 0.014, 1700, 1100, 0.05, 'square')
      } else if (kind === 'clickUp') burst(t, 0.012, 5400, 3, 0.14)
      else if (kind === 'tick') burst(t, 0.016, 2600, 2.5, 0.18)
      else if (kind === 'beep') tone(t, 0.16, 990, 990, 0.12, 'triangle')
      else if (kind === 'chime') [0, 0.32, 0.64].forEach((d, i) => bell(t + d, i === 1 ? 990 : 1320, 0.16))
      else if (kind === 'solved') [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => bell(t + i * 0.11, f, 0.12))
      else if (kind === 'crunch') {
        // the trash, emptied: paper crushed in a fist
        for (let i = 0; i < 14; i++) burst(t + i * 0.024 + Math.random() * 0.012, 0.05 + Math.random() * 0.05, 700 + Math.random() * 2600, 0.8, 0.22)
        burst(t + 0.05, 0.22, 380, 0.7, 0.18, 'lowpass')
      } else if (kind === 'eject') {
        // the drive motor spins the disk out, then the latch lets go
        burst(t, 0.36, 260, 0.9, 0.26, 'lowpass')
        tone(t, 0.32, 95, 62, 0.14, 'triangle')
        burst(t + 0.3, 0.04, 1900, 1.6, 0.3)
        tone(t + 0.3, 0.06, 160, 80, 0.2)
      } else if (kind === 'insert') {
        // pushed home: a slide, then the shutter and the clamp
        burst(t, 0.12, 900, 0.8, 0.14)
        burst(t + 0.12, 0.05, 2400, 2, 0.22)
        burst(t + 0.16, 0.12, 220, 0.8, 0.4, 'lowpass')
        tone(t + 0.16, 0.08, 120, 60, 0.24)
      } else if (kind === 'print') {
        // the dot-matrix head, line after line
        for (let line = 0; line < 9; line++)
          for (let i = 0; i < 6; i++) burst(t + line * 0.21 + i * 0.026, 0.02, 1100 + (i % 2) * 300, 4, 0.12)
      } else {
        // the floppy: the disk seats with a chunk, then the head seeks across it while it spins up
        burst(t, 0.14, 220, 0.8, 0.45, 'lowpass')
        tone(t, 0.1, 120, 55, 0.3)
        burst(t + 0.012, 0.035, 1600, 1.4, 0.18)
        for (let i = 0; i < 10; i++) {
          const at = t + 0.3 + i * 0.042 + (i > 5 ? 0.14 : 0)
          burst(at, 0.028, 700 + (i % 3) * 90, 5, 0.16)
          tone(at, 0.026, 130, 110, 0.05, 'square')
        }
        const o = actx.createOscillator()
        o.type = 'sawtooth'
        o.frequency.value = 52
        const lp = actx.createBiquadFilter()
        lp.type = 'lowpass'
        lp.frequency.value = 320
        const g = actx.createGain()
        g.gain.setValueAtTime(0, t + 0.2)
        g.gain.linearRampToValueAtTime(0.05, t + 0.35)
        g.gain.linearRampToValueAtTime(0.0001, t + 1.2)
        o.connect(lp).connect(g).connect(master)
        o.start(t + 0.2)
        o.stop(t + 1.25)
      }
    }

    // ── the desk mouse and the keys, pressed ─────────────────────────────
    const ms = { x: 0, z: 0, vx: 0, vz: 0, yaw: 0, btn: 0, bv: 0, down: false }
    const press = (down: boolean) => {
      ms.down = down
      sfx(down ? 'click' : 'clickUp')
    }
    const pressKey = (k: Key | undefined, holdMs = 0) => {
      if (!k) return
      k.held = holdMs === 0
      k.until = wall + holdMs
    }

    // ── the idle demo: a ghost hand opens the guest book and offers you the pen
    let demo: { steps: Step[]; i: number; t: number; from: [number, number]; to: [number, number]; dur: number } | null = null
    let demoArmed = !reduced
    let lastAct = 0
    const iconAt = (id: IconId) => () => {
      const ic = icons.find((q) => q.id === id)!
      return [ic.x + 16, ic.y + 15] as [number, number]
    }
    const fieldAt = () => {
      const w = wins.find((q) => q.kind === 'guests')
      return w ? ([w.x + 1 + 160, w.y + TB + 1 + 175] as [number, number]) : null
    }
    const closeAt = (kind: WinKind) => () => {
      const w = wins.find((q) => q.kind === kind)
      return w ? ([w.x + 13, w.y + 9] as [number, number]) : null
    }
    const DBL: Step[] = [{ k: 'down' }, { k: 'wait', ms: 80 }, { k: 'up' }, { k: 'wait', ms: 110 }, { k: 'down' }, { k: 'wait', ms: 80 }, { k: 'up' }]
    const CLICK: Step[] = [{ k: 'down' }, { k: 'wait', ms: 90 }, { k: 'up' }]
    const SCRIPT: Step[] = [
      { k: 'move', to: iconAt('guests') },
      { k: 'wait', ms: 260 },
      ...DBL,
      { k: 'wait', ms: 1400 },
      { k: 'move', to: fieldAt, ms: 1100 },
      { k: 'wait', ms: 300 },
      ...CLICK,
    ]
    /** Someone is here: the ghost lets go, and never comes back. */
    const cancelDemo = () => {
      demoArmed = false
      lastAct = wall
      if (!demo) return
      demo = null
      if (ms.down) {
        ms.down = false
        wmUp(cur.x, cur.y)
      }
    }
    const stepDemo = (dtMs: number) => {
      let budget = dtMs
      while (demo && budget > 0) {
        const s = demo.steps[demo.i]
        if (!s) {
          demo = null
          break
        }
        if (s.k === 'move') {
          if (demo.t === 0) {
            const to = s.to()
            if (!to) {
              demo.i++
              continue
            }
            demo.from = [cur.x, cur.y]
            demo.to = to
            demo.dur = s.ms ?? Math.max(450, Math.min(1300, Math.hypot(to[0] - cur.x, to[1] - cur.y) * 4))
          }
          demo.t += budget
          const p = Math.min(1, demo.t / demo.dur)
          const e = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2
          const [fx, fy] = demo.from
          const [tx, ty] = demo.to
          // a hand does not move in straight lines: bow the path a little
          const bow = Math.sin(Math.PI * e) * 0.1
          wmMove(fx + (tx - fx) * e - (ty - fy) * bow, fy + (ty - fy) * e + (tx - fx) * bow)
          if (p < 1) return
          budget = demo.t - demo.dur
        } else if (s.k === 'wait') {
          demo.t += budget
          if (demo.t < s.ms) return
          budget = demo.t - s.ms
        } else if (s.k === 'down') {
          press(true)
          wmDown(cur.x, cur.y)
        } else {
          press(false)
          wmUp(cur.x, cur.y)
        }
        demo.i++
        demo.t = 0
      }
    }

    // ── pointer: picking, the screen, the swivel ─────────────────────────
    const ray = new THREE.Raycaster()
    const ndc = new THREE.Vector2()
    const hitTargets: THREE.Object3D[] = [hood, rear, glass, foot, badge, slotHit, ...diskParts, slab, well, ...keyMeshes, msBody, msBtn]
    const caseParts = new Set<THREE.Object3D>([hood, rear, foot, badge, slotHit])
    const rayFrom = (clientX: number, clientY: number) => {
      const r = canvas.getBoundingClientRect()
      ndc.set(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1)
      ray.setFromCamera(ndc, camera)
    }
    const pick = (clientX: number, clientY: number) => {
      rayFrom(clientX, clientY)
      const hit = ray.intersectObjects(hitTargets, false)[0]
      if (!hit) return null
      if (hit.object instanceof THREE.InstancedMesh && hit.instanceId !== undefined) {
        const k = keys.find((q) => q.mesh === hit.object && q.idx === hit.instanceId)
        if (k) return { kind: 'key' as const, key: k }
      }
      if (hit.object === glass) return { kind: 'screen' as const }
      if (diskParts.has(hit.object)) return { kind: 'floppy' as const }
      if (hit.object === slotHit) return { kind: 'slot' as const }
      if (hit.object === msBody || hit.object === msBtn) return { kind: 'mouse' as const }
      if (caseParts.has(hit.object)) return { kind: 'case' as const }
      return { kind: 'body' as const }
    }
    // the ray against the bulged glass, in the glass's own space (it works off the edges too, for drags)
    const gInv = new THREE.Matrix4()
    const lray = new THREE.Ray()
    const gp = new THREE.Vector3()
    const toScreen = (): [number, number] | null => {
      gInv.copy(glass.matrixWorld).invert()
      lray.copy(ray.ray).applyMatrix4(gInv)
      if (Math.abs(lray.direction.z) < 1e-6) return null
      let z = bulge(0, 0) * 0.7
      for (let i = 0; i < 3; i++) {
        const t = (z - lray.origin.z) / lray.direction.z
        gp.copy(lray.direction).multiplyScalar(t).add(lray.origin)
        z = bulge(Math.max(-GLASS_W / 2, Math.min(GLASS_W / 2, gp.x)), Math.max(-GLASS_H / 2, Math.min(GLASS_H / 2, gp.y)))
      }
      // the shader's own barrel mapping, run forward from the glass uv
      let cx = (gp.x / IMG_W) * 2
      let cy = (gp.y / IMG_H) * 2
      const k = 1 + BARREL * (cx * cx + cy * cy)
      cx *= k
      cy *= k
      return [(cx * 0.5 + 0.5) * SW, (1 - (cy * 0.5 + 0.5)) * SH]
    }

    // ?macdebug: a logical screen pixel to page coordinates, for the headless
    // capture tools (docs/hero-tools/capmac.py) to click things on the desktop
    if (process.env.NODE_ENV !== 'production' && new URLSearchParams(window.location.search).has('macdebug')) {
      ;(window as unknown as { __macDebug?: unknown }).__macDebug = {
        px: (x: number, y: number) => {
          // undo the barrel by fixed point, then glass space to the page
          const tx = (x / SW) * 2 - 1
          const ty = 1 - (y / SH) * 2
          let cx = tx
          let cy = ty
          for (let i = 0; i < 8; i++) {
            const k = 1 + BARREL * (cx * cx + cy * cy)
            cx = tx / k
            cy = ty / k
          }
          const gx = (cx * IMG_W) / 2
          const gy = (cy * IMG_H) / 2
          scene.updateMatrixWorld(true)
          const v = new THREE.Vector3(gx, gy, bulge(gx, gy)).applyMatrix4(glass.matrixWorld).project(camera)
          const r = canvas.getBoundingClientRect()
          return [r.left + ((v.x + 1) / 2) * r.width, r.top + ((1 - v.y) / 2) * r.height]
        },
        state: () => ({ rendered, wins: wins.map((w) => w.kind), sel, mounted, floppy: floppy.state, saver: !!saver, trashed: [...trashed], view: deskView, bar: menus.filter((m) => !m.hidden).map((m) => [m.title, m.x]) }),
        saver: () => startSaver(),
        /** A point on the case (body space, z = 0 the face) on the page. */
        at: (x: number, y: number, z: number) => {
          scene.updateMatrixWorld(true)
          const v = body.localToWorld(new THREE.Vector3(x, y, z)).project(camera)
          const r = canvas.getBoundingClientRect()
          return [r.left + ((v.x + 1) / 2) * r.width, r.top + ((1 - v.y) / 2) * r.height]
        },
      }
    }

    // a phone has no keys to route: when a text field on the desktop takes a
    // tap, a hidden input is focused so the phone's keyboard comes up, and what
    // is typed into it is handed to the field (16px, or iOS zooms the page)
    const proxy = document.createElement('input')
    proxy.type = 'text'
    proxy.autocomplete = 'off'
    proxy.tabIndex = -1
    proxy.setAttribute('autocapitalize', 'none')
    proxy.setAttribute('autocorrect', 'off')
    proxy.setAttribute('enterkeyhint', 'send')
    proxy.style.cssText = 'position:absolute;left:0;bottom:0;width:1px;height:1px;opacity:0;border:0;padding:0;font-size:16px;pointer-events:none'
    host.appendChild(proxy)
    const onProxyInput = () => {
      const app = frontApp()
      if (!app?.setText) return
      app.setText(proxy.value)
      proxy.value = app.textField?.()?.value ?? ''
      fbDirty = true
    }
    const onProxyKey = (e: KeyboardEvent) => {
      if (e.key !== 'Enter' && e.key !== 'Tab') return
      e.preventDefault()
      frontApp()?.key?.(e.key)
      proxy.value = frontApp()?.textField?.()?.value ?? ''
      fbDirty = true
    }
    proxy.addEventListener('input', onProxyInput)
    proxy.addEventListener('keydown', onProxyKey)
    /** After a tap on the screen: a text field in front gets the phone's keyboard. */
    const offerKeyboard = () => {
      const f = frontApp()?.textField?.()
      if (f) {
        proxy.value = f.value
        proxy.maxLength = f.max
        proxy.focus({ preventScroll: true })
      } else if (document.activeElement === proxy) proxy.blur()
    }

    let focused = false
    const setFocus = (on: boolean) => {
      if (focused === on) return
      focused = on
      if (on) document.documentElement.setAttribute('data-hero-keys', '')
      else document.documentElement.removeAttribute('data-hero-keys')
    }

    const par = { x: 0, y: 0, tx: 0, ty: 0 }
    const swivel = { yaw: 0, v: 0, target: 0, dragging: false, x0: 0, yaw0: 0, pid: -1 }
    let screenPid = -1
    let mousePid = -1
    let overScreen = false
    let lastClient: { x: number; y: number } | null = null
    let offSince = 0 // when the mouse left the machine altogether
    const screenLive = () => power === 'on' && bootStage() >= 2
    const onWindowMove = (e: PointerEvent) => {
      par.tx = (e.clientX / window.innerWidth) * 2 - 1
      par.ty = (e.clientY / window.innerHeight) * 2 - 1
    }
    const onMove = (e: PointerEvent) => {
      if (swivel.dragging && e.pointerId === swivel.pid) {
        swivel.target = Math.max(-0.5, Math.min(0.5, swivel.yaw0 + ((e.clientX - swivel.x0) / Math.max(400, canvas.clientWidth)) * 1.8))
        return
      }
      if (e.pointerId === screenPid) {
        rayFrom(e.clientX, e.clientY)
        const p = toScreen()
        if (p) wmMove(p[0], p[1])
        return
      }
      const h = pick(e.clientX, e.clientY)
      overScreen = h?.kind === 'screen'
      lastClient = { x: e.clientX, y: e.clientY }
      // wander off the machine for a moment and the camera stands back
      if (e.pointerType === 'mouse') offSince = h ? 0 : offSince || wall
      if (overScreen && screenLive()) {
        cancelDemo()
        wake()
        const p = toScreen()
        if (p) {
          curShown = true
          wmMove(p[0], p[1])
        }
      }
      if (e.pointerType === 'mouse') canvas.style.cursor = !h ? 'default' : h.kind === 'screen' ? 'none' : h.kind === 'case' || (h.kind === 'slot' && floppy.state === 'in') ? 'grab' : 'pointer'
    }
    const onDown = (e: PointerEvent) => {
      unlockAudio()
      const h = pick(e.clientX, e.clientY)
      if (!h) {
        setFocus(false)
        lean(0)
        return
      }
      setFocus(true)
      cancelDemo()
      // the click on the screen that wakes it is the desktop's to swallow (wmDown)
      if (h.kind !== 'screen') wake()
      if (e.pointerType === 'mouse') e.preventDefault()
      if (h.kind === 'screen') {
        if (power === 'off') {
          boot()
          return
        }
        let p = toScreen()
        if (!p) return
        // the camera may still be leaning in from the first click: a quick second one is the same spot
        if (Math.abs(view.lv) > 0.05 && (wall - lastDown.t < 450 || performance.now() - lastDown.rt < 450)) p = [lastDown.x, lastDown.y]
        lean(1)
        screenPid = e.pointerId
        canvas.setPointerCapture(e.pointerId)
        curShown = true
        press(true)
        wmDown(p[0], p[1], e.pointerType === 'mouse' ? 4 : 10)
      } else if (h.kind === 'mouse') {
        // pressing the desk mouse's button clicks wherever the cursor is
        mousePid = e.pointerId
        press(true)
        if (screenLive()) wmDown(cur.x, cur.y)
      } else if (h.kind === 'key' && h.key) {
        pressKey(h.key, 140)
        const d = h.key.def
        macKey(d.code === 'Enter' || d.code === 'NumpadEnter' ? 'Enter' : d.code === 'Backspace' ? 'Backspace' : d.code === 'Tab' ? 'Tab' : (d.ch ?? ''))
      } else if (h.kind === 'floppy' || (h.kind === 'slot' && floppy.state === 'out')) {
        // the disk sticking out of the slot goes home
        pushDisk()
      } else if (h.kind === 'case' || h.kind === 'slot') {
        swivel.dragging = true
        swivel.pid = e.pointerId
        swivel.x0 = e.clientX
        swivel.yaw0 = swivel.yaw
        canvas.setPointerCapture(e.pointerId)
        canvas.style.cursor = 'grabbing'
      }
    }
    const onUp = (e: PointerEvent) => {
      if (e.pointerId === swivel.pid && swivel.dragging) {
        swivel.dragging = false
        swivel.target = 0
        swivel.pid = -1
        if (e.pointerType === 'mouse') canvas.style.cursor = 'grab'
      }
      if (e.pointerId === screenPid) {
        screenPid = -1
        press(false)
        rayFrom(e.clientX, e.clientY)
        const p = toScreen()
        wmUp(p ? p[0] : cur.x, p ? p[1] : cur.y)
        if (e.pointerType !== 'mouse') offerKeyboard()
      }
      if (e.pointerId === mousePid) {
        mousePid = -1
        press(false)
        if (screenLive()) wmUp(cur.x, cur.y)
      }
    }
    const onLeave = (e: PointerEvent) => {
      overScreen = false
      // (a finger always "leaves" after it lifts; only a mouse wandering off means stand back)
      if (e.pointerType !== 'mouse') return
      offSince = offSince || wall
    }
    /** Touch: only a drag that starts on something draggable on the screen keeps the page from scrolling. */
    const onTouchStart = (e: TouchEvent) => {
      const t = e.touches[0]
      if (!t || e.touches.length > 1) return
      const h = pick(t.clientX, t.clientY)
      if (h?.kind !== 'screen' || !screenLive()) return
      const p = toScreen()
      if (!p) return
      const [x, y] = p
      const f = winAt(x, y)
      const grab = y < MENU_H || (f && (y < f.y + TB || !!apps[f.kind])) || (!f && !!iconHit(x, y))
      if (grab) e.preventDefault()
    }
    const onWindowDown = (e: PointerEvent) => {
      if (e.target !== canvas) setFocus(false)
    }

    const keyFor = (e: KeyboardEvent) => byCode.get(e.code) ?? (e.key.length === 1 ? byChar.get(e.key.toLowerCase()) : undefined)
    let inView = true
    const onKeyDown = (e: KeyboardEvent) => {
      if (!inView || e.metaKey || e.ctrlKey) return
      const t = e.target as HTMLElement | null
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return
      unlockAudio()
      // the caps go down whenever you type, focused or not
      const k = keyFor(e)
      if (k && !e.repeat) pressKey(k)
      if (!focused) return
      if (e.key.length === 1 || ['Enter', 'Escape', 'Backspace', 'Delete', 'Tab', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        // capture phase, so the page's own shortcuts already see data-hero-keys
        e.preventDefault()
        cancelDemo()
        macKey(e.key)
      }
    }
    const onKeyUp = (e: KeyboardEvent) => {
      const k = keyFor(e)
      if (k && k.held) k.held = false
      if (focused) macKeyUp(e.key)
    }

    window.addEventListener('pointermove', onWindowMove)
    window.addEventListener('pointerdown', onWindowDown)
    window.addEventListener('keydown', onKeyDown, true)
    window.addEventListener('keyup', onKeyUp, true)
    canvas.addEventListener('pointermove', onMove)
    canvas.addEventListener('pointerdown', onDown)
    canvas.addEventListener('pointerup', onUp)
    canvas.addEventListener('pointercancel', onUp)
    canvas.addEventListener('pointerleave', onLeave)
    canvas.addEventListener('touchstart', onTouchStart, { passive: false })

    // ── camera framing: fit into the box the name never uses ────────────
    const box = (x0: number, x1: number, y0: number, y1: number, z0: number, z1: number) => {
      const pts: THREE.Vector3[] = []
      for (const x of [x0, x1]) for (const y of [y0, y1]) for (const z of [z0, z1]) pts.push(new THREE.Vector3(x, y, z))
      return pts
    }
    const CASE_PTS = box(-0.5, 0.5, 0, CASE_H, -CASE_D, 0.02)
    const KB_PTS = box(KB_X - KB_W / 2, KB_X + KB_W / 2, 0, 0.09, KB_Z - KB_D / 2, KB_Z + KB_D / 2)
    const MS_PTS = box(MS_X - 0.2, MS_X + 0.2, 0, MS_H, MS_Z - 0.2, MS_Z + 0.22) // with its travel
    // two poses: the product shot, and leaning in, with the tube filling the same box
    type Pose = { az: number; el: number; dist: number; t: THREE.Vector3; ox: number; oy: number; lines: number }
    const shot: Pose = { az: 0.42, el: 0.17, dist: 5, t: new THREE.Vector3(0.1, 0.55, -0.15), ox: 0, oy: 0, lines: 120 }
    const near: Pose = { az: 0.14, el: 0.07, dist: 3, t: new THREE.Vector3(0, OPEN_CY, -0.06), ox: 0, oy: 0, lines: 300 }
    const view = { W: 1, H: 1, lean: 0, lv: 0, goal: 0 }
    /** Lean in (1) or stand back (0); the page's overlays follow through React state. */
    const lean = (g: 0 | 1) => {
      if (view.goal === g) return
      view.goal = g
      setLeaned(g === 1)
    }
    standBackRef.current = () => {
      setFocus(false)
      lean(0)
    }
    const tgt = new THREE.Vector3()
    const place = (az: number, el: number, dist: number, t: THREE.Vector3) => {
      camera.position.set(t.x + dist * Math.sin(az) * Math.cos(el), t.y + dist * Math.sin(el), t.z + dist * Math.cos(az) * Math.cos(el))
      camera.lookAt(t)
      camera.updateMatrixWorld()
    }
    const extents = (pts: THREE.Vector3[]) => {
      let x0 = 1e9
      let x1 = -1e9
      let y0 = 1e9
      let y1 = -1e9
      for (const p of pts) {
        v3.copy(p).project(camera)
        x0 = Math.min(x0, v3.x)
        x1 = Math.max(x1, v3.x)
        y0 = Math.min(y0, v3.y)
        y1 = Math.max(y1, v3.y)
      }
      return { x0, x1, y0, y1 }
    }
    /** Find the distance that fits the points into the box, and the lens shift that centres them on it. */
    const solve = (pose: Pose, pts: THREE.Vector3[], ob: Rect, fill: number) => {
      const W = view.W
      const H = view.H
      const fw = (ob.w * fill) / W
      const fh = (ob.h * fill) / H
      let lo = 0.3
      let hi = 40
      for (let i = 0; i < 30; i++) {
        const d = (lo + hi) / 2
        place(pose.az, pose.el, d, pose.t)
        const e = extents(pts)
        if ((e.x1 - e.x0) / 2 > fw || (e.y1 - e.y0) / 2 > fh) lo = d
        else hi = d
      }
      pose.dist = hi
      place(pose.az, pose.el, hi, pose.t)
      const e = extents(pts)
      pose.ox = (((e.x0 + e.x1) / 2 + 1) / 2) * W - (ob.x + ob.w / 2)
      pose.oy = ((1 - (e.y0 + e.y1) / 2) / 2) * H - (ob.y + ob.h / 2)
      // scanlines sized to the tube's height on screen, one per logical row at most
      v3.set(0, OPEN_CY - IMG_H / 2, 0).project(camera)
      const y0 = v3.y
      v3.set(0, OPEN_CY + IMG_H / 2, 0).project(camera)
      pose.lines = Math.max(90, Math.min(SH, ((Math.abs(v3.y - y0) / 2) * H * dpr) / 3))
    }
    const ease = (x: number) => x * x * (3 - 2 * x)
    /** Put the camera between the two poses, plus a little pointer parallax and drift when standing back. */
    const applyCam = (px = 0, py = 0) => {
      const e = ease(Math.max(0, Math.min(1, view.lean)))
      const az = shot.az + (near.az - shot.az) * e + px * (1 - e)
      const el = shot.el + (near.el - shot.el) * e + py * (1 - e)
      // dolly in log space, so the move feels even all the way in
      const dist = Math.exp(Math.log(shot.dist) + (Math.log(near.dist) - Math.log(shot.dist)) * e)
      tgt.copy(shot.t).lerp(near.t, e)
      place(az, el, dist, tgt)
      camera.setViewOffset(view.W, view.H, shot.ox + (near.ox - shot.ox) * e, shot.oy + (near.oy - shot.oy) * e, view.W, view.H)
      camera.updateProjectionMatrix()
      crt.uLines.value = shot.lines + (near.lines - shot.lines) * e
      // close up, any reflection sits right on the desktop and washes it out: fade the
      // glass's env, clearcoat and specular all the way to nothing as it leans in
      // even standing back, only a faint sheen: a hard softbox band across the
      // top of the tube read as glare
      const keep = (1 - e) * (1 - e)
      // the lamps themselves never show in it: their highlight on a bulged tube was a hotspot
      glassMat.envMapIntensity = 0.1 * keep
      glassMat.clearcoat = 0
      glassMat.specularIntensity = 0.12 * keep
    }
    const fit = () => {
      const W = Math.max(1, host.clientWidth)
      const H = Math.max(1, host.clientHeight)
      view.W = W
      view.H = H
      renderer.setSize(W, H, false)
      post.setSize(W, H, dpr)
      renderAgain = true
      const L = heroLayout(W, H)
      camera.aspect = W / H
      camera.fov = L.portrait ? 26 : 21
      camera.clearViewOffset()
      camera.updateProjectionMatrix()
      // a three-quarter view from the right, so the machine turns toward the name
      shot.az = L.portrait ? 0.3 : 0.42
      shot.el = L.portrait ? 0.2 : 0.17
      solve(shot, [...CASE_PTS, ...KB_PTS, ...MS_PTS], L.object, 0.9)
      // leaning in: the opening and a little bezel, nearly square on (the tube tilts back, so does the eye)
      const m = 0.045
      // leaning in fills the whole viewport, like the CRT's zoom: the name steps aside meanwhile
      solve(near, box(-OPEN_W / 2 - m, OPEN_W / 2 + m, OPEN_CY - OPEN_H / 2 - m, OPEN_CY + OPEN_H / 2 + m, -0.04, 0), { x: 0, y: 0, w: W, h: H }, L.portrait ? 0.98 : 0.92)
      applyCam()
    }
    const ro = new ResizeObserver(fit)
    ro.observe(host)
    fit()

    const io = new IntersectionObserver(([en]) => {
      inView = en.isIntersecting
    })
    io.observe(host)

    // ── theme ───────────────────────────────────────────────────────────
    const drawBadge = () => {
      const c = badgeCanvas.getContext('2d')!
      const W = badgeCanvas.width
      const H = badgeCanvas.height
      c.clearRect(0, 0, W, H)
      c.fillStyle = '#e4e6ea'
      c.strokeStyle = '#e4e6ea'
      c.lineWidth = 3
      c.beginPath()
      c.roundRect(10, 10, W - 20, H - 20, 12)
      c.stroke()
      c.textAlign = 'center'
      c.textBaseline = 'middle'
      c.font = `400 ${H * 0.62}px ${display}`
      c.fillText('YH', W / 2, H * 0.55)
      badgeTex.needsUpdate = true
    }
    let spill = 0
    const applyTheme = () => {
      const th = themeRef.current
      const [r, g, b] = hexToRgb(th.bg)
      const dark = r + g + b < 384
      const L = dark ? LOOK.dark : LOOK.light
      plastic.color.set(L.plastic)
      hoodMat.color.set(L.plastic)
      kbPlastic.color.set(L.kbPlastic)
      // the cut-outs are shaded from the colour of what they are cut into
      for (const m of cutMats) m.color.set(L.plastic)
      baseMat.color.set(L.base)
      wellMat.color.set(L.well)
      slotMat.color.set(L.slot)
      badgeMat.color.set(L.badge)
      glassMat.color.set(L.glass)
      cordMat.color.set(L.base)
      keyUniforms.uInk.value.set(L.ink)
      const c = new THREE.Color()
      for (const k of keys) {
        c.set(k.def.accent ? th.accent : k.def.mod ? L.keyMod : L.keyAlpha)
        k.mesh.setColorAt(k.idx, c)
        if (k.mesh.instanceColor) k.mesh.instanceColor.needsUpdate = true
      }
      groundMat.opacity = L.ground
      for (const ct of contacts) (ct.mesh.material as THREE.MeshBasicMaterial).opacity = L.contact * ct.k
      scene.environmentIntensity = L.env
      keyLight.intensity = L.key
      rim.intensity = L.rim
      spot.intensity = L.soft
      crt.uGain.value = L.gain
      post.bloom.strength = L.bloom
      renderer.toneMappingExposure = L.exposure
      post.mix.uFloor.value = L.aoFloor
      renderer.shadowMap.needsUpdate = true
      renderAgain = true
      spill = L.spill
      drawBadge()
    }
    applyThemeRef.current = applyTheme
    applyTheme()

    const drawAtlas = (face: string) => {
      const c = atlasCanvas.getContext('2d')!
      c.clearRect(0, 0, 1024, 1024)
      c.fillStyle = '#fff'
      c.textAlign = 'center'
      c.textBaseline = 'middle'
      labels.forEach((l, i) => {
        const x = (i % 8) * 128 + 64
        const y = Math.floor(i / 8) * 128 + 64
        c.font = l.length === 1 ? `500 58px ${face}` : `500 ${l.length > 5 ? 26 : 30}px ${face}`
        c.fillText(l, x, y + (l.length === 1 ? 2 : 0))
      })
      atlasTex.needsUpdate = true
    }

    // ── loop ────────────────────────────────────────────────────────────
    const STEP = 1 / 120
    let acc = 0
    let last = performance.now()
    let raf = 0
    let cordKey = ''
    let lastShadowSig = ''
    let stillK = 1 // how much pointer parallax and drift the camera takes (none while you work the screen)
    const sim = (h: number) => {
      const kk = 1 - Math.exp(-h * 3.2)
      par.x += ((reduced ? 0 : par.tx) - par.x) * kk
      par.y += ((reduced ? 0 : par.ty) - par.y) * kk
      for (const k of keys) {
        const want = k.held || wall < k.until ? 1 : 0
        k.v += (1400 * (want - k.d) - 52 * k.v) * h
        k.d += k.v * h
      }
      // the desk mouse follows the cursor on a soft spring, yawing a touch as it goes
      const tx = (cur.x / SW - 0.5) * 0.26
      const tz = (cur.y / SH - 0.5) * 0.18
      ms.vx += (260 * (tx - ms.x) - 30 * ms.vx) * h
      ms.vz += (260 * (tz - ms.z) - 30 * ms.vz) * h
      ms.x += ms.vx * h
      ms.z += ms.vz * h
      ms.yaw += (-ms.vx * 0.25 - ms.yaw) * (1 - Math.exp(-h * 8))
      ms.bv += (1600 * ((ms.down ? 1 : 0) - ms.btn) - 60 * ms.bv) * h
      ms.btn += ms.bv * h
      // leaning in and out: a critically damped spring, so the camera arrives without a bump
      if (reduced) view.lean = view.goal
      else {
        view.lv += (26 * (view.goal - view.lean) - 10.2 * view.lv) * h
        view.lean += view.lv * h
      }
      // the case swivels on its foot and springs back, a little underdamped
      const k = swivel.dragging ? 160 : 70
      swivel.v += (k * (swivel.target - swivel.yaw) - (swivel.dragging ? 24 : 7) * swivel.v) * h
      swivel.yaw += swivel.v * h
    }

    const frame = (now: number) => {
      if (disposed) return
      raf = requestAnimationFrame(frame)
      const raw = Math.max(0, now - last)
      const dt = Math.min(0.5, raw / 1000)
      last = now
      if (!inView) return
      // wall time (not the clamped sim clock): a slow first frame must not hold the boot back
      const wdt = Math.min(4000, raw)
      wall += wdt
      acc += dt
      while (acc >= STEP) {
        sim(STEP)
        acc -= STEP
      }
      for (const k of keys) {
        if (Math.abs(k.d) > 1e-4 || Math.abs(k.v) > 1e-3) placeKey(k)
        else if (k.d !== 0) {
          k.d = 0
          k.v = 0
          placeKey(k)
        }
      }

      if (power === 'on') {
        const st = bootStage()
        if (st >= 2 && !desktop) {
          desktop = true
          fbDirty = true
        }
        if (desktop && !booted && (reduced || wall - bootAt > 1760)) {
          booted = true
          lastAct = wall
          curShown = true
          // the desktop is up: the homepage nav comes back, as it does when the reel settles
          if (!settled) {
            settled = true
            window.dispatchEvent(new CustomEvent(REEL_SETTLED))
          }
          openWin('about', undefined, reduced ? undefined : { x: ICONS[0].x, y: ICONS[0].y, w: 32, h: 32 })
        }
        if (st < 2 && Math.floor((wall - bootAt) / 130) !== Math.floor((wall - bootAt - wdt) / 130)) fbDirty = true
      }
      for (let i = zooms.length - 1; i >= 0; i--) {
        const z = zooms[i]
        fbDirty = true
        if (wall - z.at >= 260) {
          zooms.splice(i, 1)
          if (z.win) raise(z.win, z.win.z)
        }
      }
      if (blink) {
        fbDirty = true
        if (wall - blink.at > prefs.blinks * 120) {
          const it = blink.it
          blink = null
          menuOpen = -1
          menuSticky = false
          if (it !== '-') it.act()
        }
      }
      if (drag?.k === 'app' && drag.win.kind === 'paint') paint.tick()
      for (const w of wins) if (apps[w.kind]?.busy?.()) fbDirty = true
      if (desktop && wall - clockCheck > 1000) {
        clockCheck = wall
        alarm.tick(new Date())
        if (clockText() !== clockShown || wins.some((w) => w.kind === 'alarm')) fbDirty = true
      }
      if (alarm.ringing && Math.floor(wall / 500) !== Math.floor((wall - wdt) / 500)) fbDirty = true
      // a minute with nobody at the machine, and the paper planes come out
      if (saver) {
        stepSaver(dt)
        // the darts drift a pixel at a time: two dozen frames a second is plenty
        if (Math.floor(wall / 42) !== Math.floor((wall - wdt) / 42)) fbDirty = true
      } else if (booted && power === 'on' && !demo && !drag && wall - lastAct > 60000) startSaver()
      if (offSince && wall - offSince > 900) lean(0)
      if (demo) stepDemo(wdt)
      else if (demoArmed && booted && power === 'on' && wall - lastAct > 6000 && !drag && !saver) {
        demoArmed = false
        demo = { steps: SCRIPT, i: 0, t: 0, from: [cur.x, cur.y], to: [cur.x, cur.y], dur: 1 }
      }
      if (fbDirty || curDirty) present()

      if (power === 'on') crt.uPower.value = reduced ? 1 : Math.min(1, (wall - bootAt) / 420)
      else crt.uPower.value = offAt < 0 ? 0 : Math.max(0, 1 - (wall - offAt) / 260)
      spillU.uSpill.value = spill * crt.uPower.value

      mouse.position.set(MS_X + ms.x, 0, MS_Z + ms.z)
      mouse.rotation.y = MS_YAW + ms.yaw
      msBtn.position.y = BTN_Y - ms.btn * 0.0035
      mac.rotation.y = swivel.yaw
      const ck = `${mouse.position.x.toFixed(4)},${mouse.position.z.toFixed(4)},${mouse.rotation.y.toFixed(3)},${swivel.yaw.toFixed(4)}`
      if (ck !== cordKey) {
        cordKey = ck
        updateCords()
      }
      floppy.t += (floppy.goal - floppy.t) * (1 - Math.exp(-dt * 9))
      disk.position.z = DISK_IN + (DISK_OUT - DISK_IN) * floppy.t
      disk.visible = floppy.state === 'out' || (floppy.state === 'in' && floppy.t > 0.004)


      // hold the camera still while the pointer works the screen, so the cursor stays under it
      stillK += ((overScreen || screenPid >= 0 ? 0 : 1) - stillK) * (1 - Math.exp(-dt * 6))
      const still = stillK
      // no idle drift: it kept the whole frame redrawing for a motion nobody saw
      applyCam(par.x * 0.05 * still, par.y * 0.025 * still)
      // while the camera leans in or out under a resting pointer, keep the cursor under it
      // (not while the button is held: that would turn a click into a drag)
      if (Math.abs(view.lv) > 1e-3 && overScreen && lastClient && screenPid < 0) {
        rayFrom(lastClient.x, lastClient.y)
        const p = toScreen()
        if (p) wmMove(p[0], p[1])
      }
      // the shadow map is only redrawn when something that casts into it has moved
      let keySig = 0
      for (const k of keys) keySig += k.d
      const shadowSig = `${ck},${ms.btn.toFixed(4)},${keySig.toFixed(4)},${floppy.t.toFixed(4)}`
      if (shadowSig !== lastShadowSig) {
        lastShadowSig = shadowSig
        renderer.shadowMap.needsUpdate = true
      }
      // render only when something on screen changed: the camera, the parts that
      // move, the tube's light, the desktop. An idle machine costs nothing, and
      // neither does scrolling past it
      const c = camera.position
      const frameSig = `${c.x.toFixed(5)},${c.y.toFixed(5)},${c.z.toFixed(5)},${view.lean.toFixed(4)},${shadowSig},${crt.uPower.value.toFixed(3)}`
      if (presented || renderAgain || frameSig !== lastFrameSig) {
        lastFrameSig = frameSig
        renderAgain = false
        presented = false
        post.render()
        rendered++
        if (!shown) {
          // the first frame is up: fade the machine in
          shown = true
          canvas.style.opacity = '1'
        }
      }
    }

    // ── assets: the faces, then the photographs ──────────────────────────
    void Promise.all([loadFace('display'), loadFace('body', '500')]).then(([d, b]) => {
      if (disposed) return
      display = d
      nameSpr = serifSpr(NAME, 46, d, 0.6, 100)
      welcomeSpr = serifSpr(`welcome to ${NAME}`, 24, d, 0.5, 96)
      yhSpr = serifSpr('YH', 30, d, 0.6, 100)
      paint.doc = brushName(d, DW, DH)
      drawDiskLabel(d)
      drawAtlas(b)
      applyTheme()
      boot()
    })
    updateCords()
    // compile the scene's shaders in parallel where the browser can, so the
    // first frame does not freeze the page while they build
    renderer
      .compileAsync(scene, camera)
      .catch(() => {})
      .finally(() => {
        if (!disposed) raf = requestAnimationFrame(frame)
      })

    return () => {
      disposed = true
      cancelAnimationFrame(raf)
      ro.disconnect()
      io.disconnect()
      window.removeEventListener('pointermove', onWindowMove)
      window.removeEventListener('pointerdown', onWindowDown)
      window.removeEventListener('keydown', onKeyDown, true)
      window.removeEventListener('keyup', onKeyUp, true)
      canvas.removeEventListener('pointermove', onMove)
      canvas.removeEventListener('pointerdown', onDown)
      canvas.removeEventListener('pointerup', onUp)
      canvas.removeEventListener('pointercancel', onUp)
      canvas.removeEventListener('pointerleave', onLeave)
      canvas.removeEventListener('touchstart', onTouchStart)
      proxy.removeEventListener('input', onProxyInput)
      proxy.removeEventListener('keydown', onProxyKey)
      proxy.remove()
      document.documentElement.removeAttribute('data-hero-keys')
      piano?.dispose()
      void actx?.close()
      const mats = new Set<THREE.Material>()
      scene.traverse((o) => {
        const m = o as THREE.Mesh
        if (m.geometry) m.geometry.dispose()
        if (m.material) (Array.isArray(m.material) ? m.material : [m.material]).forEach((x) => mats.add(x))
      })
      mats.forEach((m) => m.dispose())
      for (const ct of contacts) (ct.mesh.material as THREE.MeshBasicMaterial).map?.dispose()
      screenTex.dispose()
      atlasTex.dispose()
      badgeTex.dispose()
      labelTex.dispose()
      envTex.dispose()
      post.dispose()
      renderer.dispose()
      canvas.remove()
    }
  }, [])

  return (
    <div className="absolute inset-0">
      <div ref={hostRef} aria-hidden className="absolute inset-0" style={{ touchAction: 'pan-y' }} />
      <div className="sr-only">
        <p>{TAGLINE}</p>
        <ul>
          {CONTACT_ROWS.map(([label, text, url]) => (
            <li key={label}>
              <a href={url}>
                {label}: {text}
              </a>
            </li>
          ))}
        </ul>
      </div>
      {/* File ▸ print: the sheet feeds out from under the tube a line at a time.
          Click it to keep it (a PNG); the cross puts it away */}
      {printout && (
        <figure
          key={printout.at}
          className="absolute z-30 m-0"
          style={{ left: printout.x, top: printout.y, width: printout.w, transform: 'translateX(-50%) rotate(-1.4deg)', transformOrigin: 'top center' }}
        >
          <style>{`@keyframes mac-feed { from { clip-path: inset(0 0 100% 0) } to { clip-path: inset(0 0 0 0) } }`}</style>
          <a href={printout.url} download="desktop-printout.png" title="keep the printout" className="block cursor-pointer">
            {/* eslint-disable-next-line @next/next/no-img-element -- a data URL made on the spot */}
            <img
              src={printout.url}
              alt="a printout of the front window on the desktop"
              className="block w-full"
              style={{ animation: 'mac-feed 1.9s steps(18) both', boxShadow: '0 18px 30px -16px rgba(20,22,26,0.45), 0 1px 2px rgba(20,22,26,0.18)' }}
            />
          </a>
          <button
            type="button"
            onClick={() => setPrintout(null)}
            aria-label="put the printout away"
            className="absolute -top-3 -right-3 grid h-7 w-7 cursor-pointer place-items-center rounded-full"
            style={{ ...META, letterSpacing: 0, color: COLORS.ink, background: COLORS.bg, border: `1px solid ${COLORS.hairline}` }}
          >
            ×
          </button>
        </figure>
      )}
      <button
        type="button"
        onClick={() => standBackRef.current()}
        className="absolute top-5 left-5 z-20 cursor-pointer rounded-full px-3 py-2 transition-opacity duration-500"
        style={{
          ...META,
          color: COLORS.ink,
          background: `color-mix(in srgb, ${COLORS.bg} 80%, transparent)`,
          border: `1px solid ${COLORS.hairline}`,
          backdropFilter: 'blur(8px)',
          opacity: leaned ? 1 : 0,
          pointerEvents: leaned ? 'auto' : 'none',
        }}
      >
        ← back
      </button>
    </div>
  )
}

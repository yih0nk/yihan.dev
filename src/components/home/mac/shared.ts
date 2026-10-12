import type { CSSProperties } from 'react'

import { COLORS, FONTS } from '@/styles/tokens'

/**
 * What the Classic hero and its name share: the words, the one metadata
 * style, how a canvas finds the site's real faces, and the few lines of WebGL
 * plumbing the painted name runs on.
 */

export const NAME = 'yihan hong'
export const TAGLINE = 'engineer, and a few other things.'
/** The few other things, the same list the nav comment and /play use. */
export const THINGS = ['engineer', 'pianist', 'saxophonist', 'painter', 'photographer', 'badminton'] as const

export const hexToRgb = (hex: string): [number, number, number] => {
  const h = hex.replace('#', '')
  const full = h.length === 3 ? h.replace(/./g, (c) => c + c) : h
  const n = parseInt(full, 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

export const META: CSSProperties = {
  fontFamily: FONTS.mono,
  color: COLORS.muted,
  letterSpacing: '0.2em',
  textTransform: 'uppercase',
  fontSize: 12,
  lineHeight: 1,
}

/**
 * The real family list behind a next/font variable. next/font hashes the family
 * name, so a canvas asked for "Instrument Serif" by name silently draws Georgia.
 * Reading the variable off <html> gives the hashed name that is actually loaded.
 */
export function resolveFace(kind: 'display' | 'mono' | 'body'): string {
  const fallback = FONTS[kind]
  if (typeof document === 'undefined') return fallback
  const v = getComputedStyle(document.documentElement).getPropertyValue(`--font-${kind}-face`).trim()
  return v ? `${v}, ${fallback}` : fallback
}

/** Resolve a face and make sure its glyphs are in memory before a canvas rasterises them. */
export async function loadFace(kind: 'display' | 'mono' | 'body', weight = '400'): Promise<string> {
  const face = resolveFace(kind)
  try {
    await document.fonts.load(`${weight} 64px ${face}`, NAME)
    await document.fonts.ready
  } catch {
    /* draw with whatever is there */
  }
  return face
}

/** Minimal WebGL plumbing: compile, link, fullscreen triangle. */
export function makeProgram(gl: WebGLRenderingContext, vs: string, fs: string): WebGLProgram | null {
  const sh = (type: number, src: string) => {
    const s = gl.createShader(type)
    if (!s) return null
    gl.shaderSource(s, src)
    gl.compileShader(s)
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.error(gl.getShaderInfoLog(s))
      return null
    }
    return s
  }
  const v = sh(gl.VERTEX_SHADER, vs)
  const f = sh(gl.FRAGMENT_SHADER, fs)
  if (!v || !f) return null
  const p = gl.createProgram()
  if (!p) return null
  gl.attachShader(p, v)
  gl.attachShader(p, f)
  gl.linkProgram(p)
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
    console.error(gl.getProgramInfoLog(p))
    return null
  }
  const buf = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, buf)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
  const loc = gl.getAttribLocation(p, 'a_pos')
  gl.enableVertexAttribArray(loc)
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)
  return p
}

export const FULLSCREEN_VS = `
attribute vec2 a_pos;
varying vec2 v_uv;
void main() {
  v_uv = a_pos * 0.5 + 0.5;
  gl_Position = vec4(a_pos, 0.0, 1.0);
}`

export function uploadCanvas(gl: WebGLRenderingContext, tex: WebGLTexture, src: HTMLCanvasElement) {
  gl.bindTexture(gl.TEXTURE_2D, tex)
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
}

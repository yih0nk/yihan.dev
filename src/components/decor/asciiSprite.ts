/**
 * ASCII sprites that rotate by changing their characters, not by tilting the
 * text. A shape is drawn with canvas at each angle step, the coverage of every
 * character cell is measured (4x4 supersampled), and the coverage becomes a
 * glyph on the same ramp the sharks use. The frames are built once, on the
 * client, so a moving sprite only swaps a precomputed string.
 *
 * `draw` paints the shape in white, nose pointing right (+x), centred on the
 * origin, in a coordinate space `size` px across.
 */

export const RAMP = ' .:-=+*#%@'

export type SpriteSpec = {
  cols: number
  rows: number
  /** One character cell, in px: advance and line height of the rendered <pre>. */
  charW: number
  lineH: number
  /** How many angle steps around the circle. */
  steps: number
  draw: (ctx: CanvasRenderingContext2D, size: number) => void
}

export function buildFrames({ cols, rows, charW, lineH, steps, draw }: SpriteSpec): string[] {
  const SS = 4
  const w = cols * SS
  const h = rows * SS
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) return new Array(steps).fill('')
  // the canvas is in cell-sample units; scale so the shape keeps its real
  // proportions despite cells being taller than wide
  const pxW = cols * charW
  const pxH = rows * lineH
  const size = Math.min(pxW, pxH)
  const frames: string[] = []
  for (let s = 0; s < steps; s++) {
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.clearRect(0, 0, w, h)
    ctx.setTransform(w / pxW, 0, 0, h / pxH, 0, 0)
    ctx.translate(pxW / 2, pxH / 2)
    ctx.rotate((s / steps) * Math.PI * 2)
    ctx.fillStyle = '#fff'
    ctx.strokeStyle = '#fff'
    draw(ctx, size)
    const data = ctx.getImageData(0, 0, w, h).data
    let out = ''
    for (let r = 0; r < rows; r++) {
      let line = ''
      for (let c = 0; c < cols; c++) {
        let sum = 0
        for (let y = 0; y < SS; y++)
          for (let x = 0; x < SS; x++) sum += data[((r * SS + y) * w + (c * SS + x)) * 4 + 3]
        const cover = sum / (SS * SS * 255)
        line += cover < 0.06 ? ' ' : RAMP[Math.min(RAMP.length - 1, 1 + Math.floor(cover * (RAMP.length - 1)))]
      }
      out += line.replace(/\s+$/, '') + (r < rows - 1 ? '\n' : '')
    }
    frames.push(out)
  }
  return frames
}

/** The frame index for an angle in radians. */
export function frameFor(angle: number, steps: number) {
  const a = ((angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)
  return Math.round((a / (Math.PI * 2)) * steps) % steps
}

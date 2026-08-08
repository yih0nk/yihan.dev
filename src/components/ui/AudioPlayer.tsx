'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useThemeColors, type ResolvedColors } from '@/lib/useThemeColors'
import { COLORS, FONTS, MOTION } from '@/styles/tokens'

/**
 * The only sound on the site, drawn as sound.
 *
 * It was three 36px bordered squares and a 1px grey rule — a form control, and
 * the one element on the page that could have shown what it holds showed a
 * rectangle instead. Each track is now decoded once, reduced to peaks, and
 * painted as a waveform you can scrub: the shape of the take is visible before
 * you press anything, and the played portion fills with ink as it goes.
 *
 * ── what this is careful about ───────────────────────────────────────────────
 *
 * Decoding is lazy and shared. The three files are 1.3 MB, 438 KB and 217 KB;
 * decoding all of them on mount would spend 2 MB to render something nobody has
 * looked at yet. Nothing is fetched until the player scrolls into view, and the
 * first real interaction (pointer, focus) pulls its own track forward. Results
 * live in a module-level cache keyed by src, so a track decodes once per page
 * load no matter how often the component remounts or the visitor switches back.
 *
 * Decoding uses an OfflineAudioContext, not an AudioContext: it can decode just
 * the same and never touches an audio output device.
 *
 * Every one of these steps is allowed to fail. No Web Audio, a rejected decode,
 * a 404 — any of them and the row falls back to the plain progress rule it used
 * to be, which still plays and still scrubs. An empty box is never rendered.
 *
 * The rAF loop exists only to move the playhead between `timeupdate` events,
 * which fire about four times a second. It runs only while a track is actually
 * playing, stops on pause, and stops while the tab is hidden — a loop repainting
 * an identical frame in a background tab is pure battery. Under
 * `prefers-reduced-motion` it never starts at all: `timeupdate` alone still
 * fills the waveform, just in visible steps rather than a sweep.
 *
 * ── on labels ────────────────────────────────────────────────────────────────
 * The tracks carry no names in the data and none are invented here. A row shows
 * its position, its waveform and its duration — all facts — and `label` is
 * rendered if and only if it is supplied.
 */

interface Track {
  src: string   // e.g. "/audio/piece-01.mp3"
  label?: string
}

interface AudioPlayerProps {
  tracks: Track[]
}

/** Peak resolution, fixed and independent of pixel width, so a resize re-buckets
 *  from the cache instead of re-decoding. */
const PEAK_BUCKETS = 1024
const BAR_W = 2
const BAR_GAP = 1
/** On the type scale, and tall enough that quiet passages still read. */
const WAVE_H = 48

type Decoded = { peaks: Float32Array; duration: number }

/* ── module-level cache ─────────────────────────────────────────────────────
   Keyed by src and deliberately outside the component: switching tracks, or
   remounting the player, must never re-decode. `inflight` collapses concurrent
   requests for the same file into one; `undecodable` remembers failure so a
   broken src is not retried on every hover. */
const decodedCache = new Map<string, Decoded>()
const inflight = new Map<string, Promise<Decoded | null>>()
const undecodable = new Set<string>()

/**
 * `typeof globalThis` is load-bearing: the standard constructors are declared as
 * global `var`s rather than members of the `Window` interface, so an intersection
 * built on `Window` alone cannot see `AudioContext` at all.
 */
type WebAudioWindow = Window &
  typeof globalThis & {
    webkitAudioContext?: typeof AudioContext
    webkitOfflineAudioContext?: typeof OfflineAudioContext
  }

/**
 * A context purely for decoding. OfflineAudioContext is preferred because it
 * does not open an output device; AudioContext is the fallback for browsers
 * that only expose the prefixed offline variant oddly or not at all.
 */
function makeDecodeContext(): BaseAudioContext | null {
  if (typeof window === 'undefined') return null
  const w = window as WebAudioWindow
  const Offline = w.OfflineAudioContext ?? w.webkitOfflineAudioContext
  if (Offline) {
    try {
      return new Offline(1, 1, 44100)
    } catch {
      /* fall through to AudioContext */
    }
  }
  const Ctx = w.AudioContext ?? w.webkitAudioContext
  if (Ctx) {
    try {
      return new Ctx()
    } catch {
      return null
    }
  }
  return null
}

function closeContext(ctx: BaseAudioContext) {
  const closable = ctx as { close?: () => Promise<void> }
  if (typeof closable.close === 'function') {
    void closable.close().catch(() => {})
  }
}

/**
 * Absolute peak per bucket, averaged across channels, normalised to the loudest
 * bucket. Normalising matters: these are phone recordings of a room, and at true
 * amplitude the quieter two would draw as almost nothing.
 */
function computePeaks(buffer: AudioBuffer, buckets: number): Float32Array {
  const channels: Float32Array[] = []
  for (let c = 0; c < Math.min(buffer.numberOfChannels, 2); c++) {
    channels.push(buffer.getChannelData(c))
  }
  const peaks = new Float32Array(buckets)
  if (channels.length === 0) return peaks

  const len = buffer.length
  let overall = 0

  for (let b = 0; b < buckets; b++) {
    const start = Math.floor((b * len) / buckets)
    const end = Math.min(len, Math.floor(((b + 1) * len) / buckets))
    let localMax = 0
    for (let i = start; i < end; i++) {
      let sum = 0
      for (let c = 0; c < channels.length; c++) sum += Math.abs(channels[c][i])
      const v = sum / channels.length
      if (v > localMax) localMax = v
    }
    peaks[b] = localMax
    if (localMax > overall) overall = localMax
  }

  if (overall > 0) {
    for (let b = 0; b < buckets; b++) peaks[b] /= overall
  }
  return peaks
}

/**
 * Fetch, decode, reduce. Returns null rather than throwing — every caller's
 * correct response to failure is the same, and it is "draw the plain rule".
 */
function loadDecoded(src: string): Promise<Decoded | null> {
  const cached = decodedCache.get(src)
  if (cached) return Promise.resolve(cached)
  if (undecodable.has(src)) return Promise.resolve(null)

  const existing = inflight.get(src)
  if (existing) return existing

  const job = (async (): Promise<Decoded | null> => {
    let ctx: BaseAudioContext | null = null
    try {
      ctx = makeDecodeContext()
      if (!ctx) throw new Error('Web Audio unavailable')

      const res = await fetch(src)
      if (!res.ok) throw new Error(`fetch ${res.status}`)
      const bytes = await res.arrayBuffer()

      const buffer = await ctx.decodeAudioData(bytes)
      const result: Decoded = {
        peaks: computePeaks(buffer, PEAK_BUCKETS),
        duration: buffer.duration,
      }
      decodedCache.set(src, result)
      return result
    } catch {
      // No Web Audio, a rejected decode, a missing file — all one outcome.
      undecodable.add(src)
      return null
    } finally {
      if (ctx) closeContext(ctx)
      inflight.delete(src)
    }
  })()

  inflight.set(src, job)
  return job
}

/** m:ss, or null while unknown. */
function formatTime(seconds: number | null): string | null {
  if (seconds === null || !Number.isFinite(seconds) || seconds < 0) return null
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

/**
 * Paint the waveform. Returns false when the canvas has no measurable box.
 *
 * That check is the whole reason this returns a boolean: a canvas whose CSS box
 * measures 0 keeps its default 300×150 backing store, so drawing into it
 * silently succeeds and then appears stretched and wrong the moment the element
 * gets a real width. Better to draw nothing and be asked again.
 */
function drawWaveform(
  canvas: HTMLCanvasElement,
  peaks: Float32Array,
  progress: number,
  active: boolean,
  // Passed in, not imported: ctx.fillStyle silently ignores a CSS variable.
  theme: ResolvedColors,
): boolean {
  const rect = canvas.getBoundingClientRect()
  if (rect.width < 1 || rect.height < 1) return false

  const ctx = canvas.getContext('2d')
  if (!ctx) return false

  const dpr = window.devicePixelRatio || 1
  const w = Math.max(1, Math.round(rect.width * dpr))
  const h = Math.max(1, Math.round(rect.height * dpr))
  // Assigning width/height clears the canvas, so only do it on a real change.
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w
    canvas.height = h
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, rect.width, rect.height)

  const bars = Math.max(1, Math.floor((rect.width + BAR_GAP) / (BAR_W + BAR_GAP)))
  const mid = rect.height / 2
  const playedColor = active ? theme.accent : theme.ink

  for (let i = 0; i < bars; i++) {
    const from = Math.floor((i * peaks.length) / bars)
    const to = Math.max(from + 1, Math.floor(((i + 1) * peaks.length) / bars))
    let v = 0
    for (let j = from; j < to && j < peaks.length; j++) {
      if (peaks[j] > v) v = peaks[j]
    }
    // A 1px floor keeps silence as a hairline rather than a gap.
    const barH = Math.max(1, v * (rect.height - 2))
    const x = i * (BAR_W + BAR_GAP)
    ctx.fillStyle = (i + 0.5) / bars <= progress ? playedColor : theme.hairline
    ctx.fillRect(x, mid - barH / 2, BAR_W, barH)
  }
  return true
}

/**
 * Reduced motion is read once and watched, since a visitor can flip it mid
 * session. It gates the rAF sweep and the CSS transitions below.
 */
function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(mq.matches)
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  return reduced
}

const REDUCED_MOTION_CSS = `
@media (prefers-reduced-motion: reduce) {
  .ap-anim { transition: none !important; }
}
`

function TrackRow({
  track,
  index,
  suppressed,
  onPlay,
}: {
  track: Track
  index: number
  /** True when some other row is the one playing. */
  suppressed: boolean
  onPlay: (i: number) => void
}) {
  // The waveform is a canvas, so it needs resolved colours. In dark mode the
  // bars draw in ink, which is near-white — not the near-black of light mode.
  const theme = useThemeColors()
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const sliderRef = useRef<HTMLDivElement | null>(null)
  const fillRef = useRef<HTMLDivElement | null>(null)
  /** Progress lives in a ref, not state: the rAF loop writes it up to 60×/s and
   *  a re-render per frame for a canvas repaint would be waste. */
  const progressRef = useRef(0)
  const retryRef = useRef(0)
  const pendingSeekRef = useRef<number | null>(null)

  const [peaks, setPeaks] = useState<Float32Array | null>(null)
  const [duration, setDuration] = useState<number | null>(null)
  const [playing, setPlaying] = useState(false)
  const [active, setActive] = useState(false)
  const [wanted, setWanted] = useState(false)

  const reducedMotion = useReducedMotion()

  /* ── paint ───────────────────────────────────────────────────────────────
     One function for both renderings: the waveform when peaks exist, the plain
     rule when they never arrived. */
  const paint = useCallback(() => {
    const ratio = progressRef.current

    const slider = sliderRef.current
    if (slider) slider.setAttribute('aria-valuenow', String(Math.round(ratio * 100)))

    const canvas = canvasRef.current
    if (canvas && peaks) {
      if (!drawWaveform(canvas, peaks, ratio, active, theme)) {
        // Zero-size box: ask again next frame rather than drawing into it.
        if (retryRef.current) cancelAnimationFrame(retryRef.current)
        retryRef.current = requestAnimationFrame(() => {
          retryRef.current = 0
          paint()
        })
      }
      return
    }

    const fill = fillRef.current
    if (fill) fill.style.width = `${ratio * 100}%`
    // `theme` is a dependency because the bars are painted pixels, not styled
    // elements: nothing repaints them when the palette changes except this.
  }, [peaks, active, theme])

  useEffect(() => {
    paint()
    return () => {
      if (retryRef.current) cancelAnimationFrame(retryRef.current)
    }
  }, [paint])

  /* ── lazy decode ─────────────────────────────────────────────────────────
     Triggered by the row entering the viewport, or by the first interaction,
     whichever comes first. `wanted` is the single gate. */
  useEffect(() => {
    if (wanted) return
    const el = sliderRef.current
    if (!el || typeof IntersectionObserver === 'undefined') {
      setWanted(true)
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setWanted(true)
          io.disconnect()
        }
      },
      { rootMargin: '200px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [wanted])

  useEffect(() => {
    if (!wanted) return
    let alive = true
    void loadDecoded(track.src).then((d) => {
      if (!alive || !d) return
      setPeaks(d.peaks)
      setDuration((prev) => prev ?? d.duration)
    })
    return () => {
      alive = false
    }
  }, [wanted, track.src])

  /* ── exclusivity ─────────────────────────────────────────────────────────
     The parent names one active row; everyone else stops. Declarative, so it
     cannot drift out of step with the audio elements' real state. */
  useEffect(() => {
    if (!suppressed) return
    const audio = audioRef.current
    if (audio && !audio.paused) audio.pause()
  }, [suppressed])

  /* ── the playhead loop ───────────────────────────────────────────────────
     Only while playing, never under reduced motion, never while hidden. */
  useEffect(() => {
    if (!playing || reducedMotion) return
    let raf = 0

    const tick = () => {
      const audio = audioRef.current
      if (audio && audio.duration > 0) {
        progressRef.current = Math.min(1, audio.currentTime / audio.duration)
        paint()
      }
      raf = document.hidden ? 0 : requestAnimationFrame(tick)
    }

    const onVisibility = () => {
      if (document.hidden) {
        if (raf) cancelAnimationFrame(raf)
        raf = 0
      } else if (!raf) {
        raf = requestAnimationFrame(tick)
      }
    }

    if (!document.hidden) raf = requestAnimationFrame(tick)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      if (raf) cancelAnimationFrame(raf)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [playing, reducedMotion, paint])

  /* ── size ────────────────────────────────────────────────────────────────
     devicePixelRatio and layout width are both read at paint time, so a resize
     only has to ask for a repaint. */
  useEffect(() => {
    const el = sliderRef.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(() => paint())
    ro.observe(el)
    window.addEventListener('resize', paint)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', paint)
    }
  }, [paint])

  /* ── transport ───────────────────────────────────────────────────────── */
  const toggle = () => {
    const audio = audioRef.current
    if (!audio) return
    setWanted(true)
    if (audio.paused) {
      void audio.play().catch(() => setPlaying(false))
    } else {
      audio.pause()
    }
  }

  const seekToRatio = (ratio: number) => {
    const clamped = Math.max(0, Math.min(1, ratio))
    progressRef.current = clamped
    paint()

    const audio = audioRef.current
    if (!audio) return
    if (Number.isFinite(audio.duration) && audio.duration > 0) {
      audio.currentTime = clamped * audio.duration
    } else {
      // preload="none" means metadata may not exist yet. Remember the intent
      // and apply it the moment the browser knows how long the file is.
      pendingSeekRef.current = clamped
      audio.load()
    }
  }

  const ratioFromEvent = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    if (rect.width < 1) return 0
    return (e.clientX - rect.left) / rect.width
  }

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    setWanted(true)
    e.currentTarget.setPointerCapture(e.pointerId)
    seekToRatio(ratioFromEvent(e))
  }

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!e.currentTarget.hasPointerCapture(e.pointerId)) return
    seekToRatio(ratioFromEvent(e))
  }

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId)
    }
  }

  /** Click-to-scrub was the whole interaction, which left the player unusable
   *  without a pointer. Arrows step 5s, Home/End jump the ends. */
  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const total = duration
    if (!total) return
    const step = 5 / total
    const current = progressRef.current
    let next: number | null = null

    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') next = current + step
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') next = current - step
    else if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = 1
    else if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault()
      toggle()
      return
    }

    if (next !== null) {
      e.preventDefault()
      seekToRatio(next)
    }
  }

  const readDuration = () => {
    const audio = audioRef.current
    if (!audio) return
    if (Number.isFinite(audio.duration) && audio.duration > 0) {
      setDuration((prev) => prev ?? audio.duration)
      const pending = pendingSeekRef.current
      if (pending !== null) {
        pendingSeekRef.current = null
        audio.currentTime = pending * audio.duration
      }
    }
  }

  const onTimeUpdate = () => {
    const audio = audioRef.current
    if (!audio || !(audio.duration > 0)) return
    progressRef.current = Math.min(1, audio.currentTime / audio.duration)
    paint()
  }

  const onEnded = () => {
    setPlaying(false)
    progressRef.current = 0
    paint()
  }

  const durationLabel = formatTime(duration)
  const accented = active || playing
  const ui = `${MOTION.ui} ${MOTION.ease}`

  return (
    <li
      className="flex items-center gap-5"
      onMouseEnter={() => setActive(true)}
      onMouseLeave={() => setActive(false)}
    >
      <audio
        ref={audioRef}
        src={track.src}
        preload="none"
        onPlay={() => {
          setPlaying(true)
          onPlay(index)
        }}
        onPause={() => setPlaying(false)}
        onEnded={onEnded}
        onTimeUpdate={onTimeUpdate}
        onLoadedMetadata={readDuration}
        onDurationChange={readDuration}
      />

      {/* Was a 36px bordered square that inverted to solid black on hover. The
          border and the fill are both gone; it is a glyph that comes up to the
          accent, which is the only interaction signal the system has. The
          negative margin grows the hit target to ~28px without drawing a box. */}
      <button
        type="button"
        onClick={toggle}
        onFocus={() => setActive(true)}
        onBlur={() => setActive(false)}
        aria-label={
          playing
            ? `Pause track ${index + 1}`
            : `Play track ${index + 1}`
        }
        className="ap-anim -m-2 flex shrink-0 items-center justify-center p-2"
        style={{ color: accented ? COLORS.accent : COLORS.ink, transition: `color ${ui}` }}
      >
        {playing ? (
          <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" aria-hidden>
            <rect x="1" y="1" width="4" height="10" />
            <rect x="7" y="1" width="4" height="10" />
          </svg>
        ) : (
          <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" aria-hidden>
            <polygon points="2,1 11,6 2,11" />
          </svg>
        )}
      </button>

      <div className="min-w-0 flex-1">
        {track.label && (
          <span
            className="mb-1 block text-[12px] tracking-[0.08em]"
            style={{ fontFamily: FONTS.mono, color: COLORS.muted }}
          >
            {track.label}
          </span>
        )}

        <div
          ref={sliderRef}
          role="slider"
          tabIndex={0}
          aria-label={`Seek track ${index + 1}`}
          aria-valuemin={0}
          aria-valuemax={100}
          /* aria-valuenow is set by paint(), not here. If React owned it, every
             re-render would slam it back to its initial value mid-playback. */
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onKeyDown={onKeyDown}
          onFocus={() => setActive(true)}
          onBlur={() => setActive(false)}
          className="relative flex w-full cursor-pointer touch-none items-center outline-none"
          style={{ height: WAVE_H }}
        >
          {peaks ? (
            <canvas ref={canvasRef} className="block h-full w-full" />
          ) : (
            /* The fallback, and the pre-decode state: the plain rule this
               component used to be. Never an empty box. */
            <div className="relative h-px w-full" style={{ background: COLORS.hairline }}>
              <div
                ref={fillRef}
                className="ap-anim absolute left-0 top-0 h-full"
                style={{
                  width: 0,
                  background: accented ? COLORS.accent : COLORS.ink,
                  transition: reducedMotion ? 'none' : `background-color ${ui}`,
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Duration is metadata, so: mono, 12px, and reserved width so the row
          does not shift when the number arrives. */}
      <span
        className="w-[4ch] shrink-0 text-right text-[12px] tabular-nums"
        style={{ fontFamily: FONTS.mono, color: COLORS.muted }}
      >
        {durationLabel}
      </span>
    </li>
  )
}

export default function AudioPlayer({ tracks }: AudioPlayerProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)

  return (
    <>
      <style>{REDUCED_MOTION_CSS}</style>
      <ul className="space-y-5">
        {tracks.map((track, i) => (
          <TrackRow
            key={track.src}
            track={track}
            index={i}
            suppressed={activeIndex !== null && activeIndex !== i}
            onPlay={setActiveIndex}
          />
        ))}
      </ul>
    </>
  )
}

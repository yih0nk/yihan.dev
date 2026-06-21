/**
 * PianoHero.tsx
 *
 * Required npm dependencies:
 *   framer-motion   (already installed)
 *   tone            npm install tone
 *
 * Usage in Next.js — must be loaded client-side only:
 *   import dynamic from 'next/dynamic'
 *   const PianoHero = dynamic(
 *     () => import('@/components/interactive/PianoHero'),
 *     { ssr: false }
 *   )
 *
 * Required font in src/styles/globals.css (or layout.tsx):
 *   @import url('https://fonts.googleapis.com/css2?family=Caveat:wght@700&display=swap');
 */

'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// ─── Types ────────────────────────────────────────────────────────────────────

interface KeyDef {
  note: string
  type: 'white' | 'black'
  keyboardKey: string
  whiteIndex: number   // sequential position among white keys (0-based)
  yihanIndex?: number  // 0–4 if this key is part of the YIHAN sequence
}

interface ToneSynth {
  triggerAttackRelease(note: string, duration: string): void
  dispose(): void
}

// ─── Piano data ───────────────────────────────────────────────────────────────

// The 5 notes that spell YIHAN, chosen to form a pleasant ascending melody
const YIHAN_NOTES = ['C4', 'E4', 'G4', 'A4', 'C5'] as const
const YIHAN_LETTERS = ['y', 'i', 'h', 'a', 'n'] as const

// Full 2-octave keyboard: C4–B5
const ALL_KEYS: KeyDef[] = [
  // ── Octave 4 ──
  { note: 'C4',  type: 'white', keyboardKey: 'a', whiteIndex: 0,  yihanIndex: 0 },
  { note: 'C#4', type: 'black', keyboardKey: 'w', whiteIndex: 0 },
  { note: 'D4',  type: 'white', keyboardKey: 's', whiteIndex: 1 },
  { note: 'D#4', type: 'black', keyboardKey: 'e', whiteIndex: 1 },
  { note: 'E4',  type: 'white', keyboardKey: 'd', whiteIndex: 2,  yihanIndex: 1 },
  { note: 'F4',  type: 'white', keyboardKey: 'f', whiteIndex: 3 },
  { note: 'F#4', type: 'black', keyboardKey: 't', whiteIndex: 3 },
  { note: 'G4',  type: 'white', keyboardKey: 'g', whiteIndex: 4,  yihanIndex: 2 },
  { note: 'G#4', type: 'black', keyboardKey: 'y', whiteIndex: 4 },
  { note: 'A4',  type: 'white', keyboardKey: 'h', whiteIndex: 5,  yihanIndex: 3 },
  { note: 'A#4', type: 'black', keyboardKey: 'u', whiteIndex: 5 },
  { note: 'B4',  type: 'white', keyboardKey: 'j', whiteIndex: 6 },
  // ── Octave 5 ──
  { note: 'C5',  type: 'white', keyboardKey: 'k', whiteIndex: 7,  yihanIndex: 4 },
  { note: 'C#5', type: 'black', keyboardKey: 'o', whiteIndex: 7 },
  { note: 'D5',  type: 'white', keyboardKey: 'l', whiteIndex: 8 },
  { note: 'D#5', type: 'black', keyboardKey: 'p', whiteIndex: 8 },
  { note: 'E5',  type: 'white', keyboardKey: ';', whiteIndex: 9 },
  { note: 'F5',  type: 'white', keyboardKey: "'", whiteIndex: 10 },
  { note: 'F#5', type: 'black', keyboardKey: ']', whiteIndex: 10 },
  { note: 'G5',  type: 'white', keyboardKey: 'z', whiteIndex: 11 },
  { note: 'G#5', type: 'black', keyboardKey: 'x', whiteIndex: 11 },
  { note: 'A5',  type: 'white', keyboardKey: 'c', whiteIndex: 12 },
  { note: 'A#5', type: 'black', keyboardKey: 'v', whiteIndex: 12 },
  { note: 'B5',  type: 'white', keyboardKey: 'b', whiteIndex: 13 },
]

// Lookup by keyboard key (lowercase)
const KEY_BY_KEYBOARD: Record<string, KeyDef> = Object.fromEntries(
  ALL_KEYS.map(k => [k.keyboardKey, k])
)

// ─── Key dimensions ───────────────────────────────────────────────────────────

const WW_DESKTOP = 44   // white key width  (px)
const WH_DESKTOP = 160  // white key height
const BW_DESKTOP = 28   // black key width
const BH_DESKTOP = 100  // black key height

const WW_MOBILE  = 38
const WH_MOBILE  = 130
const BW_MOBILE  = 24
const BH_MOBILE  = 82

// ─── Helpers ──────────────────────────────────────────────────────────────────

function useIsMobile(): boolean {
  const [mobile, setMobile] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    setMobile(mq.matches)
    const onChange = (e: MediaQueryListEvent) => setMobile(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  return mobile
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function PianoHero() {
  const [revealedCount, setRevealedCount] = useState(0)
  const [completed, setCompleted]         = useState(false)
  const [activeNotes, setActiveNotes]     = useState<Set<string>>(new Set())
  const synthRef        = useRef<ToneSynth | null>(null)
  const audioReady      = useRef(false)
  const isMobile        = useIsMobile()

  // On mobile show C4–C5 (8 white keys) so all YIHAN notes fit
  const visibleKeys = isMobile
    ? ALL_KEYS.filter(k => k.whiteIndex <= 7)
    : ALL_KEYS

  const whiteKeys = visibleKeys.filter(k => k.type === 'white')
  const blackKeys = visibleKeys.filter(k => k.type === 'black')

  const wW = isMobile ? WW_MOBILE : WW_DESKTOP
  const wH = isMobile ? WH_MOBILE : WH_DESKTOP
  const bW = isMobile ? BW_MOBILE : BW_DESKTOP
  const bH = isMobile ? BH_MOBILE : BH_DESKTOP
  const keyboardWidth = whiteKeys.length * wW

  // ── Audio ────────────────────────────────────────────────────────────────

  const initAudio = useCallback(async () => {
    if (audioReady.current) return
    audioReady.current = true
    try {
      const Tone = await import('tone')
      await Tone.start()
      synthRef.current = new Tone.Synth({
        oscillator: { type: 'triangle' },
        envelope: { attack: 0.01, decay: 0.12, sustain: 0.2, release: 1.2 },
        volume: -6,
      }).toDestination() as ToneSynth
    } catch (err) {
      console.warn('PianoHero: audio init failed', err)
    }
  }, [])

  const playNote = useCallback(async (note: string) => {
    await initAudio()
    try {
      synthRef.current?.triggerAttackRelease(note, '8n')
    } catch { /* ignore timing errors */ }
  }, [initAudio])

  // ── Interaction ──────────────────────────────────────────────────────────

  const handlePress = useCallback((note: string) => {
    setActiveNotes(prev => { const s = new Set(prev); s.add(note); return s })
    playNote(note)

    setRevealedCount(prev => {
      if (prev >= YIHAN_NOTES.length) return prev
      if (note === YIHAN_NOTES[prev]) {
        const next = prev + 1
        if (next === YIHAN_NOTES.length) {
          setTimeout(() => setCompleted(true), 700)
        }
        return next
      }
      return prev // wrong note — no penalty, just don't advance
    })
  }, [playNote])

  const handleRelease = useCallback((note: string) => {
    setActiveNotes(prev => { const s = new Set(prev); s.delete(note); return s })
  }, [])

  // ── Keyboard events ──────────────────────────────────────────────────────

  useEffect(() => {
    const held = new Set<string>()

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat || e.metaKey || e.ctrlKey || e.altKey) return
      // Preserve case-sensitive keys like ' and ;
      const k = (e.key === "'" || e.key === ';' || e.key === ']')
        ? e.key
        : e.key.toLowerCase()
      if (held.has(k)) return
      held.add(k)
      const def = KEY_BY_KEYBOARD[k]
      if (def) { e.preventDefault(); handlePress(def.note) }
    }

    const onKeyUp = (e: KeyboardEvent) => {
      const k = (e.key === "'" || e.key === ';' || e.key === ']')
        ? e.key
        : e.key.toLowerCase()
      held.delete(k)
      const def = KEY_BY_KEYBOARD[k]
      if (def) handleRelease(def.note)
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [handlePress, handleRelease])

  // ── Skip ─────────────────────────────────────────────────────────────────

  const skip = useCallback(() => {
    initAudio()
    setRevealedCount(YIHAN_NOTES.length)
    setCompleted(true)
  }, [initAudio])

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div
      className="relative flex flex-col items-center justify-center min-h-screen py-16 px-4 select-none"
      style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif" }}
    >
      {/* ── YIHAN name display ─────────────────────────────────────────── */}
      <div className="flex items-end justify-center mb-8" style={{ height: 130, gap: 4 }}>
        {YIHAN_LETTERS.map((letter, i) => (
          <div
            key={letter}
            style={{ position: 'relative', width: 'clamp(44px, 9vw, 88px)' }}
          >
            {/* Reserve space with invisible ghost letter */}
            <span
              aria-hidden
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 'clamp(56px, 9vw, 108px)',
                fontWeight: 700,
                color: 'transparent',
                display: 'block',
                lineHeight: 1,
                textAlign: 'center',
              }}
            >
              {letter}
            </span>

            {/* Revealed letter animates in */}
            <AnimatePresence>
              {i < revealedCount && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.3, y: 24 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 16 }}
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 'clamp(56px, 9vw, 108px)',
                    fontWeight: 700,
                    color: '#000',
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    lineHeight: 1,
                  }}
                >
                  {letter}
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>

      {/* ── Subtitle + CTA after completion ───────────────────────────── */}
      <AnimatePresence>
        {completed && (
          <motion.div
            key="subtitle"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.25 }}
            className="text-center mb-12"
          >
            <p
              className="text-sm text-gray-500 mb-5"
              style={{ letterSpacing: '0.18em' }}
            >
              developer. artist. musician.
            </p>
            <div className="flex gap-4 justify-center">
              <a
                href="/projects"
                className="inline-block border-2 border-black px-6 py-2 text-sm text-black btn-grain hover:bg-black hover:text-white transition-all"
                style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif", letterSpacing: '0.05em' }}
              >
                see my work →
              </a>
              <a
                href="/about"
                className="inline-block border-2 border-black px-6 py-2 text-sm text-black btn-grain hover:bg-black hover:text-white transition-all"
                style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif", letterSpacing: '0.05em' }}
              >
                get to know me →
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Hint text before completion ────────────────────────────────── */}
      {!completed && (
        <p
          className="text-xs text-gray-400 mb-8 uppercase"
          style={{ letterSpacing: '0.15em', minHeight: '1em' }}
        >
          {revealedCount === 0
            ? 'play the highlighted keys to spell my name'
            : revealedCount < YIHAN_NOTES.length
            ? `${YIHAN_NOTES.length - revealedCount} more…`
            : '✓'}
        </p>
      )}

      {/* ── Piano keyboard ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {!completed && (
          <motion.div
            key="keyboard"
            exit={{ opacity: 0, scaleY: 0.75, y: 24 }}
            transition={{ duration: 0.45, ease: 'easeInOut' }}
            style={{ originY: 1 }}
          >
            {/* Keys container */}
            <div
              style={{
                position: 'relative',
                width: keyboardWidth,
                height: wH,
                touchAction: 'none', // prevent scroll while playing
              }}
            >
              {/* White keys */}
              {whiteKeys.map((key, i) => {
                const isActive  = activeNotes.has(key.note)
                const isTarget  = key.yihanIndex !== undefined
                const isRevealed = isTarget && key.yihanIndex! < revealedCount
                const letter    = isTarget ? YIHAN_LETTERS[key.yihanIndex!] : undefined

                return (
                  <div
                    key={key.note}
                    onPointerDown={e => { e.preventDefault(); handlePress(key.note) }}
                    onPointerUp={() => handleRelease(key.note)}
                    onPointerLeave={() => handleRelease(key.note)}
                    style={{
                      position: 'absolute',
                      left: i * wW,
                      top: 0,
                      width: wW - 1,
                      height: wH,
                      background: isActive ? '#ddd' : '#fff',
                      border: '1px solid #111',
                      borderRadius: '0 0 5px 5px',
                      cursor: 'pointer',
                      zIndex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'flex-end',
                      paddingBottom: 8,
                      transform: isActive ? 'translateY(2px)' : 'translateY(0)',
                      transition: 'background 0.04s, transform 0.04s',
                      // Subtle inset ring on target keys that haven't been revealed
                      boxShadow: isTarget && !isRevealed
                        ? 'inset 0 0 0 2px #333'
                        : 'none',
                    }}
                  >
                    {/* YIHAN letter label */}
                    {letter && (
                      <span style={{
                        fontFamily: "'Caveat', cursive",
                        fontSize: 16,
                        fontWeight: 700,
                        color: isRevealed ? '#ccc' : '#444',
                        marginBottom: 18,
                        transition: 'color 0.3s',
                      }}>
                        {letter}
                      </span>
                    )}
                    {/* Keyboard shortcut hint */}
                    <span style={{
                      fontFamily: 'monospace',
                      fontSize: isMobile ? 9 : 10,
                      color: '#ccc',
                      textTransform: 'uppercase',
                    }}>
                      {key.keyboardKey}
                    </span>
                  </div>
                )
              })}

              {/* Black keys — rendered on top */}
              {blackKeys.map(key => {
                // On mobile, hide C#5 (hangs off edge since D5 isn't visible)
                if (isMobile && key.whiteIndex >= 7) return null

                const isActive = activeNotes.has(key.note)
                // Center the black key at the boundary between white keys
                const left = (key.whiteIndex + 1) * wW - bW / 2

                return (
                  <div
                    key={key.note}
                    onPointerDown={e => { e.preventDefault(); handlePress(key.note) }}
                    onPointerUp={() => handleRelease(key.note)}
                    onPointerLeave={() => handleRelease(key.note)}
                    style={{
                      position: 'absolute',
                      left,
                      top: 0,
                      width: bW,
                      height: bH,
                      background: isActive ? '#444' : '#111',
                      border: '1px solid #000',
                      borderRadius: '0 0 4px 4px',
                      cursor: 'pointer',
                      zIndex: 2,
                      display: 'flex',
                      alignItems: 'flex-end',
                      justifyContent: 'center',
                      paddingBottom: 5,
                      transform: isActive ? 'translateY(2px)' : 'translateY(0)',
                      transition: 'background 0.04s, transform 0.04s',
                    }}
                  >
                    <span style={{
                      fontFamily: 'monospace',
                      fontSize: isMobile ? 7 : 8,
                      color: '#555',
                      textTransform: 'uppercase',
                    }}>
                      {key.keyboardKey}
                    </span>
                  </div>
                )
              })}
            </div>

            {/* Keyboard hint — desktop only */}
            {!isMobile && (
              <p className="text-center text-xs text-gray-300 mt-4">
                use your keyboard —{' '}
                <kbd style={{
                  fontFamily: 'monospace',
                  background: '#f2f2f2',
                  border: '1px solid #ddd',
                  borderRadius: 3,
                  padding: '1px 5px',
                  fontSize: 10,
                }}>
                  a
                </kbd>{' '}
                starts at C4
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Skip button ────────────────────────────────────────────────── */}
      {!completed && (
        <button
          onClick={skip}
          style={{
            position: 'absolute',
            bottom: 24,
            right: 24,
            fontFamily: 'monospace',
            fontSize: 12,
            color: '#ccc',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 4,
            transition: 'color 0.2s',
          }}
          onMouseEnter={e => (e.currentTarget.style.color = '#666')}
          onMouseLeave={e => (e.currentTarget.style.color = '#ccc')}
        >
          skip →
        </button>
      )}
    </div>
  )
}

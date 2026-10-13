'use client'

import { useEffect, useState } from 'react'

import FooterDog from '@/components/decor/FooterDog'
import { holdScroll } from '@/components/layout/SmoothScroll'
import { COLORS, FONTS } from '@/styles/tokens'

/** Set once this tab has loaded the homepage: coming back to it by a link goes straight in. */
let loaded = false

/** How long it holds: the machine is nearly always up by then, and it never waits past it. */
const HOLD = 3000
const FADE = 500

/**
 * The homepage on a full load: the dog, the name and "loading...", held over
 * the page for three seconds while the machine loads underneath, then faded
 * off so the whole page arrives at once.
 *
 * It is in the server's HTML, so it covers the page from the first paint.
 * Arriving at the homepage by a link inside the site skips it (the cross-fade
 * does that job). Without JavaScript it never shows.
 */
export default function Loader() {
  const [phase, setPhase] = useState<'up' | 'fading' | 'gone'>(() => (loaded ? 'gone' : 'up'))
  const [timeUp, setTimeUp] = useState(false)
  const gone = phase === 'gone'

  // The page under it stays put while it is up. Not by hiding its overflow:
  // the scrollbar coming back narrows the page, the machine's canvas resizes,
  // and the whole screen flashes. The ways in are blocked instead.
  useEffect(() => {
    if (gone) return
    loaded = true
    holdScroll(true)
    const block = (e: Event) => e.preventDefault()
    const keys = (e: KeyboardEvent) => {
      if ([' ', 'PageDown', 'PageUp', 'ArrowDown', 'ArrowUp', 'Home', 'End'].includes(e.key)) e.preventDefault()
    }
    window.addEventListener('wheel', block, { passive: false })
    window.addEventListener('touchmove', block, { passive: false })
    window.addEventListener('keydown', keys)
    return () => {
      holdScroll(false)
      window.removeEventListener('wheel', block)
      window.removeEventListener('touchmove', block)
      window.removeEventListener('keydown', keys)
    }
  }, [gone])

  useEffect(() => {
    if (gone) return
    const t = window.setTimeout(() => setTimeUp(true), HOLD)
    return () => window.clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // the full hold, always; and if the machine is still not up by then, it goes anyway
  useEffect(() => {
    if (phase === 'up' && timeUp) setPhase('fading')
  }, [phase, timeUp])

  useEffect(() => {
    if (phase !== 'fading') return
    const t = window.setTimeout(() => setPhase('gone'), FADE)
    return () => window.clearTimeout(t)
  }, [phase])

  if (gone) return null

  return (
    <div
      id="page-loader"
      aria-hidden
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-10"
      style={{
        background: COLORS.bg,
        opacity: phase === 'fading' ? 0 : 1,
        transition: `opacity ${FADE}ms ease`,
        pointerEvents: phase === 'fading' ? 'none' : 'auto',
      }}
    >
      <style>{`
        /* never strand a page behind it: a script that dies lets go */
        #page-loader { animation: page-loader-bail 0s linear ${HOLD + 2000}ms forwards }
        @keyframes page-loader-bail { to { opacity: 0; visibility: hidden } }
      `}</style>
      <noscript>
        <style>{`#page-loader { display: none }`}</style>
      </noscript>
      {/* zoom, not scale: the glyphs are laid out again at the larger size, so they stay sharp */}
      <div style={{ zoom: 2.4 }}>
        <FooterDog />
      </div>
      <div className="flex flex-col items-center gap-4">
        <span className="text-[56px] leading-none md:text-[72px]" style={{ fontFamily: FONTS.display, color: COLORS.ink }}>
          Yihan Hong
        </span>
        <span className="text-[14px] tracking-[0.14em]" style={{ fontFamily: FONTS.mono, color: COLORS.muted }}>
          loading...
        </span>
      </div>
    </div>
  )
}

'use client'

import dynamic from 'next/dynamic'
import { Component, useEffect, useState, type ReactNode } from 'react'

import type { InitialNowPlaying } from '@/lib/spotify'
import { COLORS, FONTS } from '@/styles/tokens'
import AboutComposed from './AboutComposed'
import HomeWork from './HomeWork'
import Loader from './Loader'
import { NameLayer } from './mac/NameLayer'
import { canRunWebGL2 } from './mac/shared'
import { REEL_SETTLED } from './reelEvent'

/** The machine (three.js and all) comes in its own chunk, after the page. */
const MacHero = dynamic(() => import('./mac/MacHero'), { ssr: false })

/** A GPU that will not compile a shader throws from the machine's effect; the page carries on without it. */
class HeroGuard extends Component<{ children: ReactNode; onFail: () => void }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  componentDidCatch() {
    this.props.onFail()
  }
  render() {
    return this.state.failed ? null : this.props.children
  }
}

/**
 * The first screen. The heading and the painted name are part of the page, so
 * they are up the moment it hydrates; the machine arrives after, in its own
 * chunk, and fades in. If this browser cannot run it (no WebGL2, or it
 * throws), the name is set in type instead and the page goes on, and the nav
 * comes back either way.
 */
function Hero() {
  const [gl, setGl] = useState(true)
  const [leaned, setLeaned] = useState(false)
  useEffect(() => setGl(canRunWebGL2()), [])
  useEffect(() => {
    // no machine to boot: the hero has landed as far as it is going to
    if (!gl) window.dispatchEvent(new CustomEvent(REEL_SETTLED))
  }, [gl])
  return (
    <section className="relative h-[100svh] w-full overflow-hidden select-none" style={{ background: COLORS.bg }}>
      <h1 className="sr-only">Yihan Hong, engineer, and a few other things.</h1>
      <div className="absolute inset-0 transition-opacity duration-700" style={{ opacity: leaned ? 0 : 1 }}>
        <NameLayer mode={gl ? 'paint' : 'type'} />
      </div>
      {gl && (
        <HeroGuard onFail={() => setGl(false)}>
          <MacHero onLean={setLeaned} />
        </HeroGuard>
      )}
    </section>
  )
}

/**
 * The homepage: three movements. The Classic (a compact all-in-one with a
 * working one-bit desktop, beside the name), the about (who, where, what's
 * playing, what was written last), then the work: the year's commit graph and
 * the flagship projects.
 *
 * The arrangement this replaced stacked four sections, each carrying its own
 * `py-24 md:py-32`, so every seam double-padded — ~3,200px of scroll with two
 * gaps large enough to read as the page having ended. It was held together by
 * trimming negative margins onto the rules between sections, which worked, but
 * was four components each correct in isolation being nudged into agreement
 * from outside.
 *
 * Here the whole page below the hero is one component that owns its own
 * internal rhythm, so there are no seams to reconcile and no rules to trim. The
 * hero closes exactly at the fold, and AboutComposed's top padding is the
 * breath underneath it.
 */

const { bg: BG, ink: INK } = COLORS
const FALLBACK_FACE = FONTS.display

export default function Home({
  font,
  nowPlaying = null,
}: {
  font: string
  /** Resolved by the server so the record is never blank on first paint. */
  nowPlaying?: InitialNowPlaying | null
}) {
  // An empty string invalidates the whole `ctx.font` shorthand downstream, and
  // the canvas would silently rasterize its type in 10px system sans.
  const face = font.trim() ? font : FALLBACK_FACE

  return (
    <div className="w-full overflow-x-clip" style={{ backgroundColor: BG, color: INK }}>
      <Loader />
      <Hero />
      <AboutComposed font={face} nowPlaying={nowPlaying} />
      <HomeWork />

      {/* The page exhales instead of stopping — but only a little. AboutComposed
          already carries its own bottom padding, and stacking a tall spacer on
          top of it left a quarter-screen of nothing under the live row. */}
      <div aria-hidden className="h-4 md:h-6" />
    </div>
  )
}

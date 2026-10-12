'use client'

import dynamic from 'next/dynamic'
import { Component, useEffect, type ReactNode } from 'react'

import type { InitialNowPlaying } from '@/lib/spotify'
import { COLORS, FONTS } from '@/styles/tokens'
import AboutComposed from './AboutComposed'
import HomeWork from './HomeWork'
import { REEL_SETTLED } from './reelEvent'

/**
 * The first screen while the Classic's chunk (three.js and all) is on its way:
 * the fold held at full height, so the about does not jump up and back down,
 * and the page's one <h1>. A component loaded with `ssr: false` renders its own
 * heading only in the browser; this one is in the server's HTML.
 */
function HeroShell() {
  return (
    <section className="relative h-[100svh] w-full">
      <h1 className="sr-only">Yihan Hong, engineer, and a few other things.</h1>
    </section>
  )
}

/** What is left if the machine cannot run at all: the name and the line, set in type, where the hero would be. */
function NameOnly() {
  // the hero has landed, as far as it is going to: the nav can come back
  useEffect(() => {
    window.dispatchEvent(new CustomEvent(REEL_SETTLED))
  }, [])
  return (
    <section className="relative flex h-[100svh] w-full items-center">
      <div className="mx-auto w-full max-w-[1100px] px-6">
        <h1 style={{ fontFamily: FONTS.display, fontSize: 'clamp(72px, 13vw, 200px)', lineHeight: 0.98, color: COLORS.ink }}>
          <span style={{ color: COLORS.accent }}>yihan</span>
          <br />
          hong
        </h1>
        <p className="mt-6" style={{ fontFamily: FONTS.display, fontSize: 'clamp(18px, 2vw, 26px)', color: COLORS.inkSoft }}>
          engineer, and a few other things.
        </p>
      </div>
    </section>
  )
}

/** A GPU that will not compile a shader throws from the hero's effect; the page keeps its fold instead of going blank. */
class HeroGuard extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  render() {
    return this.state.failed ? <NameOnly /> : this.props.children
  }
}

const MacHero = dynamic(() => import('./mac/MacHero'), { ssr: false, loading: HeroShell })

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
      <HeroGuard>
        <MacHero />
      </HeroGuard>
      <AboutComposed font={face} nowPlaying={nowPlaying} />
      <HomeWork />

      {/* The page exhales instead of stopping — but only a little. AboutComposed
          already carries its own bottom padding, and stacking a tall spacer on
          top of it left a quarter-screen of nothing under the live row. */}
      <div aria-hidden className="h-4 md:h-6" />
    </div>
  )
}

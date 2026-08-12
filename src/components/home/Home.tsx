'use client'

import type { InitialNowPlaying } from '@/lib/spotify'
import { COLORS, FONTS } from '@/styles/tokens'
import ReelHero from './ReelHero'
import AboutComposed from './AboutComposed'

/**
 * The homepage: two movements.
 *
 * The arrangement this replaced stacked four sections, each carrying its own
 * `py-24 md:py-32`, so every seam double-padded — ~3,200px of scroll with two
 * gaps large enough to read as the page having ended. It was held together by
 * trimming negative margins onto the rules between sections, which worked, but
 * was four components each correct in isolation being nudged into agreement
 * from outside.
 *
 * Here the whole page below the reel is one component that owns its own
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
      <ReelHero font={face} />
      <AboutComposed font={face} nowPlaying={nowPlaying} />

      {/* The page exhales instead of stopping — but only a little. AboutComposed
          already carries its own bottom padding, and stacking a tall spacer on
          top of it left a quarter-screen of nothing under the live row. */}
      <div aria-hidden className="h-4 md:h-6" />
    </div>
  )
}

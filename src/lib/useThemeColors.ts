'use client'

import { useEffect, useState } from 'react'

import { COLORS_DARK, COLORS_LIGHT, THEME_ATTR } from '@/styles/tokens'

/** Same keys as a palette, but plain strings — the palettes are `as const`. */
export type ResolvedColors = Record<keyof typeof COLORS_LIGHT, string>

/**
 * The palette as real colour strings, for anything that cannot take a CSS
 * variable: canvas 2d contexts, and colours embedded in an SVG data: URI.
 *
 * `ctx.fillStyle = 'var(--color-ink)'` does not throw — it is silently ignored
 * and the context keeps its previous fill, so the shape paints in the wrong
 * colour with nothing logged.
 *
 * It resolves via `colorScheme` rather than reading the custom properties back.
 * `getComputedStyle(root).getPropertyValue('--color-bg')` returns the literal
 * string "light-dark(#ffffff, #111315)", not a colour: a custom property
 * computes to its token stream and only substitutes where it is USED. Verified
 * in the browser.
 *
 * COLORS_LIGHT is the SSR seed; there is no document to measure during render.
 */
export function useThemeColors(): ResolvedColors {
  const [colors, setColors] = useState<ResolvedColors>(COLORS_LIGHT)

  useEffect(() => {
    const read = () => {
      // "light dark" is the unset state: nobody has chosen, the system decides.
      const scheme = getComputedStyle(document.documentElement).colorScheme
      const dark =
        scheme === 'dark' ||
        (scheme !== 'light' &&
          window.matchMedia('(prefers-color-scheme: dark)').matches)

      setColors(dark ? COLORS_DARK : COLORS_LIGHT)
    }

    read()

    // Both ways the theme can move: the toggle sets the attribute, and the OS
    // moves the unset state under a reader who never chose. Watching only the
    // attribute leaves every canvas in the old palette after a sunset flip.
    const observer = new MutationObserver(read)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: [THEME_ATTR],
    })

    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    mq.addEventListener('change', read)

    return () => {
      observer.disconnect()
      mq.removeEventListener('change', read)
    }
  }, [])

  return colors
}

'use client'

import { useEffect, useState } from 'react'

import { COLORS, FONTS, THEME_ATTR, THEME_KEY, type Theme } from '@/styles/tokens'

/**
 * Two states, not three. A light/dark/system cycle needs a text label, because
 * "system" has no icon that means anything. "Follow my system" is still the
 * default for anyone who never touches this: no stored choice IS that state.
 *
 * It renders a fixed-size placeholder until mounted. localStorage is unreadable
 * during SSR, so the first render cannot know the theme, and guessing would
 * either mismatch on hydration or show the wrong icon for a frame.
 */
export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme | null>(null)

  useEffect(() => {
    // Read back what the document is rather than re-deriving it, so this and
    // the inline script in layout.tsx cannot disagree.
    const attr = document.documentElement.getAttribute(THEME_ATTR)
    if (attr === 'light' || attr === 'dark') {
      setTheme(attr)
      return
    }
    setTheme(window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
  }, [])

  /* Follow the system until the reader chooses. Without this, an OS flip at
     sunset repaints the page — light-dark() is live — and only the icon lies. */
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = (e: MediaQueryListEvent) => {
      if (document.documentElement.hasAttribute(THEME_ATTR)) return
      setTheme(e.matches ? 'dark' : 'light')
    }
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  const toggle = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    document.documentElement.setAttribute(THEME_ATTR, next)
    try {
      window.localStorage.setItem(THEME_KEY, next)
    } catch {
      // Private mode. Applies for this page view, just will not survive a reload.
    }
  }

  // Same box as the button, so the bar does not reflow when this settles.
  if (theme === null) {
    return <span aria-hidden className="block h-5 w-5" />
  }

  const isDark = theme === 'dark'

  return (
    <button
      type="button"
      onClick={toggle}
      // Says what the button DOES, not what the page currently is.
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      className="block cursor-pointer transition-opacity duration-200 hover:opacity-60"
      style={{ fontFamily: FONTS.mono, color: COLORS.muted }}
    >
      {/* Drawn, not lettered: the bar's other items are words, and a sixth word
          would read as a nav link. `currentColor` so it inherits hover + theme. */}
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        aria-hidden
      >
        {isDark ? (
          // A sun, for the light it switches to.
          <>
            <circle cx="10" cy="10" r="3.6" />
            {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
              <line
                key={deg}
                x1="10"
                y1="2.6"
                x2="10"
                y2="4.6"
                transform={`rotate(${deg} 10 10)`}
              />
            ))}
          </>
        ) : (
          // One path, not a circle with another punched out: a punch-out needs
          // a mask, and a mask needs the hardcoded page colour this removes.
          <path d="M16 12.3A6.8 6.8 0 0 1 7.7 4a6.9 6.9 0 1 0 8.3 8.3Z" />
        )}
      </svg>
    </button>
  )
}

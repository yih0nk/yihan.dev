/**
 * Design tokens — the single source of truth for the site's look.
 *
 * Two display decisions drive everything:
 *   Instrument Serif  for anything that should feel authored (names, titles, pull quotes)
 *   General Sans      for reading (body copy, UI)
 *   Source Code Pro   reserved strictly for metadata: labels, dates, counts, code
 *
 * Colour is deliberately thin — a cool near-white page, near-black ink, one
 * grey, one hairline, and a single accent that only ever signals interaction.
 * Anything that needs more colour than that (the GitHub commit ramp) is an
 * exception that stays quarantined to its own component.
 */

export const FONTS = {
  display: '"Instrument Serif", Georgia, serif',
  body: '"General Sans", ui-sans-serif, system-ui, -apple-system, sans-serif',
  mono: '"Source Code Pro", ui-monospace, SFMono-Regular, Menlo, monospace',
} as const

export const COLORS = {
  /**
   * Near-white, with just enough cool in it to stay paper rather than screen.
   * Was #eceef0, which read as grey against the photographs. Everything moved
   * one step lighter and the old page colour became `surface`, so the raised /
   * inset relationship still holds — surface must stay DARKER than bg here,
   * since the page is light.
   */
  bg: '#f7f8f9',
  surface: '#eceef0',
  ink: '#14161a',
  inkSoft: '#3a3d44',
  /**
   * Was #6b7280, which measures 4.15:1 on `bg` — under the 4.5:1 that WCAG AA
   * asks of normal-size text, and every mono label on the site is normal-size
   * by that definition. #5c626d measures 5.27:1 and is still unmistakably the
   * quiet grey rather than a second ink.
   */
  muted: '#5c626d',
  hairline: 'rgba(20,22,26,0.10)',
  accent: '#2f6bff',
} as const

/** Dark counterparts — same roles, so components can switch on one variable. */
export const COLORS_DARK = {
  bg: '#111315',
  surface: '#191b1e',
  ink: '#e9eaec',
  inkSoft: '#c2c5ca',
  muted: '#8b9098',
  hairline: 'rgba(233,234,236,0.12)',
  accent: '#6b93ff',
} as const

/**
 * Type scale, in px. Display sizes are the top four.
 *
 * 12 is the floor, and it is a hard floor: mono labels were being set at 9 and
 * 10px, which is both off this scale and below the size at which the tracking
 * these labels carry stays readable.
 */
export const TYPE = [12, 14, 16, 18, 24, 32, 48, 72, 112] as const

export const LAYOUT = {
  container: 'max-w-[1100px] mx-auto px-6',
  /** Long-form reading measure. */
  prose: 'max-w-[68ch]',
  /** Vertical rhythm between major sections. */
  section: 'py-24 md:py-32',
  radius: '3px',
} as const

export const MOTION = {
  ui: '200ms',
  reveal: '900ms',
  ease: 'cubic-bezier(0.16, 1, 0.3, 1)',
} as const

/**
 * The name for the event ReelHero fires when its dissolve completes.
 *
 * It lives in its own module so the nav can listen for it without importing
 * ReelHero — which is a 'use client' canvas component the nav has no business
 * pulling into its bundle — and so the two cannot drift apart on a typo, which
 * is the failure mode of a bare string in two files.
 */
export const REEL_SETTLED = 'yh:reel-settled'

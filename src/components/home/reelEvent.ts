/**
 * The name for the event the homepage hero fires when it has landed: the
 * Classic, when its desktop has booted (it was the film reel's, when its
 * dissolve completed, and kept the name).
 *
 * It lives in its own module so the nav can listen for it without importing
 * the hero — a 'use client' WebGL component the nav has no business pulling
 * into its bundle — and so the two cannot drift apart on a typo, which is the
 * failure mode of a bare string in two files.
 */
export const REEL_SETTLED = 'yh:reel-settled'

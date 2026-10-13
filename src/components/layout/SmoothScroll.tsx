"use client";

import Lenis from "lenis";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

/** Quick off the mark and long to settle: the page has a little weight to it. */
const settle = (t: number) => 1 - Math.pow(1 - t, 4);
/** In-page links ease out of the start as well as into the end. */
const glide = (t: number) => (t < 0.5 ? 8 * t ** 4 : 1 - (-2 * t + 2) ** 4 / 2);

/** The live instance, if any, and whether something has asked the page to hold still. */
let current: Lenis | null = null;
let held = false;

/**
 * Hold the page still (the homepage loader does, while it is up). Lenis moves
 * the page with scrollTo, which `overflow: hidden` does not stop, so it has to
 * be told.
 */
export function holdScroll(on: boolean) {
  held = on;
  if (on) current?.stop();
  else current?.start();
}

/**
 * The wheel, smoothed (Lenis). A notch of the wheel becomes a short glide
 * instead of a jump; touch is left to the phone, which already does this
 * better, and reduced motion gets the browser's own scroll, untouched.
 *
 * Lenis moves the real scroll position, so everything that watches the page
 * (the Mac's on-demand render, the reveals) sees ordinary scroll events. A
 * route change kills any glide still running, or it would
 * carry on down the page that was just arrived at.
 */
export default function SmoothScroll() {
  const pathname = usePathname();
  const lenis = useRef<Lenis | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => {
      if (mq.matches) {
        lenis.current?.destroy();
        lenis.current = current = null;
      } else if (!lenis.current) {
        lenis.current = new Lenis({
          autoRaf: true,
          duration: 0.9,
          easing: settle,
          smoothWheel: true,
          anchors: { duration: 1.1, easing: glide },
        });
        current = lenis.current;
        if (held) current.stop();
      }
    };
    sync();
    mq.addEventListener("change", sync);
    return () => {
      mq.removeEventListener("change", sync);
      lenis.current?.destroy();
      lenis.current = current = null;
    };
  }, []);

  useEffect(() => {
    const l = lenis.current;
    if (!l) return;
    l.scrollTo(window.scrollY, { immediate: true, force: true });
    l.resize();
  }, [pathname]);

  return null;
}

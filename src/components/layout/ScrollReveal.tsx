"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * Sections fade up into place as they scroll into view, once each.
 *
 * Mark an element `data-reveal` (and give it `--reveal-delay` to stagger a
 * row); this watches every one on the page and sets `data-revealed` when it
 * first comes into view. The look is CSS (globals.css). Before any of it runs,
 * a blocking script in the layout's <head> puts `js-reveal` on <html>, which is
 * what hides the waiting elements, so a page without JavaScript shows
 * everything and a page with it never flashes content before hiding it. If
 * this never runs at all, a CSS fallback shows everything after a moment.
 *
 * A route change brings new elements, so the watch is re-armed per path.
 */
export default function ScrollReveal() {
  const pathname = usePathname();

  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]:not([data-revealed])"));
    if (!els.length) return;
    if (!("IntersectionObserver" in window)) {
      els.forEach((el) => el.setAttribute("data-revealed", ""));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          e.target.setAttribute("data-revealed", "");
          io.unobserve(e.target);
        }
      },
      // a little before it is fully in, so nothing is caught mid-fade at the edge
      { rootMargin: "0px 0px -6% 0px", threshold: 0.08 },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [pathname]);

  return null;
}

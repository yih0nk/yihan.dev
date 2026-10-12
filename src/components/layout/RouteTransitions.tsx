"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useLayoutEffect, useRef } from "react";

/**
 * Page changes as a cross-fade: the page you leave fades out, the one you
 * arrive at fades up into place, and the nav stays where it is.
 *
 * It is the browser's View Transitions API, which the app router does not
 * drive by itself: a click on an internal link is caught here (capture phase,
 * so it beats the Link's own handler, which stands down on a prevented
 * event), and the navigation runs inside `document.startViewTransition`. The
 * transition's update callback is a promise that settles when the new path
 * has actually rendered, which is what lets the browser snapshot the new page
 * rather than the old one twice. A navigation that never lands releases it
 * after a few seconds, so the page can never stay frozen in a snapshot.
 *
 * Left alone: modified clicks, other tabs, downloads, other origins, mailto,
 * same-page anchors, reduced motion, and browsers without the API (they just
 * navigate, as before). The animation itself is CSS, in globals.css.
 */
export default function RouteTransitions() {
  const router = useRouter();
  const pathname = usePathname();
  const settle = useRef<(() => void) | null>(null);

  // the new path has rendered: let the browser take its snapshot
  useLayoutEffect(() => {
    settle.current?.();
    settle.current = null;
  }, [pathname]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if (!("startViewTransition" in document) || document.visibilityState !== "visible") return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const a = (e.target as Element | null)?.closest?.("a");
      if (!a || !a.href || a.hasAttribute("download") || (a.target && a.target !== "_self")) return;
      const url = new URL(a.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname) return; // an anchor on this page, or the page itself
      e.preventDefault();
      const href = url.pathname + url.search + url.hash;
      type Transition = { ready: Promise<void>; finished: Promise<void>; updateCallbackDone: Promise<void> };
      const t = (document as Document & { startViewTransition: (cb: () => Promise<void>) => Transition }).startViewTransition(
        () =>
          new Promise<void>((resolve) => {
            settle.current = resolve;
            window.setTimeout(resolve, 3000);
            router.push(href);
          }),
      );
      // the browser may skip the animation (a tab sent to the back mid-way); the
      // navigation happens regardless, so a skipped transition is not an error
      for (const p of [t.ready, t.finished, t.updateCallbackDone]) p.catch(() => {});
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [router]);

  return null;
}

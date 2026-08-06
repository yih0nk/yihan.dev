"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import SiteViewCounter from "@/components/ui/SiteViewCounter";
import { COLORS, FONTS } from "@/styles/tokens";
import { REEL_SETTLED } from "@/components/home/reelEvent";

/**
 * The nav, on the token system.
 *
 * Four things changed, and each of them was making the chrome disagree with the
 * page it sits on:
 *
 *   - The wordmark was mono. It is a NAME, so it takes the display face —
 *     tokens.ts reserves mono strictly for metadata, and "yihan" is the least
 *     metadata-ish string on the site.
 *   - The links were mono too, and mono is not a UI face here. They move to the
 *     body face at 14px, still lowercase, muted until hover.
 *   - The container was 1400px against every page's 1100, so the chrome never
 *     lined up with the content beneath it.
 *   - The active state was a hand-drawn wobbling SVG underline, which belongs to
 *     the old sketch look. The new system draws precise hairlines, so it is one.
 *
 * The scrolled background is the page colour rather than white, or the bar
 * would read as a white shelf floating over the page colour.
 *
 * THE BAR DOES NOT OFFSET THE DOCUMENT. It is fixed, and <main> no longer
 * carries a matching pt-16 — each page clears `--nav-h` itself. That is what
 * lets a full-bleed page run underneath the bar instead of having 64px of dead
 * space forced on it, which is exactly what the reel hero needs: its chrome bar
 * sits at the bottom of a 100vh section, and an offsetting nav pushed it below
 * the fold. Height is read from the same variable the pages clear.
 */

/**
 * /about and /contact are gone, not merely unlinked.
 *
 * The homepage opens with the photograph, the intro and the closing line, which
 * is everything /about had to say and says it first — the route was a second,
 * weaker telling of the same thing. /contact was five links, and all five sit
 * in the footer of every page, so a whole route existed to hold what the bottom
 * of the screen already holds.
 *
 * /hobbies is /play. "Hobbies" is what you call someone else's interests; the
 * page is about piano, sax, painting, photographs and badminton, and none of
 * those are a hobby to the person doing them.
 */
const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/projects", label: "Projects" },
  { href: "/experience", label: "Experience" },
  { href: "/play", label: "Play" },
  { href: "/blog", label: "Blog" },
];

export default function Nav() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  /**
   * The homepage opens on the reel, which is a title sequence — a bar floating
   * over it is exactly the chrome that hero is built to do without. So on `/`
   * it waits, and comes back the moment the ASCII name lands.
   *
   * It listens for ReelHero's settle event rather than watching scroll. Scroll
   * position is a proxy and it was wrong in the common case: the reel resolves
   * itself after six idle seconds, so a visitor who simply waits gets the name
   * with no bar until they scroll, which is the opposite of the intent.
   *
   * ONE WAY, like the reel. `setResolved(true)` latches — scrolling back up to
   * the name does not take the bar away again. A bar that comes and goes on one
   * page is a bar you cannot rely on, and by then the payoff is already spent.
   *
   * Route changes remount this, which is what resets the latch.
   */
  const isHome = pathname === "/";
  const [resolved, setResolved] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const onSettled = () => setResolved(true);
    window.addEventListener(REEL_SETTLED, onSettled);
    return () => window.removeEventListener(REEL_SETTLED, onSettled);
  }, []);

  const hidden = isHome && !resolved;

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  return (
    <>
      <header
        // Hidden means hidden: not just transparent. `pointer-events-none`
        // stops it swallowing clicks over the reel — which is draggable — and
        // inert takes its links out of the tab order so keyboard focus does not
        // land on something nobody can see.
        inert={hidden || undefined}
        className={cn(
          "fixed top-0 right-0 left-0 z-50 transition-[opacity,transform,background-color] duration-300",
          scrolled ? "backdrop-blur-sm" : "bg-transparent",
          hidden && "pointer-events-none -translate-y-2 opacity-0",
        )}
        style={
          scrolled
            ? { backgroundColor: "rgba(247,248,249,0.95)", borderBottom: `1px solid ${COLORS.hairline}` }
            : undefined
        }
      >
        <nav className="mx-auto flex h-[var(--nav-h)] max-w-[1100px] items-center justify-between px-6">
          <Link href="/" className="group flex items-center gap-2">
            <span
              className="text-[24px] leading-none"
              style={{ fontFamily: FONTS.display, color: COLORS.ink }}
            >
              yihan
            </span>
          </Link>

          <ul className="hidden items-center gap-8 md:flex">
            {NAV_LINKS.filter((l) => l.href !== "/").map((link) => (
              <li key={link.href}>
                <NavLink href={link.href} active={pathname === link.href}>
                  {link.label}
                </NavLink>
              </li>
            ))}
            <li>
              <SiteViewCounter />
            </li>
          </ul>

          <button
            className="z-50 flex flex-col gap-1.5 p-2 md:hidden"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
          >
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className={cn(
                  "block h-0.5 w-6 transition-all duration-200",
                  menuOpen && i === 0 && "translate-y-2 rotate-45",
                  menuOpen && i === 1 && "opacity-0",
                  menuOpen && i === 2 && "-translate-y-2 -rotate-45",
                )}
                style={{ backgroundColor: menuOpen ? COLORS.bg : COLORS.ink }}
              />
            ))}
          </button>
        </nav>
      </header>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 flex flex-col items-center justify-center md:hidden"
            style={{ backgroundColor: COLORS.ink }}
          >
            <ul className="flex flex-col items-center gap-8">
              {NAV_LINKS.map((link) => (
                <motion.li
                  key={link.href}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{ duration: 0.2 }}
                >
                  <Link
                    href={link.href}
                    className={cn(
                      "text-[32px] lowercase transition-opacity duration-200 hover:opacity-70",
                      pathname === link.href && "underline underline-offset-[6px]",
                    )}
                    style={{ fontFamily: FONTS.display, color: COLORS.bg }}
                  >
                    {link.label}
                  </Link>
                </motion.li>
              ))}
              <motion.li
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.2 }}
                className="[&_span]:text-[12px] [&_span]:opacity-60"
              >
                <SiteViewCounter />
              </motion.li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function NavLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="relative text-[14px] lowercase transition-colors duration-200 hover:text-[var(--color-ink)]"
      style={{
        fontFamily: `var(--font-body, ${FONTS.body})`,
        color: active ? COLORS.ink : COLORS.muted,
      }}
    >
      {children}
      {active && (
        <span
          aria-hidden
          className="absolute -bottom-1.5 left-0 block h-px w-full"
          style={{ backgroundColor: COLORS.ink }}
        />
      )}
    </Link>
  );
}

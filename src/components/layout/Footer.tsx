import Link from "next/link";

import { COLORS, FONTS } from "@/styles/tokens";

/**
 * The footer, on the token system.
 *
 * What it was: Tailwind's `gray-400` (#99a1af) on a white page — 2.60:1, well
 * under the 4.5:1 WCAG AA floor, and materially worse than the 4.15:1 that
 * tokens.ts already records as too low. It also had the type roles backwards,
 * setting the one long sentence in mono and the five short labels in the body
 * face, and it sat in a 1400px container while every page sits in 1100.
 *
 * The rule is kept: this is the bottom of the document and the hairline is what
 * closes it. Hierarchy inside the footer still comes from size and space.
 */
const SOCIAL_LINKS = [
  { href: "/resume", label: "resume" },
  { href: "https://github.com/yih0nk", label: "github" },
  { href: "https://x.com/yihanhon", label: "x" },
  { href: "https://linkedin.com/in/yihan-hon", label: "linkedin" },
  { href: "mailto:yihanhon@usc.edu", label: "email" },
];

export default function Footer() {
  return (
    <footer className="mt-16" style={{ borderTop: `1px solid ${COLORS.hairline}` }}>
      <div className="mx-auto flex max-w-[1100px] flex-col items-center justify-between gap-5 px-6 py-10 md:flex-row">
        <p
          className="text-[14px]"
          style={{ fontFamily: `var(--font-body, ${FONTS.body})`, color: COLORS.muted }}
        >
          © {new Date().getFullYear()} yihan hong · built with next.js and too much coffee.
        </p>

        <nav>
          <ul className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            {SOCIAL_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  target={link.href.startsWith("http") ? "_blank" : undefined}
                  rel={link.href.startsWith("http") ? "noopener noreferrer" : undefined}
                  className="text-[12px] tracking-[0.18em] uppercase transition-colors duration-200 hover:text-[var(--color-ink)] focus-visible:text-[var(--color-ink)]"
                  style={{ fontFamily: FONTS.mono, color: COLORS.muted }}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </footer>
  );
}

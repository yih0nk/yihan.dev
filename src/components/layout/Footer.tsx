import Link from "next/link";

import FooterDog from "@/components/decor/FooterDog";
import { EMAIL, GITHUB_URL, LINKEDIN_URL, X_URL } from "@/lib/site";
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
 * No rule on top. The hairline used to be what closed the page; the dog does
 * that now, and the line only cut the page's background off in a hard edge.
 * Hierarchy inside the footer still comes from size and space.
 */
/**
 * The URLs come from src/lib/site.ts rather than being typed here. They were
 * typed here, and this file's LinkedIn disagreed with that module's while its X
 * link disagreed the other way — so one of the five links below was dead and
 * the machine-readable copy of the same list was wrong in a different place.
 * One definition, three consumers: this, the JSON-LD `sameAs`, and llms.txt.
 */
const SOCIAL_LINKS = [
  { href: "/resume", label: "resume" },
  { href: GITHUB_URL, label: "github" },
  { href: X_URL, label: "x" },
  { href: LINKEDIN_URL, label: "linkedin" },
  { href: `mailto:${EMAIL}`, label: "email" },
];

export default function Footer() {
  return (
    <footer>
      {/*
        Copyright over links on the left, the dog on the right, with room to
        breathe above and below it. The dog sets the footer's height.
      */}
      <div className="mx-auto flex max-w-[1100px] flex-col items-center gap-6 px-6 py-8 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col items-center gap-3 md:items-start">
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

        <FooterDog className="self-end md:self-auto" />
      </div>
    </footer>
  );
}

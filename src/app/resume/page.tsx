import type { Metadata } from "next";
import Link from "next/link";

import ResumeGate from "@/components/ui/ResumeGate";
import { COLORS, FONTS, LAYOUT } from "@/styles/tokens";

export const metadata: Metadata = {
  title: "Resume",
  description: "Password-protected resume.",
  robots: { index: false, follow: false },
};

/**
 * The résumé gate, set like the rest of the site.
 *
 * The h1 was "resume." at 48px in Source Code Pro — the metadata face, with a
 * full stop after it — and Instrument Serif appeared nowhere on the page. It
 * also had no header rule, so it was the one page that started with a heading
 * floating in space rather than under a label.
 *
 * The rule points back at /experience, which is the page that links here. A
 * gate is a dead end otherwise: there is nothing else on it, and a visitor
 * without the password should not have to reach for the browser's back button.
 */
export default function ResumePage() {
  return (
    <div className={`${LAYOUT.container} pt-[calc(var(--nav-h)+5rem)] pb-24 md:pb-32`}>
      <div
        className="flex items-baseline justify-between gap-6 border-b pb-3 text-[12px] uppercase tracking-[0.18em]"
        style={{
          fontFamily: FONTS.mono,
          color: COLORS.muted,
          borderColor: COLORS.hairline,
        }}
      >
        <span>résumé</span>
        <Link href="/experience" className="hover:underline underline-offset-4">
          ← experience
        </Link>
      </div>

      <header className="mt-10 md:mt-14">
        <h1
          className="text-5xl leading-[0.95] tracking-[-0.02em] md:text-7xl"
          style={{ fontFamily: FONTS.display }}
        >
          résumé
        </h1>
        <p
          className="mt-5 max-w-[54ch] text-base leading-relaxed md:mt-6 md:text-lg"
          style={{ fontFamily: FONTS.body, color: COLORS.muted }}
        >
          This one&apos;s behind a password. If you need it and don&apos;t have
          it, just{" "}
          <a
            href="mailto:yihanhon@usc.edu"
            className="underline underline-offset-4"
            style={{ color: COLORS.accent }}
          >
            email me
          </a>
          .
        </p>
      </header>

      <section className="mt-12 md:mt-16">
        <ResumeGate />
      </section>
    </div>
  );
}

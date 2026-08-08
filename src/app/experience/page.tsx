import type { Metadata } from "next";
import Link from "next/link";

import TimeAxis from "@/components/experience/TimeAxis";
import { EDUCATION, ROLES, SKILLS, formatSpan } from "@/lib/experience";
import { COLORS, FONTS, LAYOUT } from "@/styles/tokens";

export const metadata: Metadata = {
  title: "Experience",
  description: "Education, experience, and skills.",
};

/**
 * Experience, on the system the rest of the site is on.
 *
 * This page had none of it: the h1 was 48px of Source Code Pro, every role
 * title was mono bold, Instrument Serif appeared on zero elements, and the
 * skills section was fifty-three bordered pills — the loudest thing on the page
 * carrying the least important information, which is the same mistake the
 * projects card grid made. Sixty elements were still on legacy gray-* classes,
 * and the top padding was 80px where every other page clears the nav with 144.
 *
 * It also drew its five roles as evenly spaced rows, which is the thing the
 * rebuild is really for. See TimeAxis.
 *
 * `now` is resolved here, once, and passed down. A `new Date()` inside the
 * client component would be evaluated again on mount and disagree with the
 * server's value the moment a month rolls over — a hydration mismatch that
 * cannot be reproduced on the day you write it.
 */
export const revalidate = 86400; // the `now` marker only needs day resolution

export default function ExperiencePage() {
  const d = new Date();
  const now: [number, number] = [d.getUTCFullYear(), d.getUTCMonth() + 1];

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
        <span>experience</span>
        <Link href="/resume" className="hover:underline underline-offset-4">
          résumé →
        </Link>
      </div>

      <header className="mt-10 md:mt-14">
        <h1
          className="text-5xl leading-[0.95] tracking-[-0.02em] md:text-7xl"
          style={{ fontFamily: FONTS.display }}
        >
          experience
        </h1>
        <p
          className="mt-5 max-w-[54ch] text-base leading-relaxed md:mt-6 md:text-lg"
          style={{ fontFamily: FONTS.body, color: COLORS.muted }}
        >
          Drawn to scale, so the overlaps are visible — since the start of 2026
          there have been two or three of these running at once.
        </p>
      </header>

      <section className="mt-16 md:mt-20">
        <TimeAxis roles={ROLES} now={now} />
      </section>

      {/* ── education ────────────────────────────────────────────────────── */}
      <section className="mt-20 md:mt-24">
        <h2
          className="border-t pt-8 text-[32px] leading-none tracking-[-0.01em]"
          style={{ fontFamily: FONTS.display, color: COLORS.ink, borderColor: COLORS.hairline }}
        >
          education
        </h2>

        {/*
          Education keeps its own block rather than joining the axis above. Its
          span runs to May 2028, so putting it on the same scale would stretch
          the axis two years into the future and squash every role into the left
          third of it to accommodate a bar that is mostly a prediction.
        */}
        <div className="mt-8 md:grid md:grid-cols-12 md:gap-8">
          <p
            className="text-[12px] tracking-[0.14em] md:col-span-3"
            style={{ fontFamily: FONTS.mono, color: COLORS.muted }}
          >
            {formatSpan(EDUCATION)}
          </p>

          <div className="mt-3 md:col-span-9 md:mt-0">
            <h3
              className="text-2xl leading-tight tracking-[-0.01em]"
              style={{ fontFamily: FONTS.display }}
            >
              {EDUCATION.org}
            </h3>
            <p
              className="mt-1 text-base"
              style={{ fontFamily: FONTS.body, color: COLORS.inkSoft }}
            >
              {EDUCATION.title}
            </p>
            <p
              className="mt-1 text-[12px] tracking-[0.08em]"
              style={{ fontFamily: FONTS.mono, color: COLORS.muted }}
            >
              {EDUCATION.location}
            </p>

            {/*
              Honours and coursework were one undifferentiated bullet list, with
              "Viterbi Scholar Award · Director's Scholarship · 2× Dean's List"
              sitting above "Algorithms" as though they were the same kind of
              fact. They are separated now, and the courses are set as one line
              rather than eight bullets.
            */}
            {EDUCATION.honours && (
              <p
                className="mt-6 text-base"
                style={{ fontFamily: FONTS.body, color: COLORS.inkSoft }}
              >
                {EDUCATION.honours.join(" · ")}
              </p>
            )}

            {EDUCATION.courses && (
              <>
                <h4
                  className="mt-6 text-[12px] uppercase tracking-[0.18em]"
                  style={{ fontFamily: FONTS.mono, color: COLORS.muted }}
                >
                  coursework
                </h4>
                <p
                  className="mt-3 max-w-[68ch] text-[14px] leading-loose tracking-[0.02em]"
                  style={{ fontFamily: FONTS.mono, color: COLORS.inkSoft }}
                >
                  {EDUCATION.courses.join("  ·  ")}
                </p>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ── skills ───────────────────────────────────────────────────────── */}
      <section className="mt-20 md:mt-24">
        <h2
          className="border-t pt-8 text-[32px] leading-none tracking-[-0.01em]"
          style={{ fontFamily: FONTS.display, color: COLORS.ink, borderColor: COLORS.hairline }}
        >
          skills
        </h2>

        {/*
          Fifty-three bordered pills, gone. A pill is a box drawn around a word
          to make it look like a component, and fifty-three of them made the
          least important section the loudest thing on the page. Set as text on
          a labelled grid it reads faster and takes a fraction of the height.
        */}
        <dl className="mt-8 space-y-6">
          {SKILLS.map((group) => (
            <div key={group.category} className="md:grid md:grid-cols-12 md:gap-8">
              <dt
                className="text-[12px] uppercase tracking-[0.18em] md:col-span-3"
                style={{ fontFamily: FONTS.mono, color: COLORS.muted }}
              >
                {group.category}
              </dt>
              <dd
                className="mt-2 text-[14px] leading-loose tracking-[0.02em] md:col-span-9 md:mt-0"
                style={{ fontFamily: FONTS.mono, color: COLORS.inkSoft }}
              >
                {group.items.join("  ·  ")}
              </dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}

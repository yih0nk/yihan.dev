import type { Metadata } from "next";
import Image from "next/image";
import AudioPlayer from "@/components/ui/AudioPlayer";
import OnRotation from "@/components/play/OnRotation";
import Rally from "@/components/play/Rally";
import { COLORS, FONTS, LAYOUT } from "@/styles/tokens";

export const metadata: Metadata = {
  title: "Play",
  description: "What Yihan does when not coding — music, art, photography, badminton.",
};

/**
 * /play, on the system the rest of the site is on.
 *
 * What it was: an h1 and four h2s all set in Source Code Pro — the mono face is
 * reserved for metadata, so five headings in it were five bugs — a hand-rolled
 * container instead of LAYOUT.container, no header rule, three wobbly SVG
 * dividers, nine legacy palette classes, a bordered button for the one outbound
 * link, and six photographs squeezed into identical bordered squares.
 *
 * The square grid was the worst of it. Six artworks at three different aspect
 * ratios, all cropped to the same box and boxed again in a border, is a card
 * grid pretending to be a gallery: it flattens the only thing that varies. They
 * now run at their true proportions down a multi-column sheet.
 *
 * ── the title block has no <header> wrapper, deliberately ────────────────────
 * /experience and ProjectsIndex both wrap their title block in one. Adding it
 * here would push every line of the h1 and the dek two spaces to the right, and
 * the copy on this page is being rewritten separately — a re-indent would show
 * up as a changed prose line in the diff for no visual gain. The pattern that
 * matters is the rule, the sizes and the spacing, and those are reproduced
 * exactly; the h1 carries its own `mt-10 md:mt-14`, which is how ProjectsIndex
 * sets it anyway.
 */

/**
 * Intrinsic dimensions, measured with `sips`, not guessed. They are what lets
 * Next reserve the right box before the bytes land, so a column of six images
 * at three different shapes settles without a single layout shift.
 *
 * These were `unoptimized`, which shipped all 12.8 MB of originals — two of
 * them 4.6 and 4.3 MB — as six thumbnails. Dropping that flag puts them through
 * the optimizer, which resizes to the `sizes` hint below and serves webp.
 *
 * `w` breaks the column's own edge: at equal column widths the images would
 * align into a grid again, which is the thing this layout exists to avoid. The
 * values are fixed rather than random — a random width would differ between the
 * server render and the client and blow up hydration.
 *
 * Three, not six. The set was cut on the owner's call, and it happens to remove
 * both 4032x3024 frames, so what is left is one shape at one aspect ratio and
 * the varied widths are now the only thing keeping the sheet ragged.
 */
const artImages = [
  { src: "/images/IMG_1630.jpg", width: 1636, height: 2181, w: "100%", pull: false },
  { src: "/images/IMG_2089.jpg", width: 1636, height: 2181, w: "88%", pull: true },
  { src: "/images/IMG_9513.jpg", width: 1636, height: 2181, w: "94%", pull: false },
];

const RULE = "flex items-baseline justify-between gap-6 border-b pb-3 text-[12px] uppercase tracking-[0.18em]";
const HEADING = "border-t pt-8 text-[32px] leading-none tracking-[-0.01em]";
/**
 * Reading copy: one face, one colour, set once on the wrapper so the paragraphs
 * inside stay bare.
 *
 * No measure cap. A 68ch column inside a 1052px frame stops ~280px short of the
 * edge everything else on the page aligns to, which reads as an indent nobody
 * asked for rather than as a reading measure. /projects/[slug] made the same
 * call for the same reason. It is affordable here because no section runs past
 * three short paragraphs.
 */
const PROSE = "mt-8 space-y-4 text-base leading-relaxed md:text-lg";

export default function PlayPage() {
  const proseStyle = { fontFamily: FONTS.body, color: COLORS.inkSoft };
  const headingStyle = {
    fontFamily: FONTS.display,
    color: COLORS.ink,
    borderColor: COLORS.hairline,
  };

  return (
    <div className={`${LAYOUT.container} pt-[calc(var(--nav-h)+5rem)] pb-24 md:pb-32`}>
      {/* The same header rule /experience and /projects open with. The right
          slot is a count of what is actually below it. */}
      <div
        className={RULE}
        style={{
          fontFamily: FONTS.mono,
          color: COLORS.muted,
          borderColor: COLORS.hairline,
        }}
      >
        <span>play</span>
        <span>04 things</span>
      </div>

      <h1
        className="mt-10 text-5xl leading-[0.95] tracking-[-0.02em] md:mt-14 md:text-7xl"
        style={{ fontFamily: FONTS.display }}
      >
        play
      </h1>
      {/* No measure cap: at 54ch this broke across two lines, and it is one
          sentence with a joke in it — a line break lands the punchline on its
          own line. It fits the frame comfortably at 18px. */}
      <p
        className="mt-5 text-base leading-relaxed md:mt-6 md:text-lg"
        style={{ fontFamily: FONTS.body, color: COLORS.muted }}
      >
        I write code from 9 to 5 (okay, 9 to 2 AM). Here&apos;s what I do
        with the other hours.
      </p>

      {/* Music */}
      <section id="music" className="mt-16 md:mt-20">
        <h2 className={HEADING} style={headingStyle}>
          music
        </h2>
        <div className={PROSE} style={proseStyle}>
          <p>
            Fifteen years of piano, three of tenor sax. Piano is where I learned
            harmony: chords, voicings, what&apos;s actually holding a song up.
            The sax I&apos;m still bad at, which is most of the fun.
          </p>
          <p>
            I&apos;ll listen to anything. Jazz, rock, indie pop, rap, hip-hop,
            R&amp;B, soul, classical.
          </p>
          {/* The names that used to be typed here now come from Spotify. The
              component owns the "On repeat lately:" label too, so the whole
              sentence disappears together if the API cannot answer. */}
          <OnRotation />
        </div>
        <p className="mt-10 text-base leading-relaxed" style={{ fontFamily: FONTS.body, color: COLORS.muted }}>and here are some not so perfect tunes.</p>

        <div className="mt-6">
          <AudioPlayer
            tracks={[
              { src: "/audio/piece-01.mp3" },
              { src: "/audio/piece-02.mp3" },
              { src: "/audio/piece-03.mp3" },
            ]}
          />
        </div>
      </section>

      {/* Visual Art */}
      <section id="art" className="mt-20 md:mt-24">
        <h2 className={HEADING} style={headingStyle}>
          art
        </h2>
        <div className={PROSE} style={proseStyle}>
          <p>
            Oil painting and pencil sketching. The oils are all mixing,
            layering, and waiting for things to dry. Sketching is just a pen. I
            like both. Unfortunately none of my oil work exists in my camera
            roll right now, so everything below is sketches.
          </p>
        </div>

        {/*
          A contact sheet, not a grid. Multi-column gives every image its own
          natural height for free; the per-image width above breaks the column
          edge so the result stays ragged.

          On alt text: `alt="Artwork 3"` was here, which tells a screen-reader
          user nothing at all. Each image is presentational instead, and the set
          carries one accurate name. The name can now say "sketches" rather than
          hedging with "paintings and sketches", because the copy above confirms
          none of the oil work is in this set. Swap in real per-image alt text
          when someone who can see them writes it.
        */}
        <ul
          className="mt-10 columns-2 gap-x-6 md:columns-3 md:gap-x-8"
          aria-label="sketches"
        >
          {artImages.map((img) => (
            <li
              key={img.src}
              className="mb-6 break-inside-avoid md:mb-8"
              style={{ width: img.w, marginLeft: img.pull ? "auto" : undefined }}
            >
              <Image
                src={img.src}
                alt=""
                width={img.width}
                height={img.height}
                sizes="(min-width: 1100px) 340px, (min-width: 768px) 31vw, 46vw"
                className="h-auto w-full"
              />
            </li>
          ))}
        </ul>
      </section>

      {/* Photography */}
      <section id="photography" className="mt-20 md:mt-24">
        <h2 className={HEADING} style={headingStyle}>
          photography
        </h2>
        <div className={PROSE} style={proseStyle}>
          <p>
            Mostly on my phone, occasionally on something better. Sunsets,
            streets, people I like. Nothing with a theme.
          </p>
          <p>Everything&apos;s on Instagram.</p>
        </div>
        {/* Was a bordered button that inverted to solid black. One accent,
            interaction only — so it is text, the way the project links are. */}
        <a
          href="https://www.instagram.com/yih0nk/"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-8 inline-flex items-baseline gap-1.5 text-[12px] tracking-[0.08em] underline-offset-4 hover:underline"
          style={{ fontFamily: FONTS.mono, color: COLORS.accent }}
        >
          follow on instagram <span aria-hidden>→</span>
        </a>
      </section>

      {/* Badminton */}
      <section id="badminton" className="mt-20 md:mt-24">
        <h2 className={HEADING} style={headingStyle}>
          badminton
        </h2>
        <div className={PROSE} style={proseStyle}>
          <p>
            Seven years. Competed provincially in Ontario, won gold in doubles,
            and now play recreationally. Which has never once stopped me
            celebrating a good smash like I just won the Olympics at a casual
            game in the rec centre.
          </p>
        </div>
        <Rally />
      </section>
    </div>
  );
}

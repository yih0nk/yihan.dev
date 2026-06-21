import type { Metadata } from "next";
import Image from "next/image";
import PageTransition from "@/components/layout/PageTransition";
import HandDrawnDivider from "@/components/ui/HandDrawnDivider";
import AudioPlayer from "@/components/ui/AudioPlayer";

export const metadata: Metadata = {
  title: "Hobbies",
  description: "What Yihan does when not coding — music, art, photography, badminton.",
};

const artImages = [
  "/images/IMG_1630.jpg",
  "/images/IMG_2089.jpg",
  "/images/IMG_4626.jpg",
  "/images/IMG_4924.JPG",
  "/images/IMG_5028.jpg",
  "/images/IMG_9513.jpg",
];

export default function HobbiesPage() {
  return (
    <PageTransition>
      <div className="max-w-[800px] mx-auto px-6 py-20">
        <h1
          className="text-4xl md:text-5xl mb-4 lowercase"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          hobbies.
        </h1>
        <p className="text-gray-500 mb-16 leading-relaxed lowercase">
          I write code from 9 to 5 (okay, 9 to 2 AM). Here&apos;s what I do
          with the other hours.
        </p>

        {/* Music */}
        <section id="music" className="mb-16">
          <h2 className="text-2xl mb-6" style={{ fontFamily: "var(--font-mono)" }}>
            keys &amp; reeds
          </h2>
          <div className="text-gray-600 leading-relaxed space-y-4 mb-6">
            <p>
              I play piano and tenor saxophone — two instruments that have almost
              nothing in common except that they both sound terrible when
              you&apos;re learning and incredible once you&apos;re not.
            </p>
            <p>
              Piano came first. It&apos;s how I think about harmony and structure
              — chords, voicings, the math underneath the music. Tenor sax came
              later and taught me something different: how to breathe, how to
              phrase, how to make one note say more than twenty.
            </p>
            <p>
              I love all genres of music — Jazz, Rock, Indie Pop, Rap, Hip-Hop,
              R&amp;B, Soul, and Classical. Some favourites: Matt Maltese, The
              1975, Radiohead, Sade, and MF Doom.
            </p>
            <p className="text-sm text-gray-400">
              Piano: 15 years and counting &nbsp;·&nbsp; Sax: 3 years and counting
            </p>
          </div>
          <p className="text-gray-500 text-sm mb-4">and here are some not so perfect tunes.</p>

          <AudioPlayer
            tracks={[
              { src: "/audio/piece-01.mp3" },
              { src: "/audio/piece-02.mp3" },
              { src: "/audio/piece-03.mp3" },
            ]}
          />
        </section>

        <HandDrawnDivider />

        {/* Visual Art */}
        <section id="art" className="my-16">
          <h2 className="text-2xl mb-6" style={{ fontFamily: "var(--font-mono)" }}>
            ink &amp; paint
          </h2>
          <div className="text-gray-600 leading-relaxed space-y-4 mb-8">
            <p>
              I do oil painting and pencil/ink sketching. Oil painting is slow
              and deliberate — mixing colors, building layers, waiting for things
              to dry. Sketching is the opposite — fast, instinctive, just a pen
              and whatever comes out.
            </p>
            <p>I like having both.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {artImages.map((src, i) => (
              <div key={i} className="aspect-square overflow-hidden border border-gray-100 bg-gray-50">
                <Image
                  src={src}
                  alt={`Artwork ${i + 1}`}
                  width={400}
                  height={400}
                  unoptimized
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                />
              </div>
            ))}
          </div>
        </section>

        <HandDrawnDivider />

        {/* Photography */}
        <section id="photography" className="my-16">
          <h2 className="text-2xl mb-6" style={{ fontFamily: "var(--font-mono)" }}>
            light &amp; frame
          </h2>
          <div className="text-gray-600 leading-relaxed space-y-4 mb-8">
            <p>
              Photography is how I practice seeing. It&apos;s the same muscle as
              design — noticing composition, contrast, the way light falls on
              ordinary things and makes them worth a second look.
            </p>
            <p>
              I shoot anything and everything that I cherish. That can be a
              beautiful sunset, a busy street, or a loved one.
            </p>
          </div>
          <a
            href="https://www.instagram.com/yih0nk/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 border border-black px-4 py-2 text-sm hover:bg-black hover:text-white transition-colors"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            follow on instagram →
          </a>
        </section>

        <HandDrawnDivider />

        {/* Badminton */}
        <section id="badminton" className="mt-16">
          <h2 className="text-2xl mb-6" style={{ fontFamily: "var(--font-mono)" }}>
            smash &amp; clear
          </h2>
          <div className="text-gray-600 leading-relaxed space-y-4">
            <p>
              I play badminton competitively. And by &quot;competitively&quot; I mean I
              will absolutely celebrate a good smash like I just won the Olympics,
              even if it&apos;s a casual game at the rec center.
            </p>
            <p>
              It&apos;s the fastest racquet sport in the world — shuttlecocks can
              travel over 300 mph off a professional&apos;s racket. Mine are...
              somewhat slower. But the footwork, the reflexes, the split-second
              decisions — it&apos;s the closest thing to a real-time algorithm
              I&apos;ve found outside of code.
            </p>
            <p>
              I have played for about 7 years — I have competed provincially in
              Ontario (I won gold for doubles!), and I now play recreationally.
            </p>
          </div>
        </section>
      </div>
    </PageTransition>
  );
}

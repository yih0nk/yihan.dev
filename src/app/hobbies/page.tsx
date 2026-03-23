import type { Metadata } from "next";
import PageTransition from "@/components/layout/PageTransition";
import HandDrawnDivider from "@/components/ui/HandDrawnDivider";

export const metadata: Metadata = {
  title: "Hobbies",
  description: "What Yihan does when not coding — music, art, photography, badminton.",
};

export default function HobbiesPage() {
  return (
    <PageTransition>
      <div className="max-w-[800px] mx-auto px-6 py-20">
        <h1
          className="text-4xl md:text-5xl mb-4"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          hobbies.
        </h1>
        <p className="text-gray-500 mb-16 leading-relaxed">
          I write code from 9 to 5 (okay, 9 to 2 AM). Here&apos;s what I do
          with the other hours.
        </p>

        {/* Music */}
        <section id="music" className="mb-16">
          <h2 className="text-2xl mb-6" style={{ fontFamily: "var(--font-mono)" }}>
            keys &amp; reeds
          </h2>
          <div className="text-gray-600 leading-relaxed space-y-4">
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
          </div>
        </section>

        <HandDrawnDivider />

        {/* Visual Art */}
        <section id="art" className="my-16">
          <h2 className="text-2xl mb-6" style={{ fontFamily: "var(--font-mono)" }}>
            ink &amp; paint
          </h2>
          <div className="text-gray-600 leading-relaxed space-y-4 mb-8">
            <p>
              I draw and paint — mostly ink, mostly by hand. That little character
              you&apos;ve been seeing around this site? I sketched that. It started
              as a doodle in a notebook margin and became my whole brand.
            </p>
            <p>
              I like the honesty of black ink on white paper. No undo button, no
              layers panel. Just a line and a decision. My style leans expressive
              and loose — I&apos;d rather capture energy than accuracy.
            </p>
          </div>
          <div className="border border-dashed border-gray-200 p-10 text-center">
            <p className="text-gray-300 text-sm">
              art gallery — add images to public/images/art/
            </p>
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
          </div>
          <div className="border border-dashed border-gray-200 p-10 text-center">
            <p className="text-gray-300 text-sm">
              photo gallery — add images to public/images/photos/
            </p>
          </div>
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
          </div>
        </section>
      </div>
    </PageTransition>
  );
}

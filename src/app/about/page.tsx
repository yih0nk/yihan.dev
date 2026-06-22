import type { Metadata } from "next";
import Image from "next/image";
import PageTransition from "@/components/layout/PageTransition";
import HandDrawnDivider from "@/components/ui/HandDrawnDivider";

export const metadata: Metadata = {
  title: "About",
  description: "Who is Yihan? USC computer engineering student, developer, artist, musician.",
};

const facts = [
  { label: "based in", value: "los angeles (via beijing, montreal, and toronto)" },
  { label: "studying", value: "usc: computer engineering & computer science" },
  { label: "awards", value: "viterbi scholar award, director's scholarship" },
  { label: "instruments", value: "piano (15 yrs), tenor sax (3 yrs)" },
  { label: "sport", value: "badminton: retired doubles player" },
  { label: "favourite drink", value: "matcha einspanner & always an iced latte" },
];

export default function AboutPage() {
  return (
    <PageTransition>
      <div className="max-w-[800px] mx-auto px-6 py-20">
        <h1
          className="text-4xl md:text-5xl mb-12 lowercase"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          about me.
        </h1>

        <div className="grid md:grid-cols-[200px_1fr] gap-12 mb-16">
          <div className="flex-shrink-0">
            <div className="w-40 h-40 md:w-full md:h-auto md:aspect-square border border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden">
              <Image src="/images/IMG_4699.jpg" alt="Yihan" width={200} height={200} className="h-full w-full object-cover" />
            </div>
          </div>

          <div className="space-y-5 text-gray-700 leading-relaxed">
            <p>
              I&apos;m Yihan — a student at USC studying Computer Engineering and
              Computer Science, currently splitting my time between coursework and
              building things that probably should&apos;ve taken twice as long.
            </p>
            <p>
              I like building real things. I&apos;ve shipped a tax-filing portal
              for 2,000+ clients, a chess club management system for 1,000+
              members, and a cafe operations platform that won a traction award.
              Lately I&apos;ve been going deep on agentic AI and reinforcement
              learning — systems that don&apos;t just respond, but act, adapt,
              and learn.
            </p>
            <p>
              I am multifaceted. I draw and paint, play piano and tenor saxophone,
              shoot photos when the light&apos;s right, and play badminton
              competitively enough to take it personally when I lose.
            </p>
            <p>I build things that work and things that matter. Ideally both.</p>
          </div>
        </div>

        <HandDrawnDivider />

        <div className="mt-12">
          <h2 className="text-xs tracking-widest uppercase text-gray-400 mb-6">
            quick facts
          </h2>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {facts.map((f) => (
              <div key={f.label} className="border border-gray-100 p-4">
                <dt className="text-xs text-gray-400 mb-1 uppercase tracking-wider">
                  {f.label}
                </dt>
                <dd className="text-sm font-medium">{f.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </PageTransition>
  );
}

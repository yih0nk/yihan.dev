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
      <div className="max-w-[800px] mx-auto px-6 pt-[calc(var(--nav-h)+5rem)] pb-20">
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

          <div className="space-y-5 text-ink-soft leading-relaxed">
            <p>
              I&apos;m Yihan, a computer engineering and CS student at USC. Most
              of my week goes to making software act on its own: fine-tuning
              models to someone&apos;s taste, testing whether AI systems behave
              the way they&apos;re supposed to, and documenting the many ways they
              don&apos;t, and wiring up retrieval across hundreds of thousands of
              records that all insist they&apos;re relevant.
            </p>
            <p>
              The rest of my time is less structured. Fifteen years of piano, a
              few of tenor sax, some photography, and more movies than a person
              can reasonably defend. I also play badminton with a level of
              competitiveness the sport did not ask for and cannot contain.
            </p>
            <p>
              I like building two kinds of things: the ones that work and the ones
              that matter. Occasionally the same thing.
            </p>
          </div>
        </div>

        <HandDrawnDivider />

        <div className="mt-12">
          <h2 className="text-xs tracking-widest uppercase text-muted mb-6">
            quick facts
          </h2>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {facts.map((f) => (
              <div key={f.label} className="border border-gray-100 p-4">
                <dt className="text-xs text-muted mb-1 uppercase tracking-wider">
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

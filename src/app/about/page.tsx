import type { Metadata } from "next";
import Image from "next/image";
import PageTransition from "@/components/layout/PageTransition";
import HandDrawnDivider from "@/components/ui/HandDrawnDivider";

export const metadata: Metadata = {
  title: "About",
  description: "Who is Yihan? USC computer engineering student, developer, artist, musician.",
};

const facts = [
  { label: "based in", value: "Los Angeles, CA (via Beijing → Montreal → Toronto)" },
  { label: "studying", value: "USC '29 · Computer Engineering & CS · 3.93 GPA" },
  { label: "awards", value: "Viterbi Scholar Award · Director's Scholarship" },
  { label: "instruments", value: "piano (15 yrs) · tenor sax (3 yrs)" },
  { label: "sport", value: "badminton — retired doubles player" },
  { label: "favourite drink", value: "matcha einspanner" },
];

export default function AboutPage() {
  return (
    <PageTransition>
      <div className="max-w-[800px] mx-auto px-6 py-20">
        <h1
          className="text-4xl md:text-5xl mb-12"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          about me.
        </h1>

        <div className="grid md:grid-cols-[200px_1fr] gap-12 mb-16">
          <div className="flex-shrink-0">
            <div className="w-40 h-40 md:w-full md:h-auto md:aspect-square border border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden">
              <Image src="/images/pfp.jpg" alt="Yihan" width={200} height={200} className="h-full w-full object-cover" />
            </div>
          </div>

          <div className="space-y-5 text-gray-700 leading-relaxed">
            <p>
              I&apos;m Yihan — a freshman at USC studying computer engineering and
              computer science, currently neck-deep in data structures, embedded
              systems, and figuring out how to make things work at every layer of
              the stack.
            </p>
            <p>
              I like building real things. I&apos;ve shipped a chess club
              management system, an internal workflow application, a client
              frontend for an accounting firm, and an AI agent that writes lesson
              plans for special education teachers. I&apos;m passionate about
              building software that makes a real impact for different communities.
            </p>
            <p>
              I am multifaceted. I draw and paint, play piano and tenor saxophone,
              shoot photos when the light&apos;s right, and play badminton
              competitively enough to take it personally when I lose.
            </p>
            <p>I build things that work and things that matter. Ideally both.</p>
            <p className="text-gray-500 text-sm">
              Currently looking for summer 2026 internships where I can build
              things that matter with people who care about craft.
            </p>
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

const codingData = {
    building: [
      "My personal site with React, Next.js, TypeScript, and Tailwind CSS.",
      "The landing-website for HackSC, USC's largest flagship hackathon.",
      "A USC Makers robot from scratch using stepper motors and Raspberry Pi.",
    ],
    learning: [
      "System design fundamentals and scalability patterns.",
      "Data structures, algorithms, and problem-solving patterns for SWE roles.",
    ],
    exploring: [
      "AI-assisted tools: using LLMs to analyze code and generate tests,",
      "Cloud-backend services on AWS (Lambda, API Gateway, RDS/Supabase)",
    ],
  };

export default function Coding() {
    return (
      <div>
        {/* Header */}
        <div className="mb-2 text-center">
            <h3 className="text-base font-semibold text-white">
                What I&apos;m focused on right now
            </h3>
            <p className="text-xs text-slate-400 mt-1">
                Updated regularly as I build, learn, and experiment.
            </p>
        </div>

      {/* Now building */}
        <Section
            label="Building"
            items={codingData.building}
            badgeColor="bg-sky-500/15 text-sky-300 border-sky-500/40"
        />

      {/* Learning */}
        <Section
            label="Learning"
            items={codingData.learning}
            badgeColor="bg-emerald-500/15 text-emerald-300 border-emerald-500/40"
        />

      {/* Exploring */}
        <Section
            label="Exploring"
            items={codingData.exploring}
            badgeColor="bg-violet-500/15 text-violet-300 border-violet-500/40"
        />
      </div>
    );
}          

type SectionProps = {
    label: string;
    items: string[];
    badgeColor: string;
  };
  
  function Section({ label, items, badgeColor }: SectionProps) {
    return (
      <div className="rounded-xl border border-white/5 bg-slate-900/60 p-3">
        {/* Label */}
        <div className="mb-2 flex items-center gap-2">
          <span
            className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide ${badgeColor}`}
          >
            {label}
          </span>
        </div>
  
        {/* Items */}
        <ul className="space-y-1.5">
          {items.map((item) => (
            <li key={item} className="flex gap-2">
              <span className="mt-[6px] h-1.5 w-1.5 flex-shrink-0 rounded-full bg-slate-500" />
              <p className="text-xs text-slate-200 leading-relaxed">{item}</p>
            </li>
          ))}
        </ul>
      </div>
    );
  }
  
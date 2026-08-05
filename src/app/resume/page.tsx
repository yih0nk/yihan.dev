import type { Metadata } from "next";
import PageTransition from "@/components/layout/PageTransition";
import ResumeGate from "@/components/ui/ResumeGate";

export const metadata: Metadata = {
  title: "Resume",
  description: "Password-protected resume.",
  robots: { index: false, follow: false },
};

export default function ResumePage() {
  return (
    <PageTransition>
      <div className="max-w-[800px] mx-auto px-6 py-20">
        <h1
          className="text-4xl md:text-5xl mb-6 lowercase"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          resume.
        </h1>
        <p className="text-gray-600 leading-relaxed mb-10 max-w-md">
          This one&apos;s behind a password. If you need it and don&apos;t have
          it, just{" "}
          <a
            href="mailto:yihanhon@usc.edu"
            className="underline underline-offset-4 hover:text-black"
          >
            email me
          </a>
          .
        </p>
        <ResumeGate />
      </div>
    </PageTransition>
  );
}

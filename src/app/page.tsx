import PageTransition from "@/components/layout/PageTransition";
import HandDrawnDivider from "@/components/ui/HandDrawnDivider";

export default function HomePage() {
  return (
    <PageTransition>
      {/* 3D Room placeholder — Phase 3 */}
      <section className="h-[80vh] flex items-center justify-center bg-gray-50 border-b border-gray-100">
        <p className="text-gray-300 text-sm tracking-widest uppercase">
          3D Room — coming in Phase 3
        </p>
      </section>

      <HandDrawnDivider />

      <section className="content-width px-6 py-20 text-center">
        <h1
          className="text-5xl md:text-7xl font-bold mb-4"
          style={{ fontFamily: "var(--font-sketch)" }}
        >
          Hi, I&apos;m Yihan
        </h1>
        <p className="text-lg text-gray-500 max-w-md mx-auto">
          Developer, artist, musician. USC CS student building real things.
        </p>
      </section>
    </PageTransition>
  );
}

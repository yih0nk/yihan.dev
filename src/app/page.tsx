"use client";

import dynamic from "next/dynamic";

const PianoHero = dynamic(
  () => import("@/components/interactive/PianoHero"),
  { ssr: false }
);

export default function HomePage() {
  return <PianoHero />;
}

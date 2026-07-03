"use client";

import dynamic from "next/dynamic";
import AgentButton from "@/components/ui/AgentButton";

const PianoHero = dynamic(
  () => import("@/components/interactive/PianoHero"),
  { ssr: false }
);

export default function HomePage() {
  return (
    <>
      <AgentButton />
      <PianoHero />
    </>
  );
}

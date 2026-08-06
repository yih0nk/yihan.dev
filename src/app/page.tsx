import type { Metadata } from "next";

import Home from "@/components/home/Home";
import { FONTS } from "@/styles/tokens";

/**
 * The homepage.
 *
 * A SERVER component, deliberately. The old one loaded PianoHero through
 * `dynamic(..., { ssr: false })`, and copying that pattern here would have shipped
 * the page with no <h1> in its initial HTML — ReelHero's screen-reader heading is
 * the only one the homepage has. Importing Home directly keeps that heading in
 * the server render and lets this file export `metadata`, which it could not do
 * as a client component.
 *
 * Home is still `'use client'`; a client component imported by a server one is
 * fine, and the canvases inside it need the browser anyway.
 *
 * The nav does not offset this page — it is hidden until the reel is scrolled
 * past (see Nav.tsx), so the reel gets the whole first screen.
 */
export const metadata: Metadata = {
  title: "Yihan Hong",
  description:
    "Computer engineering and CS student at USC. Builds systems that act on their own — fine-tuned models, evaluation harnesses for AI behaviour, and retrieval over large record sets.",
  alternates: { canonical: "/" },
};

export default function HomePage() {
  return <Home font={FONTS.display} />;
}

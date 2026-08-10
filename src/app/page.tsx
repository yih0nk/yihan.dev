import type { Metadata } from "next";

import Home from "@/components/home/Home";
import JsonLd from "@/components/seo/JsonLd";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL, SOCIALS } from "@/lib/site";
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
  // No `description` override. It used to carry its own sentence, which meant
  // the homepage and the root metadata described the same person two different
  // ways — and the OG card, built from SITE_DESCRIPTION, disagreed with the
  // meta tag right beside it. That wording is now SITE_DESCRIPTION itself, so
  // inheriting is both shorter and the only way they cannot drift apart again.
  alternates: { canonical: "/" },
};

/**
 * The Person entity, which is the one piece of structured data on this site
 * that has a job to do.
 *
 * "Yihan Hong" is not a distinctive string, and the pages that rank for it are
 * other people. `sameAs` is the lever: it is how a search engine decides that
 * the GitHub account, the LinkedIn profile and this domain are one entity
 * rather than three, and it is the only claim here that is not already stated
 * in the visible copy.
 *
 * `@id` is a stable identifier rather than a URL to fetch, so the BlogPosting
 * on each post can point its `author` at this exact node instead of restating
 * the person. One entity, referenced twice.
 */
const personLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  "@id": `${SITE_URL}/#person`,
  name: SITE_NAME,
  url: SITE_URL,
  description: SITE_DESCRIPTION,
  image: `${SITE_URL}/images/pfp.jpg`,
  sameAs: SOCIALS,
  alumniOf: {
    "@type": "CollegeOrUniversity",
    name: "University of Southern California",
    url: "https://www.usc.edu",
  },
  knowsAbout: [
    "Artificial intelligence",
    "Reinforcement learning",
    "AI agents",
    "Machine learning infrastructure",
  ],
};

export default function HomePage() {
  return (
    <>
      <JsonLd data={personLd} />
      <Home font={FONTS.display} />
    </>
  );
}

import type { Metadata } from "next";

import Home from "@/components/home/Home";
import JsonLd from "@/components/seo/JsonLd";
import { EDUCATION } from "@/lib/experience";
import { CURRENT_ROLE, SEEKING, STRENGTHS } from "@/lib/recruiting";
import { EMAIL, SITE_DESCRIPTION, SITE_NAME, SITE_URL, SOCIALS } from "@/lib/site";
import { getInitialNowPlaying } from "@/lib/spotify";
import { FONTS } from "@/styles/tokens";

/**
 * Ten seconds, which is what buys the record its data.
 *
 * This page was fully static, so its HTML could not contain what was playing —
 * the disc had to mount blank and wait for a client poll, and that wait was
 * visible on every refresh. Regenerating on a short interval puts a real track
 * in the markup at first paint while keeping the page a cached static file, and
 * costs Spotify one call per ten seconds no matter how many people are reading.
 * The client still polls, so anything staler than the interval self-corrects.
 */
export const revalidate = 10;

/**
 * The homepage.
 *
 * A SERVER component, deliberately: it exports `metadata`, which a client
 * component cannot. Home is `'use client'` (a client component imported by a
 * server one is fine), and the Classic inside it loads with `ssr: false`; the
 * shell that holds its place while it loads carries the page's one <h1>, so the
 * heading is in the initial HTML all the same.
 *
 * The nav does not offset this page: it stays hidden until the hero has landed
 * (see Nav.tsx), so the hero gets the whole first screen.
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
 * the person. One entity, referenced from the posts and the projects.
 *
 * It sits inside a ProfilePage, which is how Google is told this page is ABOUT
 * the person rather than merely by them. The role, the school, the skills and
 * what he is looking for come from the same modules as the visible recruiter
 * section, so the markup cannot claim anything the page does not show.
 */
const profileLd = {
  "@context": "https://schema.org",
  "@type": "ProfilePage",
  "@id": `${SITE_URL}/#profile`,
  url: SITE_URL,
  name: SITE_NAME,
  mainEntity: {
    "@type": "Person",
    "@id": `${SITE_URL}/#person`,
    name: SITE_NAME,
    url: SITE_URL,
    email: `mailto:${EMAIL}`,
    description: SITE_DESCRIPTION,
    image: `${SITE_URL}/images/pfp.jpg`,
    sameAs: SOCIALS,
    jobTitle: CURRENT_ROLE.title,
    worksFor: { "@type": "Organization", name: CURRENT_ROLE.org, url: "https://www.gojuly.ai" },
    alumniOf: {
      "@type": "CollegeOrUniversity",
      name: "University of Southern California",
      url: "https://www.usc.edu",
    },
    hasCredential: {
      "@type": "EducationalOccupationalCredential",
      credentialCategory: "degree",
      name: EDUCATION.title,
    },
    seeks: { "@type": "Demand", description: SEEKING },
    knowsAbout: STRENGTHS,
  },
};

export default async function HomePage() {
  const nowPlaying = await getInitialNowPlaying();

  return (
    <>
      <JsonLd data={profileLd} />
      <Home font={FONTS.display} nowPlaying={nowPlaying} />
    </>
  );
}

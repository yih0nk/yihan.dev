/**
 * The canonical origin, in one place.
 *
 * It was already hardcoded in llms.txt and agentContent, and the SEO pass needs
 * it in four more: metadataBase, the sitemap, the OG card, and the JSON-LD.
 * Six copies of a hostname is five chances for one of them to be wrong on the
 * day the domain moves, and the wrong ones would be the machine-readable files
 * nobody opens by hand.
 *
 * No trailing slash — every consumer appends a rooted path.
 */
export const SITE_URL = "https://yihan.dev";

export const SITE_NAME = "Yihan Hong";

/**
 * Used as the default `description` and inside the Person JSON-LD, so search
 * results and structured data agree with each other rather than drifting.
 */
export const SITE_DESCRIPTION =
  "Personal website of Yihan Hong — a USC computer engineering and computer science student building AI agents, reinforcement learning systems, and the infrastructure underneath them.";

/** Profiles that `sameAs` points at, which is how Google links an entity. */
export const SOCIALS = [
  "https://github.com/yih0nk",
  "https://www.linkedin.com/in/yihanhong",
  "https://x.com/yih0nk",
  "https://www.instagram.com/yih0nk/",
];

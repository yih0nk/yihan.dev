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

/**
 * The profiles, one constant each.
 *
 * THESE WERE WRITTEN OUT BY HAND IN THREE FILES AND TWO OF THEM WERE WRONG.
 * This module had linkedin.com/in/yihanhong, the footer and agentContent.ts
 * had /in/yihan-hon; the footer linked x.com/yihanhon and this module said
 * x.com/yih0nk. So the footer carried a dead link, and the profile URLs were
 * about to be published as `sameAs` — which is the one place a wrong URL does
 * real damage, because `sameAs` is how a search engine decides that a GitHub
 * account, a LinkedIn profile and this domain are one person rather than
 * three, and a URL that resolves to nobody links this site to nobody.
 *
 * Named individually rather than only as an array so the footer can link one
 * without indexing into a list by position.
 */
export const GITHUB_URL = "https://github.com/yih0nk";
export const LINKEDIN_URL = "https://www.linkedin.com/in/yihan-hon";
export const X_URL = "https://x.com/yihanhon";
export const INSTAGRAM_URL = "https://www.instagram.com/yih0nk/";
export const EMAIL = "yihanhon@usc.edu";

/** Profiles that `sameAs` points at, which is how Google links an entity. */
export const SOCIALS = [GITHUB_URL, LINKEDIN_URL, X_URL, INSTAGRAM_URL];

/**
 * The X handle, for `twitter:site` and `twitter:creator`.
 *
 * Kept as its own constant rather than parsed back out of X_URL: a regex over
 * a URL is a clever way to produce an empty string the day the URL gains a
 * query string.
 */
export const X_HANDLE = "@yihanhon";

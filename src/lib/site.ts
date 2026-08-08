/**
 * The canonical origin and identity, in one place.
 *
 * No trailing slash — every consumer appends a rooted path.
 */
export const SITE_URL = "https://yihan.dev";

export const SITE_NAME = "Yihan Hong";

export const SITE_DESCRIPTION =
  "Personal website of Yihan Hong — a USC computer engineering and computer science student building AI agents, reinforcement learning systems, and the infrastructure underneath them.";

/**
 * These were written out by hand in three files and two of them were wrong: the
 * footer carried a dead LinkedIn link, and the URLs about to be published as
 * schema.org `sameAs` pointed somewhere else again. `sameAs` is how a search
 * engine decides a GitHub account, a LinkedIn profile and this domain are one
 * person, so a wrong URL there links the site to nobody, silently.
 */
export const GITHUB_URL = "https://github.com/yih0nk";
export const LINKEDIN_URL = "https://www.linkedin.com/in/yihan-hon";
export const X_URL = "https://x.com/yihanhon";
export const INSTAGRAM_URL = "https://www.instagram.com/yih0nk/";
export const EMAIL = "yihanhon@usc.edu";

/** What `sameAs` points at. */
export const SOCIALS = [GITHUB_URL, LINKEDIN_URL, X_URL, INSTAGRAM_URL];

/** For twitter:site and twitter:creator. */
export const X_HANDLE = "@yihanhon";

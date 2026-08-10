/**
 * The canonical origin and identity, in one place.
 *
 * No trailing slash — every consumer appends a rooted path.
 */
export const SITE_URL = "https://yihan.dev";

export const SITE_NAME = "Yihan Hong";

/**
 * One description, used by the root metadata, the homepage, and the schema.org
 * `Person`. There were two of these and they disagreed: this constant said
 * "Personal website of Yihan Hong — a USC computer engineering and computer
 * science student…" while page.tsx overrode it with a different sentence, so
 * the OG card and the meta tag described the same person differently.
 *
 * The homepage's wording won, because "systems that act on their own" says
 * something and "personal website of" says nothing. Its em dash became a colon:
 * the site's voice does not use em dashes, and this string is the one sentence
 * that shows up in search results and on every share card.
 *
 * 161 characters, which is inside the ~160 Google renders before truncating.
 */
export const SITE_DESCRIPTION =
  "Computer engineering and CS student at USC. Builds systems that act on their own: fine-tuned models, evaluation harnesses for AI behaviour, and retrieval at scale.";

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

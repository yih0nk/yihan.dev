/**
 * The canonical origin and identity, in one place.
 *
 * No trailing slash — every consumer appends a rooted path.
 */
export const SITE_URL = "https://yihan.dev";

export const SITE_NAME = "Yihan Hong";

/**
 * One description, used by the root metadata, the homepage, and the schema.org
 * `Person`. There were two of these and they disagreed; keeping a single
 * constant is why the OG card and the meta tag can no longer describe the same
 * person two different ways.
 *
 * This is the site's through-line, not a keyword line. The domain ranks for
 * "Yihan Hong" through the Person schema and `sameAs`, not through this string,
 * so the description is free to be the one sentence that actually sounds like
 * him and reads well on a share card. No em dash — the voice does not use them.
 */
export const SITE_DESCRIPTION = "I'm an engineer, and a few other things.";

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

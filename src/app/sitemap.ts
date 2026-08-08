import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/site";
import { getAllPosts, getWelcomePost } from "@/lib/mdx";
import { projects } from "@/lib/projects";

/**
 * Built from the same modules the pages are, so new projects and posts appear
 * without anyone remembering to add them.
 *
 * /resume is absent on purpose: it is noindex and Disallowed, and listing a
 * page you ask crawlers not to fetch makes them trust neither signal.
 *
 * No changeFrequency or priority — Google ignores both. `lastModified` only
 * where a real date exists; stamping every URL with the build time would say
 * the whole site changed on every deploy.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = ["", "/projects", "/experience", "/play", "/blog"].map(
    (path) => ({ url: `${SITE_URL}${path}` }),
  );

  const projectRoutes = projects.map((p) => ({
    url: `${SITE_URL}/projects/${p.slug}`,
  }));

  // getAllPosts already drops drafts; welcome.mdx lives outside the category
  // directories it walks, so it is added by hand the same way the page's
  // generateStaticParams adds it.
  const welcome = getWelcomePost();
  const postRoutes = [
    ...(welcome ? [welcome] : []),
    ...getAllPosts(),
  ].map((post) => ({
    url: `${SITE_URL}/blog/${post.slug}`,
    ...(post.date ? { lastModified: new Date(post.date) } : {}),
  }));

  return [...staticRoutes, ...projectRoutes, ...postRoutes];
}

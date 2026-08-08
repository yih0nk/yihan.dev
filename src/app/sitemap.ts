import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/site";
import { getAllPosts, getWelcomePost } from "@/lib/mdx";
import { projects } from "@/lib/projects";

/**
 * /sitemap.xml — it returned 404 until now.
 *
 * Built from the same modules the pages are built from, so a project added to
 * projects.ts or a post dropped into src/content/blog appears here without
 * anyone remembering to. A hand-maintained sitemap is a list that is correct on
 * the day it is written and wrong from the next deploy onward, and it is wrong
 * silently, because nobody opens it.
 *
 * /resume is deliberately absent. It is `noindex` in its own metadata and
 * Disallowed in robots.txt, and listing a page you are asking crawlers not to
 * fetch is a contradiction they resolve by trusting neither signal.
 *
 * NO `changeFrequency` OR `priority`. Google has said publicly it ignores both,
 * and the honest reason they are usually present is that the schema allows
 * them. Emitting a number nothing reads is a maintenance cost with no reader.
 *
 * `lastModified` is set ONLY where a real date exists — the frontmatter date on
 * a post. Static pages get none, rather than the build timestamp: stamping
 * every URL with `new Date()` tells a crawler the entire site changed on every
 * deploy, which trains it to ignore the field on the one URL where it is true.
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

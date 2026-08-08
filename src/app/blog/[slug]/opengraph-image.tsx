import { ImageResponse } from "next/og";

import { getAllPosts, getPostBySlug, getWelcomePost } from "@/lib/mdx";
import { formatPostDate } from "@/lib/blogMeta";
import { OG_FONT, ogFonts } from "@/lib/og/fonts";
import { SITE_NAME } from "@/lib/site";
import { COLORS_LIGHT } from "@/styles/tokens";

/**
 * The share card for one post, at /blog/<slug>/opengraph-image.
 *
 * Posts get their own because the title is the thing worth showing — a link to
 * a specific post rendering the generic site card tells a reader nothing they
 * did not already know from the URL. Everything else on the site keeps the
 * default card at src/app/opengraph-image.tsx; per-page cards beyond this were
 * considered and declined.
 *
 * Set in the real faces, on the same roles as the post page itself: the title
 * in Instrument Serif, the rule and the date line in Source Code Pro. See
 * src/lib/og/fonts.ts for why they need converting before Satori will take them.
 */

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Blog post";

/**
 * Without this the route builds as ƒ (dynamic) and every scrape re-renders the
 * PNG in a function — the page's own generateStaticParams does NOT carry over
 * to a sibling image route. Declaring the params here makes each card a static
 * file written at build time. It repeats the page's list rather than importing
 * it because that one also throws on slug collisions, and a build should fail
 * on the page, once, not twice from two different files.
 */
export async function generateStaticParams() {
  const welcome = getWelcomePost();
  return [
    ...(welcome ? [{ slug: "welcome" }] : []),
    ...getAllPosts().map((p) => ({ slug: p.slug })),
  ];
}

/**
 * Long titles must not overflow the card, and Satori has no text measurement to
 * fit against — it will happily run a heading off the canvas. Three steps by
 * character count, tuned against the longest title currently on the site
 * ("yc startup school afterthoughts." at 32) plus headroom for one twice that.
 *
 * The sizes are larger than they would be in a sans: Instrument Serif is a
 * narrow display serif and sets appreciably smaller than General Sans at the
 * same px, which is the same reason the pages set it at text-5xl/7xl.
 */
function titleSize(title: string): number {
  if (title.length > 64) return 76;
  if (title.length > 36) return 96;
  return 124;
}

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  const fonts = await ogFonts();

  // notFound() is not available to an image route, and a 404 here would show a
  // broken card rather than no card. The site name is the honest fallback.
  const title = post?.title ?? SITE_NAME;
  // The date only. The category is already in the header rule top-right, where
  // the post page itself puts it, and setting it in both places put the word
  // "life" on the card twice.
  const meta = post?.date ? formatPostDate(post.date) : "";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: COLORS_LIGHT.bg,
          padding: "64px 72px",
          fontFamily: OG_FONT.body,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            borderBottom: `1px solid ${COLORS_LIGHT.hairline}`,
            paddingBottom: 18,
            fontFamily: OG_FONT.mono,
            fontSize: 19,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: COLORS_LIGHT.muted,
          }}
        >
          <div style={{ display: "flex" }}>yihan.dev/blog</div>
          <div style={{ display: "flex" }}>{post?.category ?? ""}</div>
        </div>

        <div
          style={{
            display: "flex",
            fontFamily: OG_FONT.display,
            fontSize: titleSize(title),
            lineHeight: 1.04,
            letterSpacing: "-0.02em",
            color: COLORS_LIGHT.ink,
          }}
        >
          {title}
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontFamily: OG_FONT.mono,
            fontSize: 21,
            letterSpacing: "0.14em",
            color: COLORS_LIGHT.muted,
          }}
        >
          <div style={{ display: "flex" }}>{meta}</div>
          <div style={{ display: "flex" }}>{SITE_NAME.toLowerCase()}</div>
        </div>
      </div>
    ),
    { ...size, fonts },
  );
}

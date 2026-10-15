import { ImageResponse } from "next/og";

import { OG_FONT, ogFonts } from "@/lib/og/fonts";
import { getProject, projects } from "@/lib/projects";
import { SITE_NAME } from "@/lib/site";
import { COLORS_LIGHT } from "@/styles/tokens";

/**
 * The share card for one project, at /projects/<slug>/opengraph-image.
 *
 * Set like the blog's cards (src/app/blog/[slug]/opengraph-image.tsx): the
 * mono rule on top, the name in Instrument Serif, the tagline under it, and
 * the stack along the foot. The tagline is the point: a link to a project
 * that shows the generic site card says nothing the URL did not.
 */

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Project";

/** Static at build time, one card per project (see the blog card for why). */
export async function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }));
}

/** Satori cannot measure text, so long taglines step down by character count. */
function taglineSize(t: string): number {
  if (t.length > 120) return 30;
  if (t.length > 80) return 34;
  return 40;
}

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = getProject(slug);
  const fonts = await ogFonts();

  const n = project ? projects.indexOf(project) + 1 : 0;
  const pad = (v: number) => String(v).padStart(2, "0");
  const title = project?.title ?? SITE_NAME;
  const tagline = project?.tagline ?? "";
  const stack = project?.tags.slice(0, 5).join(" · ") ?? "";

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
          <div style={{ display: "flex" }}>yihan.dev/projects</div>
          <div style={{ display: "flex" }}>{n ? `${pad(n)} / ${pad(projects.length)}` : ""}</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 26 }}>
          <div
            style={{
              display: "flex",
              fontFamily: OG_FONT.display,
              fontSize: 124,
              lineHeight: 1,
              letterSpacing: "-0.02em",
              color: COLORS_LIGHT.ink,
            }}
          >
            {title}
          </div>
          <div
            style={{
              display: "flex",
              maxWidth: 960,
              fontSize: taglineSize(tagline),
              lineHeight: 1.3,
              color: COLORS_LIGHT.muted,
            }}
          >
            {tagline}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontFamily: OG_FONT.mono,
            fontSize: 19,
            letterSpacing: "0.12em",
            color: COLORS_LIGHT.muted,
          }}
        >
          <div style={{ display: "flex" }}>{stack}</div>
          <div style={{ display: "flex" }}>{SITE_NAME.toLowerCase()}</div>
        </div>
      </div>
    ),
    { ...size, fonts },
  );
}

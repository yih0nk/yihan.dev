import { ImageResponse } from "next/og";

import { OG_FONT, ogFonts } from "@/lib/og/fonts";
import { SITE_NAME, SITE_DESCRIPTION } from "@/lib/site";
import { COLORS } from "@/styles/tokens";

/**
 * The default share card, at /opengraph-image.
 *
 * Next picks this up for every route that does not declare its own, so one file
 * covers the homepage, /projects, /experience, /play, /blog and every project
 * page. Blog posts override it with their own (see blog/[slug]/opengraph-image).
 *
 * Generated rather than a static asset so the copy tracks src/lib/site.ts. A PNG
 * in /public is a screenshot of what the site said on the day someone exported
 * it, and the whole reason this pass exists is that the machine-readable half of
 * the site had drifted from the human half.
 *
 * The three faces are the real ones, on the same roles the pages use them for:
 * Instrument Serif for the name, General Sans for the standfirst, Source Code
 * Pro for the rule labels. See src/lib/og/fonts.ts for why they need converting
 * before Satori will take them.
 */

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = `${SITE_NAME} — personal site`;

export default async function Image() {
  const fonts = await ogFonts();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: COLORS.bg,
          padding: "64px 72px",
          fontFamily: OG_FONT.body,
        }}
      >
        {/* The header rule every page opens with: mono, uppercase, wide
            tracking, sitting on a hairline. */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            borderBottom: `1px solid ${COLORS.hairline}`,
            paddingBottom: 18,
            fontFamily: OG_FONT.mono,
            fontSize: 19,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: COLORS.muted,
          }}
        >
          <div style={{ display: "flex" }}>yihan.dev</div>
          <div style={{ display: "flex" }}>personal site</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              fontFamily: OG_FONT.display,
              fontSize: 150,
              lineHeight: 1,
              letterSpacing: "-0.02em",
              color: COLORS.ink,
            }}
          >
            {SITE_NAME}
          </div>

          {/* The standfirst, cut at the em dash — the full sentence is written
              for a <meta description> and runs too long to set at this size. */}
          <div
            style={{
              display: "flex",
              marginTop: 30,
              maxWidth: 900,
              fontSize: 31,
              lineHeight: 1.45,
              color: COLORS.muted,
            }}
          >
            {SITE_DESCRIPTION.split("—")[1]?.trim() ?? SITE_DESCRIPTION}
          </div>
        </div>

        {/* The one accent, doing the one thing it is allowed to do: mark where
            the eye should land last. */}
        <div style={{ display: "flex", alignItems: "center" }}>
          <div
            style={{
              display: "flex",
              width: 64,
              height: 3,
              backgroundColor: COLORS.accent,
            }}
          />
        </div>
      </div>
    ),
    { ...size, fonts },
  );
}

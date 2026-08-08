import { getTopArtists, isConfigured } from "@/lib/spotify";

/**
 * Top artists, last four weeks.
 *
 * Cached far harder than /now-playing, because it answers a different kind of
 * question. "What is playing" is wrong the moment it is stale; "who have you
 * been listening to this month" moves over weeks, so an hour-old answer is
 * indistinguishable from a fresh one and costs Spotify nothing.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  if (!isConfigured()) {
    // Not an error. The caller renders nothing, the same way it does when the
    // token predates the `user-top-read` scope.
    return Response.json(
      { configured: false, artists: null },
      { headers: { "Cache-Control": "public, s-maxage=3600" } },
    );
  }

  try {
    const artists = await getTopArtists();
    return Response.json(
      { configured: true, artists },
      {
        headers: {
          "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
        },
      },
    );
  } catch {
    return Response.json(
      { configured: true, artists: null },
      { headers: { "Cache-Control": "public, s-maxage=300" } },
    );
  }
}

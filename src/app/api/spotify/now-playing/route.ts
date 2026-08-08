import { getNowPlaying, isConfigured } from "@/lib/spotify";

/**
 * Cached for 60s at the edge. Long enough that a burst of visitors costs one
 * Spotify call, short enough that "now playing" stays honest.
 */
export const revalidate = 0;
export const dynamic = "force-dynamic";

export async function GET() {
  if (!isConfigured()) {
    // Not an error, and a 200 with a plain flag keeps this off the client's
    // error branch. There is no longer a hardcoded rotation to fall back to —
    // it was deleted (see tracks.ts) because showing somebody else's song under
    // "now playing" is the one thing this widget must not do. The homepage
    // holds the readout hidden instead.
    return Response.json(
      { configured: false, track: null },
      { headers: { "Cache-Control": "public, s-maxage=300" } },
    );
  }

  try {
    const track = await getNowPlaying();
    return Response.json(
      { configured: true, track },
      {
        headers: {
          // 5s, not 60. The client interpolates the position between polls, so
          // a cached progress_ms is wrong by exactly the age of the cache — and
          // the interpolation would then jump backwards on every re-sync.
          "Cache-Control": "public, s-maxage=5, stale-while-revalidate=10",
        },
      },
    );
  } catch {
    // A Spotify outage should degrade to a quiet readout, never a broken page.
    return Response.json(
      { configured: true, track: null },
      { headers: { "Cache-Control": "public, s-maxage=30" } },
    );
  }
}

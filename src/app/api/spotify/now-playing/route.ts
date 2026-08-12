import { getNowPlaying, isConfigured } from "@/lib/spotify";

/**
 * Cached five seconds at the edge, and never served stale. The body carries a
 * POSITION, so a response served nine seconds old makes the readout nine seconds
 * wrong and the next fresh one snaps it forward — that was the jumping clock,
 * `stale-while-revalidate=10` against a 10s poll. The client corrects for the
 * remaining age via the `Age` header.
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
          // 5s, and no stale window. The client interpolates the position
          // between polls, so a cached progress_ms is wrong by exactly the age
          // of the cache — and the interpolation then jumps on every re-sync.
          "Cache-Control": "public, s-maxage=5, must-revalidate",
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

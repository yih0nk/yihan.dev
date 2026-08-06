import { getNowPlaying, isConfigured } from "@/lib/spotify";

/**
 * Cached for 60s at the edge. Long enough that a burst of visitors costs one
 * Spotify call, short enough that "now playing" stays honest.
 */
export const revalidate = 0;
export const dynamic = "force-dynamic";

export async function GET() {
  if (!isConfigured()) {
    // Not an error. The homepage falls back to its hardcoded rotation, and a
    // 200 with a plain flag keeps that path off the client's error branch.
    return Response.json(
      { configured: false, track: null },
      { headers: { "Cache-Control": "public, s-maxage=300" } },
    );
  }

  try {
    const track = await getNowPlaying();
    return Response.json(
      { configured: true, track },
      { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" } },
    );
  } catch {
    // A Spotify outage should degrade to the rotation, never to a broken page.
    return Response.json(
      { configured: true, track: null },
      { headers: { "Cache-Control": "public, s-maxage=30" } },
    );
  }
}

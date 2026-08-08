import { redirect } from "next/navigation";

/**
 * Step one of the one-time authorisation, and DEVELOPMENT ONLY.
 *
 * This route exists so the refresh token can be minted without pasting URLs
 * together by hand. It refuses to run in production: it is an unauthenticated
 * endpoint that begins an OAuth flow against the site's own client, and there
 * is no reason for it to be reachable once the token is in the environment.
 */
/**
 * `user-top-read` was added after the fact, for the listening block on /play.
 *
 * Scopes are baked into a refresh token at the moment it is issued, so adding
 * one to this list does nothing for a token that already exists — this flow has
 * to be run again and SPOTIFY_REFRESH_TOKEN replaced. Until that happens
 * `getTopArtists` returns null and the block renders nothing at all, which is
 * the intended failure: a missing integration should look deliberate.
 */
const SCOPES = [
  "user-read-currently-playing",
  "user-read-recently-played",
  "user-top-read",
].join(" ");

export function GET(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return new Response("Not available in production.", { status: 404 });
  }

  const id = process.env.SPOTIFY_CLIENT_ID;
  if (!id) {
    return new Response(
      "SPOTIFY_CLIENT_ID is not set. Put it in .env.local and restart the dev server.",
      { status: 500, headers: { "Content-Type": "text/plain; charset=utf-8" } },
    );
  }

  // Must match a Redirect URI registered on the Spotify app exactly. Spotify
  // rejects "localhost" for new apps but accepts the loopback IP, which is why
  // the registered value is 127.0.0.1 rather than localhost.
  const origin = new URL(request.url).origin.replace("localhost", "127.0.0.1");

  const params = new URLSearchParams({
    client_id: id,
    response_type: "code",
    redirect_uri: `${origin}/api/spotify/callback`,
    scope: SCOPES,
  });

  redirect(`https://accounts.spotify.com/authorize?${params}`);
}

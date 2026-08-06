/**
 * Step two of the one-time authorisation, and DEVELOPMENT ONLY.
 *
 * Spotify sends the visitor back here with a `code`; this exchanges it for a
 * refresh token and prints it as plain text so it can be pasted into
 * .env.local. It never writes the token to disk — a secret written by a program
 * is a secret nobody remembers is there.
 *
 * Same production guard as /api/spotify/login, for the same reason.
 */
const TOKEN_URL = "https://accounts.spotify.com/api/token";

export async function GET(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return new Response("Not available in production.", { status: 404 });
  }

  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");

  const text = (body: string, status = 200) =>
    new Response(body, { status, headers: { "Content-Type": "text/plain; charset=utf-8" } });

  if (error) return text(`Spotify returned: ${error}`, 400);
  if (!code) return text("No ?code in the callback. Start again at /api/spotify/login.", 400);

  const id = process.env.SPOTIFY_CLIENT_ID;
  const secret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!id || !secret) return text("SPOTIFY_CLIENT_ID / SPOTIFY_CLIENT_SECRET are not set.", 500);

  const origin = url.origin.replace("localhost", "127.0.0.1");
  const basic = Buffer.from(`${id}:${secret}`).toString("base64");

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: `${origin}/api/spotify/callback`,
    }),
    cache: "no-store",
  });

  const json = (await res.json()) as { refresh_token?: unknown; error_description?: unknown };
  if (!res.ok || typeof json.refresh_token !== "string") {
    return text(
      `Exchange failed (${res.status}). ${String(json.error_description ?? "")}\n\n` +
        "Check that the Redirect URI on the Spotify app matches this URL exactly.",
      400,
    );
  }

  return text(
    [
      "Done. Add this line to .env.local, then restart the dev server:",
      "",
      `SPOTIFY_REFRESH_TOKEN=${json.refresh_token}`,
      "",
      "Then add the same three variables to the Vercel project settings.",
      "This token does not expire on its own, but rotating the client secret",
      "invalidates it — if you rotate, run this flow again.",
    ].join("\n"),
  );
}

/**
 * Spotify — "now playing", server-side only.
 *
 * Spotify's user-scoped endpoints need a token that belongs to a person, and
 * user tokens expire hourly. The only credential worth storing is the REFRESH
 * token, which is exchanged for a fresh access token on demand. That exchange
 * uses the client secret, so every line in this file runs on the server and
 * nothing here may ever be imported into a client component.
 *
 * Setup is a one-time dance, documented in .env.example:
 *   1. put SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET in .env.local
 *   2. visit /api/spotify/login, approve, copy the refresh token it prints
 *   3. put it in SPOTIFY_REFRESH_TOKEN and restart
 *
 * Absent any of the three the module reports `configured: false` and the caller
 * falls back to the hardcoded rotation. A missing integration is not an error
 * state — the page should look deliberate, not broken.
 */

const TOKEN_URL = "https://accounts.spotify.com/api/token";
const NOW_PLAYING_URL = "https://api.spotify.com/v1/me/player/currently-playing";
const RECENT_URL = "https://api.spotify.com/v1/me/player/recently-played?limit=1";

export interface NowPlaying {
  title: string;
  artist: string;
  album: string;
  url: string;
  /** Dominant colour is not available from the API; the caller picks one. */
  image: string | null;
  /** False when nothing is playing and this is the last thing that did. */
  isPlaying: boolean;
}

function credentials() {
  const id = process.env.SPOTIFY_CLIENT_ID;
  const secret = process.env.SPOTIFY_CLIENT_SECRET;
  const refresh = process.env.SPOTIFY_REFRESH_TOKEN;
  if (!id || !secret || !refresh) return null;
  return { id, secret, refresh };
}

export function isConfigured(): boolean {
  return credentials() !== null;
}

/**
 * Exchange the refresh token for an access token.
 *
 * Deliberately not cached in module scope: serverless invocations do not share
 * memory reliably, and a stale token cached across a cold start would produce
 * an intermittent 401 that is miserable to reproduce. The route caches its own
 * RESPONSE instead, which is the thing worth caching.
 */
async function accessToken(): Promise<string | null> {
  const creds = credentials();
  if (!creds) return null;

  const basic = Buffer.from(`${creds.id}:${creds.secret}`).toString("base64");
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: creds.refresh,
    }),
    cache: "no-store",
  });

  if (!res.ok) return null;
  const json = (await res.json()) as { access_token?: unknown };
  return typeof json.access_token === "string" ? json.access_token : null;
}

/** Narrow one track object without trusting its shape. */
function readTrack(raw: unknown, isPlaying: boolean): NowPlaying | null {
  if (typeof raw !== "object" || raw === null) return null;
  const t = raw as Record<string, unknown>;

  const title = typeof t.name === "string" ? t.name : null;
  if (!title) return null;

  const artists = Array.isArray(t.artists) ? t.artists : [];
  const artist = artists
    .map((a) => (typeof a === "object" && a !== null ? (a as { name?: unknown }).name : null))
    .filter((n): n is string => typeof n === "string")
    .join(", ");

  const album = typeof t.album === "object" && t.album !== null ? (t.album as Record<string, unknown>) : {};
  const images = Array.isArray(album.images) ? album.images : [];
  const first = images[0];
  const image =
    typeof first === "object" && first !== null && typeof (first as { url?: unknown }).url === "string"
      ? ((first as { url: string }).url)
      : null;

  const urls = typeof t.external_urls === "object" && t.external_urls !== null
    ? (t.external_urls as { spotify?: unknown })
    : {};

  return {
    title,
    artist: artist || "unknown",
    album: typeof album.name === "string" ? album.name : "",
    url: typeof urls.spotify === "string" ? urls.spotify : "https://open.spotify.com",
    image,
    isPlaying,
  };
}

/**
 * What is playing, or — when nothing is — the last thing that did.
 *
 * The fallback matters more than it looks: a portfolio is mostly read while its
 * owner is asleep, and "now playing: nothing" is a worse answer than the last
 * track. Spotify signals "nothing playing" with a 204 and an empty body.
 */
export async function getNowPlaying(): Promise<NowPlaying | null> {
  const token = await accessToken();
  if (!token) return null;

  const headers = { Authorization: `Bearer ${token}` };

  const live = await fetch(NOW_PLAYING_URL, { headers, cache: "no-store" });
  if (live.status === 200) {
    const json = (await live.json()) as { item?: unknown; is_playing?: unknown };
    const track = readTrack(json.item, json.is_playing === true);
    if (track) return track;
  }

  const recent = await fetch(RECENT_URL, { headers, cache: "no-store" });
  if (!recent.ok) return null;
  const json = (await recent.json()) as { items?: unknown };
  const items = Array.isArray(json.items) ? json.items : [];
  const first = items[0];
  if (typeof first !== "object" || first === null) return null;
  return readTrack((first as { track?: unknown }).track, false);
}

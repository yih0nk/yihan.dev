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
/**
 * `short_term` is Spotify's rolling ~4 weeks. `medium_term` (~6 months) is
 * steadier but that steadiness is the problem: a block that never changes is a
 * hardcoded list with extra steps, and the whole point of replacing the written
 * favourites was to show something that moves.
 */
const TOP_ARTISTS_URL =
  "https://api.spotify.com/v1/me/top/artists?time_range=short_term&limit=8";

export interface NowPlaying {
  title: string;
  artist: string;
  album: string;
  url: string;
  /** Dominant colour is not available from the API; the caller picks one. */
  image: string | null;
  /** False when nothing is playing and this is the last thing that did. */
  isPlaying: boolean;
  /** Position within the track, ms. Zero for a recently-played fallback. */
  progressMs: number;
  /** Track length, ms. Zero when Spotify does not report one. */
  durationMs: number;
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
function readTrack(raw: unknown, isPlaying: boolean, progressMs = 0): NowPlaying | null {
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

  const durationMs =
    typeof t.duration_ms === "number" && Number.isFinite(t.duration_ms) ? t.duration_ms : 0;

  return {
    title,
    artist: artist || "unknown",
    album: typeof album.name === "string" ? album.name : "",
    url: typeof urls.spotify === "string" ? urls.spotify : "https://open.spotify.com",
    image,
    isPlaying,
    // Never let a stale or oversized position run past the end of the track —
    // the tonearm's position is derived from this and would swing off the disc.
    progressMs: durationMs ? Math.max(0, Math.min(progressMs, durationMs)) : Math.max(0, progressMs),
    durationMs,
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
    const json = (await live.json()) as {
      item?: unknown;
      is_playing?: unknown;
      progress_ms?: unknown;
    };
    const progress =
      typeof json.progress_ms === "number" && Number.isFinite(json.progress_ms)
        ? json.progress_ms
        : 0;
    const track = readTrack(json.item, json.is_playing === true, progress);
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

export interface TopArtist {
  name: string;
  url: string;
  /**
   * Smallest portrait Spotify offers, or null. They come in 640/320/160 and the
   * block draws them at 28px, so the 160 is already four times more than the
   * layout needs before the optimizer resizes it again.
   */
  image: string | null;
}

/**
 * The artists actually on rotation in the last four weeks.
 *
 * This replaces a written list of favourites on /play. A written list is a
 * claim; this is a measurement, and it is the more interesting of the two
 * precisely because it can embarrass its owner.
 *
 * Returns null rather than an empty array when it cannot answer, so the caller
 * can tell "no data" from "genuinely listened to nothing" and render nothing at
 * all instead of an empty heading. Every failure lands here: no credentials, a
 * refresh token minted before `user-top-read` was requested (which 403s), a
 * network error, or a response whose shape is not what the docs promise.
 */
export async function getTopArtists(): Promise<TopArtist[] | null> {
  const token = await accessToken();
  if (!token) return null;

  const res = await fetch(TOP_ARTISTS_URL, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  // A 403 here almost always means the refresh token predates the
  // `user-top-read` scope — see the note in /api/spotify/login.
  if (!res.ok) return null;

  const json = (await res.json()) as { items?: unknown };
  const items = Array.isArray(json.items) ? json.items : [];

  const artists = items
    .map((raw): TopArtist | null => {
      if (typeof raw !== "object" || raw === null) return null;
      const a = raw as Record<string, unknown>;
      if (typeof a.name !== "string" || !a.name) return null;
      const urls =
        typeof a.external_urls === "object" && a.external_urls !== null
          ? (a.external_urls as { spotify?: unknown })
          : {};

      // Images arrive largest-first. Take the smallest that exists rather than
      // indexing blindly — an artist with no portrait returns an empty array,
      // and one with only a 640 should still get a picture.
      const images = Array.isArray(a.images) ? a.images : [];
      const smallest = images
        .filter(
          (i): i is { url: string; width: number } =>
            typeof i === "object" &&
            i !== null &&
            typeof (i as { url?: unknown }).url === "string" &&
            typeof (i as { width?: unknown }).width === "number",
        )
        .sort((x, y) => x.width - y.width)[0];

      return {
        name: a.name,
        url: typeof urls.spotify === "string" ? urls.spotify : "https://open.spotify.com",
        image: smallest?.url ?? null,
      };
    })
    .filter((a): a is TopArtist => a !== null);

  return artists.length > 0 ? artists : null;
}

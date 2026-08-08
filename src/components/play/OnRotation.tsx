'use client'

import { useEffect, useState } from 'react'

import { COLORS, FONTS } from '@/styles/tokens'
import type { TopArtist } from '@/lib/spotify'

/**
 * "On repeat lately:" and then who, actually.
 *
 * This line used to end in five names typed into the source. A written list of
 * favourites is a claim, and claims about taste age quietly — the ones here had
 * been on the page long enough that nobody could say whether they were still
 * true. Same sentence, same position, but the names now come from the last four
 * weeks of listening via the credential the homepage record already uses.
 *
 * ── the label lives in here, not in the page ────────────────────────────────
 * Deliberately. Three states collapse to "render nothing": Spotify is not
 * configured, the refresh token predates the `user-top-read` scope, or the
 * request failed. If the page owned the words "On repeat lately:" then any of
 * those would leave a colon with nothing after it. Owning the label means the
 * whole sentence appears or none of it does.
 *
 * ── names only, no portraits ────────────────────────────────────────────────
 * Spotify does return an artist portrait, and this rendered them for a while as
 * 28px circles held to grayscale so eight full-colour photographs would not put
 * more uncontrolled colour on the page than the rest of the site carries in
 * total. They were unreadable: a desaturated photograph at 28px is a pale blob,
 * carrying no information and adding eight of them to a line whose whole value
 * is that it is quiet. The names are the data. `TopArtist.image` is still
 * fetched and typed, so this is one JSX element away if it is ever wanted at a
 * size where a face is actually legible.
 */

export default function OnRotation() {
  const [artists, setArtists] = useState<TopArtist[] | null>(null)

  useEffect(() => {
    let alive = true
    fetch('/api/spotify/top')
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { artists?: TopArtist[] | null } | null) => {
        if (alive && d?.artists?.length) setArtists(d.artists)
      })
      .catch(() => {
        /* silence is the designed failure — see above */
      })
    return () => {
      alive = false
    }
  }, [])

  if (!artists) return null

  return (
    <span className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">

      <span style={{ fontFamily: FONTS.body, color: COLORS.inkSoft }}>
        On repeat lately:
      </span>

      {artists.map((a) => (
        <a
          key={a.url}
          href={a.url}
          target="_blank"
          rel="noreferrer"
          className="or-item underline-offset-4 hover:underline"
          style={{ fontFamily: FONTS.mono, fontSize: '14px', color: COLORS.inkSoft }}
        >
          {a.name}
        </a>
      ))}
    </span>
  )
}

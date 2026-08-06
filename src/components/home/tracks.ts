export interface Track {
  title: string
  artist: string
  /** label stock colour, rgb */
  label: [number, number, number]
}

/**
 * Hardcoded on purpose — there is no Spotify call behind this.
 *
 * If it is ever wired to the real thing, the shape below is what the fetch has
 * to produce, and `label` should come from the album art's dominant colour
 * rather than being authored by hand.
 */
export const TRACKS: Track[] = [
  { title: 'As the World Caves In', artist: 'Matt Maltese', label: [189, 90, 60] },
  { title: 'Robbers', artist: 'The 1975', label: [219, 214, 203] },
  { title: 'Weird Fishes / Arpeggi', artist: 'Radiohead', label: [62, 92, 124] },
  { title: 'Smooth Operator', artist: 'Sade', label: [185, 148, 71] },
  { title: 'Doomsday', artist: 'MF DOOM', label: [76, 106, 86] },
]

export const HOLD_MS = 9000
export const FADE_MS = 420

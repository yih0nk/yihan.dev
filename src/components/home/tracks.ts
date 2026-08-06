/**
 * The record's resting label colour.
 *
 * There used to be a five-track rotation here that cycled every nine seconds
 * while Spotify was unconfigured. Spotify is configured now, so the only thing
 * that rotation could do was show a fake track for the half-second before the
 * real one arrived — and on every refresh you would see somebody else's song
 * under "now playing", which is the one thing a now-playing widget must never
 * do. A neutral label is honest about knowing nothing yet.
 */
export const RESTING_LABEL: [number, number, number] = [176, 178, 184]
